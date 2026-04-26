-- ============================================================
-- Twsila V2 - Managed Trip / Trip-Admin / Captain Bidding model
-- ============================================================
-- This migration defines the complete schema for the V2 flow:
--
--   Roles:  passenger | captain  (no platform admin role)
--
--   Flow:
--    1. Passenger searches for an existing managed trip on a route.
--    2. If none exists, passenger creates a new managed trip and
--       becomes its TRIP ADMIN. The trip stores:
--         - start_point + end_point + ordered intermediate stops
--         - schedule_days  (the days-of-week the trip operates on)
--         - active_from / active_to window (extendable)
--    3. Other passengers can JOIN the trip. The trip admin sets a
--       per-passenger price-per-day (distance based) and total price.
--    4. Joined passengers must CONFIRM ATTENDANCE for each scheduled
--       day. Confirmation triggers the pricing/billing phase for
--       that specific day.
--    5. Captains browse the marketplace, filter by route, submit
--       bids (with comments) for a managed trip. The trip admin
--       reviews captain bids and ACCEPTS one to lock the captain.
-- ============================================================

-- ============================================================
-- Extensions
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Drop tables (child -> parent) for clean re-runs
-- ============================================================
DROP TABLE IF EXISTS public.captain_offers CASCADE;
DROP TABLE IF EXISTS public.trip_attendance CASCADE;
DROP TABLE IF EXISTS public.trip_passenger_pricing CASCADE;
DROP TABLE IF EXISTS public.trip_passengers CASCADE;
DROP TABLE IF EXISTS public.trip_schedule_days CASCADE;
DROP TABLE IF EXISTS public.trip_stops CASCADE;
DROP TABLE IF EXISTS public.trips CASCADE;
DROP TABLE IF EXISTS public.captains CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

DROP FUNCTION IF EXISTS public.is_trip_admin(UUID, UUID);
DROP FUNCTION IF EXISTS public.extend_trip_schedule(UUID, INT[], DATE, DATE);
DROP FUNCTION IF EXISTS public.confirm_attendance(UUID, DATE);
DROP FUNCTION IF EXISTS public.cancel_attendance(UUID, DATE);
DROP FUNCTION IF EXISTS public.set_passenger_daily_price(UUID, UUID, DATE, NUMERIC);
DROP FUNCTION IF EXISTS public.accept_captain_offer(UUID);
DROP FUNCTION IF EXISTS public.reject_captain_offer(UUID);

-- ============================================================
-- 1. USERS  (passengers + captains)
-- ============================================================
CREATE TABLE public.users (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    phone       TEXT NOT NULL UNIQUE,
    email       TEXT,
    role        TEXT NOT NULL CHECK (role IN ('passenger', 'captain')),
    avatar_url  TEXT,
    rating      NUMERIC(3,2) NOT NULL DEFAULT 5.00 CHECK (rating BETWEEN 0 AND 5),
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.users IS 'User profiles. role is either passenger or captain.';

-- ============================================================
-- 2. CAPTAINS  (vehicle profile for users with role=captain)
-- ============================================================
CREATE TABLE public.captains (
    user_id        UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    car_number     TEXT NOT NULL,
    car_model      TEXT,
    seats          INTEGER NOT NULL DEFAULT 14 CHECK (seats > 0),
    vehicle_type   TEXT NOT NULL DEFAULT 'microbus',
    license_number TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.captains IS 'Captain vehicle / license profile.';

-- ============================================================
-- 3. TRIPS  (a "Managed Trip" — created and run by a Trip Admin)
-- ============================================================
CREATE TABLE public.trips (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            TEXT,
    -- Trip Admin: the passenger who created the trip and manages it
    admin_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    -- Endpoints
    start_address   TEXT NOT NULL,
    start_lat       DOUBLE PRECISION,
    start_lng       DOUBLE PRECISION,
    end_address     TEXT NOT NULL,
    end_lat         DOUBLE PRECISION,
    end_lng         DOUBLE PRECISION,
    -- Operational window (extendable: admin can update active_to in the future)
    active_from     DATE NOT NULL DEFAULT CURRENT_DATE,
    active_to       DATE,
    -- Schedule helpers
    departure_time  TIME NOT NULL DEFAULT '08:00',
    total_seats     INTEGER NOT NULL DEFAULT 14 CHECK (total_seats > 0),
    -- Trip lifecycle
    status          TEXT NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open', 'pricing', 'bidding', 'assigned', 'in_progress', 'completed', 'cancelled')),
    -- Captain locked in by the trip admin (if any)
    captain_id      UUID REFERENCES public.users(id) ON DELETE SET NULL,
    -- Display / pricing helpers
    base_price_per_km NUMERIC(8,2),
    distance_km     NUMERIC(8,2),
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_trips_admin_id   ON public.trips(admin_id);
CREATE INDEX idx_trips_captain_id ON public.trips(captain_id);
CREATE INDEX idx_trips_status     ON public.trips(status);
CREATE INDEX idx_trips_route      ON public.trips(start_address, end_address);

COMMENT ON TABLE public.trips IS
    'A managed trip created by a passenger (Trip Admin). Contains route, schedule window and optional assigned captain.';
COMMENT ON COLUMN public.trips.active_to IS
    'Optional end date — Trip Admin can extend by updating this column.';

-- ============================================================
-- 4. TRIP STOPS  (ordered intermediate stations)
-- ============================================================
CREATE TABLE public.trip_stops (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id       UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    stop_order    INTEGER NOT NULL CHECK (stop_order >= 0),
    address       TEXT NOT NULL,
    lat           DOUBLE PRECISION,
    lng           DOUBLE PRECISION,
    distance_from_start_km NUMERIC(8,2),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(trip_id, stop_order)
);
CREATE INDEX idx_trip_stops_trip_id ON public.trip_stops(trip_id);
COMMENT ON TABLE public.trip_stops IS 'Ordered intermediate stops belonging to a trip.';

-- ============================================================
-- 5. TRIP SCHEDULE DAYS  (which weekdays the trip runs on)
-- ============================================================
-- day_of_week:  0=Sunday, 1=Monday, ... 6=Saturday  (Postgres DOW convention)
CREATE TABLE public.trip_schedule_days (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id     UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(trip_id, day_of_week)
);
CREATE INDEX idx_trip_schedule_days_trip_id ON public.trip_schedule_days(trip_id);
COMMENT ON TABLE public.trip_schedule_days IS
    'Days of the week the trip operates on. Trip Admin can add/remove/extend these at any time.';

-- ============================================================
-- 6. TRIP PASSENGERS  (who has joined which trip)
-- ============================================================
CREATE TABLE public.trip_passengers (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id         UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    pickup_address  TEXT,
    pickup_lat      DOUBLE PRECISION,
    pickup_lng      DOUBLE PRECISION,
    dropoff_address TEXT,
    dropoff_lat     DOUBLE PRECISION,
    dropoff_lng     DOUBLE PRECISION,
    -- distance from passenger pickup to trip end (used by admin to set price)
    distance_km     NUMERIC(8,2),
    is_admin        BOOLEAN NOT NULL DEFAULT FALSE,
    status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'left', 'kicked')),
    joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(trip_id, user_id)
);
CREATE INDEX idx_trip_passengers_trip_id ON public.trip_passengers(trip_id);
CREATE INDEX idx_trip_passengers_user_id ON public.trip_passengers(user_id);
COMMENT ON TABLE public.trip_passengers IS
    'Passengers (including the Trip Admin) attached to a trip. is_admin flags the Trip Admin row.';

-- ============================================================
-- 7. TRIP PASSENGER PRICING  (per-passenger, per-day price)
-- ============================================================
-- trip_date NULL => default daily price for that passenger.
-- trip_date set => override for a specific date.
CREATE TABLE public.trip_passenger_pricing (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id     UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    trip_date   DATE,
    price       NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    set_by      UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(trip_id, user_id, trip_date)
);
CREATE INDEX idx_pricing_trip_id ON public.trip_passenger_pricing(trip_id);
CREATE INDEX idx_pricing_user_id ON public.trip_passenger_pricing(user_id);
COMMENT ON TABLE public.trip_passenger_pricing IS
    'Trip Admin sets a price per passenger per ride (optionally per specific date) based on distance.';

-- ============================================================
-- 8. TRIP ATTENDANCE  (daily confirmation per passenger)
-- ============================================================
CREATE TABLE public.trip_attendance (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id       UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    trip_date     DATE NOT NULL,
    status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'confirmed', 'declined', 'no_show', 'completed')),
    confirmed_at  TIMESTAMPTZ,
    price_locked  NUMERIC(10,2),
    notes         TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(trip_id, user_id, trip_date)
);
CREATE INDEX idx_attendance_trip_date ON public.trip_attendance(trip_id, trip_date);
CREATE INDEX idx_attendance_user_id   ON public.trip_attendance(user_id);
COMMENT ON TABLE public.trip_attendance IS
    'One row per passenger per scheduled day. Confirmation by the passenger triggers pricing.';

-- ============================================================
-- 9. CAPTAIN OFFERS  (bids a captain submits for a trip)
-- ============================================================
CREATE TABLE public.captain_offers (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id      UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    captain_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    -- The captain's price for the whole trip / period.
    offer_price  NUMERIC(10,2) NOT NULL CHECK (offer_price > 0),
    -- The captain's price per single ride / day, optional.
    price_per_ride NUMERIC(10,2),
    eta_minutes  INTEGER,
    comment      TEXT,
    status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn', 'expired')),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(trip_id, captain_id)
);
CREATE INDEX idx_offers_trip_id    ON public.captain_offers(trip_id);
CREATE INDEX idx_offers_captain_id ON public.captain_offers(captain_id);
CREATE INDEX idx_offers_status     ON public.captain_offers(status);
COMMENT ON TABLE public.captain_offers IS
    'A captain submits a bid (price + comment) for a managed trip. The Trip Admin accepts one.';

-- ============================================================
-- 10. FUNCTIONS
-- ============================================================

-- Returns true if user is the Trip Admin of trip.
CREATE OR REPLACE FUNCTION public.is_trip_admin(p_trip_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_admin UUID;
BEGIN
    SELECT admin_id INTO v_admin FROM public.trips WHERE id = p_trip_id;
    RETURN v_admin = p_user_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;


-- Trip Admin extends or replaces the trip schedule (days of week + window).
CREATE OR REPLACE FUNCTION public.extend_trip_schedule(
    p_trip_id   UUID,
    p_days      INT[],
    p_active_from DATE DEFAULT NULL,
    p_active_to   DATE DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_admin UUID;
    v_d INT;
BEGIN
    SELECT admin_id INTO v_admin FROM public.trips WHERE id = p_trip_id;
    IF v_admin IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Trip not found');
    END IF;
    IF v_admin <> auth.uid() THEN
        RETURN jsonb_build_object('success', false, 'message', 'Only the Trip Admin can change the schedule');
    END IF;

    -- Insert any new days (additive - we don't delete existing ones unless caller passes a smaller set)
    IF p_days IS NOT NULL THEN
        FOREACH v_d IN ARRAY p_days LOOP
            INSERT INTO public.trip_schedule_days(trip_id, day_of_week)
            VALUES (p_trip_id, v_d)
            ON CONFLICT (trip_id, day_of_week) DO UPDATE SET is_active = TRUE;
        END LOOP;
    END IF;

    UPDATE public.trips
       SET active_from = COALESCE(p_active_from, active_from),
           active_to   = COALESCE(p_active_to,   active_to),
           updated_at  = NOW()
     WHERE id = p_trip_id;

    RETURN jsonb_build_object('success', true, 'message', 'Schedule updated');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Passenger confirms attendance for a date (creates row if missing).
CREATE OR REPLACE FUNCTION public.confirm_attendance(
    p_trip_id   UUID,
    p_trip_date DATE
)
RETURNS JSONB AS $$
DECLARE
    v_user UUID := auth.uid();
    v_price NUMERIC(10,2);
    v_attendance_id UUID;
BEGIN
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Not authenticated');
    END IF;

    -- Must be a member of the trip
    IF NOT EXISTS (
        SELECT 1 FROM public.trip_passengers
         WHERE trip_id = p_trip_id AND user_id = v_user AND status = 'active'
    ) THEN
        RETURN jsonb_build_object('success', false, 'message', 'You are not a member of this trip');
    END IF;

    -- Find passenger price (date specific OR default)
    SELECT price INTO v_price
      FROM public.trip_passenger_pricing
     WHERE trip_id = p_trip_id AND user_id = v_user
       AND (trip_date = p_trip_date OR trip_date IS NULL)
     ORDER BY trip_date NULLS LAST
     LIMIT 1;

    INSERT INTO public.trip_attendance(trip_id, user_id, trip_date, status, confirmed_at, price_locked)
    VALUES (p_trip_id, v_user, p_trip_date, 'confirmed', NOW(), v_price)
    ON CONFLICT (trip_id, user_id, trip_date)
    DO UPDATE SET
        status        = 'confirmed',
        confirmed_at  = NOW(),
        price_locked  = COALESCE(public.trip_attendance.price_locked, EXCLUDED.price_locked)
    RETURNING id INTO v_attendance_id;

    -- Move trip to "pricing" status whenever someone confirms (so Admin gets a notification).
    UPDATE public.trips
       SET status = CASE WHEN status = 'open' THEN 'pricing' ELSE status END,
           updated_at = NOW()
     WHERE id = p_trip_id;

    RETURN jsonb_build_object(
        'success', true,
        'attendance_id', v_attendance_id,
        'price_locked', v_price
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Passenger declines attendance for a specific date.
CREATE OR REPLACE FUNCTION public.cancel_attendance(
    p_trip_id   UUID,
    p_trip_date DATE
)
RETURNS JSONB AS $$
DECLARE
    v_user UUID := auth.uid();
BEGIN
    IF v_user IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Not authenticated');
    END IF;

    INSERT INTO public.trip_attendance(trip_id, user_id, trip_date, status)
    VALUES (p_trip_id, v_user, p_trip_date, 'declined')
    ON CONFLICT (trip_id, user_id, trip_date)
    DO UPDATE SET status = 'declined', confirmed_at = NULL;

    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Trip Admin sets a passenger's price (for a date or as default with NULL).
CREATE OR REPLACE FUNCTION public.set_passenger_daily_price(
    p_trip_id   UUID,
    p_user_id   UUID,
    p_trip_date DATE,
    p_price     NUMERIC
)
RETURNS JSONB AS $$
DECLARE
    v_caller UUID := auth.uid();
BEGIN
    IF NOT public.is_trip_admin(p_trip_id, v_caller) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Only Trip Admin can set prices');
    END IF;

    INSERT INTO public.trip_passenger_pricing(trip_id, user_id, trip_date, price, set_by)
    VALUES (p_trip_id, p_user_id, p_trip_date, p_price, v_caller)
    ON CONFLICT (trip_id, user_id, trip_date)
    DO UPDATE SET price = EXCLUDED.price, set_by = v_caller, updated_at = NOW();

    -- Sync the locked price on any pending/confirmed attendance row for that date.
    IF p_trip_date IS NOT NULL THEN
        UPDATE public.trip_attendance
           SET price_locked = p_price
         WHERE trip_id = p_trip_id
           AND user_id = p_user_id
           AND trip_date = p_trip_date;
    END IF;

    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Trip Admin accepts a captain offer (locks the captain on the trip).
CREATE OR REPLACE FUNCTION public.accept_captain_offer(p_offer_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_caller     UUID := auth.uid();
    v_trip_id    UUID;
    v_captain_id UUID;
BEGIN
    SELECT trip_id, captain_id INTO v_trip_id, v_captain_id
      FROM public.captain_offers
     WHERE id = p_offer_id;

    IF v_trip_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Offer not found');
    END IF;

    IF NOT public.is_trip_admin(v_trip_id, v_caller) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Only Trip Admin can accept offers');
    END IF;

    UPDATE public.captain_offers
       SET status = 'accepted', updated_at = NOW()
     WHERE id = p_offer_id;

    UPDATE public.captain_offers
       SET status = 'rejected', updated_at = NOW()
     WHERE trip_id = v_trip_id AND id <> p_offer_id AND status = 'pending';

    UPDATE public.trips
       SET captain_id = v_captain_id,
           status     = 'assigned',
           updated_at = NOW()
     WHERE id = v_trip_id;

    RETURN jsonb_build_object('success', true, 'captain_id', v_captain_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Trip Admin rejects a single captain offer.
CREATE OR REPLACE FUNCTION public.reject_captain_offer(p_offer_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_caller  UUID := auth.uid();
    v_trip_id UUID;
BEGIN
    SELECT trip_id INTO v_trip_id FROM public.captain_offers WHERE id = p_offer_id;
    IF v_trip_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Offer not found');
    END IF;
    IF NOT public.is_trip_admin(v_trip_id, v_caller) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Only Trip Admin can reject offers');
    END IF;

    UPDATE public.captain_offers
       SET status = 'rejected', updated_at = NOW()
     WHERE id = p_offer_id;

    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 11. ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.users                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.captains                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_stops               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_schedule_days       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_passengers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_passenger_pricing   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_attendance          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.captain_offers           ENABLE ROW LEVEL SECURITY;

-- USERS
CREATE POLICY "users_select_all"  ON public.users FOR SELECT USING (true);
CREATE POLICY "users_insert_self" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update_self" ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- CAPTAINS
CREATE POLICY "captains_select_all"  ON public.captains FOR SELECT USING (true);
CREATE POLICY "captains_insert_self" ON public.captains FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "captains_update_self" ON public.captains FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- TRIPS — visible to everyone (so passengers and captains can browse)
CREATE POLICY "trips_select_all" ON public.trips FOR SELECT USING (true);
CREATE POLICY "trips_insert_self_admin" ON public.trips FOR INSERT WITH CHECK (auth.uid() = admin_id);
CREATE POLICY "trips_update_admin_or_captain" ON public.trips FOR UPDATE
    USING (auth.uid() = admin_id OR auth.uid() = captain_id);
CREATE POLICY "trips_delete_admin" ON public.trips FOR DELETE USING (auth.uid() = admin_id);

-- TRIP STOPS — visible to all, mutable by Admin only
CREATE POLICY "stops_select_all" ON public.trip_stops FOR SELECT USING (true);
CREATE POLICY "stops_modify_admin" ON public.trip_stops FOR ALL
    USING (EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_id AND t.admin_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_id AND t.admin_id = auth.uid()));

-- SCHEDULE DAYS
CREATE POLICY "sched_select_all" ON public.trip_schedule_days FOR SELECT USING (true);
CREATE POLICY "sched_modify_admin" ON public.trip_schedule_days FOR ALL
    USING (EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_id AND t.admin_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_id AND t.admin_id = auth.uid()));

-- TRIP PASSENGERS
CREATE POLICY "tp_select_all" ON public.trip_passengers FOR SELECT USING (true);
CREATE POLICY "tp_insert_self" ON public.trip_passengers FOR INSERT
    WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tp_update_self_or_admin" ON public.trip_passengers FOR UPDATE
    USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_id AND t.admin_id = auth.uid()))
    WITH CHECK (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_id AND t.admin_id = auth.uid()));
CREATE POLICY "tp_delete_self_or_admin" ON public.trip_passengers FOR DELETE
    USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_id AND t.admin_id = auth.uid()));

-- PRICING
CREATE POLICY "pricing_select_member" ON public.trip_passenger_pricing FOR SELECT
    USING (
        auth.uid() = user_id
        OR EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_id AND t.admin_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_id AND t.captain_id = auth.uid())
    );
CREATE POLICY "pricing_modify_admin" ON public.trip_passenger_pricing FOR ALL
    USING (EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_id AND t.admin_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_id AND t.admin_id = auth.uid()));

-- ATTENDANCE
CREATE POLICY "attend_select_member" ON public.trip_attendance FOR SELECT
    USING (
        auth.uid() = user_id
        OR EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_id AND (t.admin_id = auth.uid() OR t.captain_id = auth.uid()))
    );
CREATE POLICY "attend_insert_self" ON public.trip_attendance FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "attend_update_self_or_admin" ON public.trip_attendance FOR UPDATE
    USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_id AND t.admin_id = auth.uid()))
    WITH CHECK (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_id AND t.admin_id = auth.uid()));

-- CAPTAIN OFFERS
CREATE POLICY "offers_select_all" ON public.captain_offers FOR SELECT USING (true);
CREATE POLICY "offers_insert_self_captain" ON public.captain_offers FOR INSERT
    WITH CHECK (auth.uid() = captain_id);
CREATE POLICY "offers_update_captain_or_admin" ON public.captain_offers FOR UPDATE
    USING (
        auth.uid() = captain_id
        OR EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_id AND t.admin_id = auth.uid())
    )
    WITH CHECK (
        auth.uid() = captain_id
        OR EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_id AND t.admin_id = auth.uid())
    );
CREATE POLICY "offers_delete_captain" ON public.captain_offers FOR DELETE USING (auth.uid() = captain_id);

-- ============================================================
-- 12. REALTIME
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.trips;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_passengers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_attendance;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_passenger_pricing;
ALTER PUBLICATION supabase_realtime ADD TABLE public.captain_offers;
