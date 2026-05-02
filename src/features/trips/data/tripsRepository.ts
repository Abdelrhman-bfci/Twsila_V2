import { isDevMode } from '@core/config/devMode';
import { supabase } from '@core/config/supabase';
import { dummyTrips } from '@core/data/dummyStore';
import {
  AttendanceStatus,
  OfferStatus,
  TripStatus,
} from '@core/constants';
import {
  CaptainOffer,
  CreateTripInput,
  Trip,
  TripPassenger,
  TripPassengerPricing,
  TripSearchFilters,
  TripStop,
} from '../domain/models/Trip';

const matchText = (haystack: string, needle?: string) =>
  !needle || haystack.toLowerCase().includes(needle.trim().toLowerCase());

const cloneTrip = (t: Trip): Trip => ({
  ...t,
  stops: [...t.stops],
  schedule_days: [...t.schedule_days],
  passengers: [...t.passengers],
  pricing: [...t.pricing],
  attendance: [...t.attendance],
  offers: [...t.offers],
});

const tripRelationsQuery = `
  *,
  stops:trip_stops(*),
  schedule_days:trip_schedule_days(*),
  passengers:trip_passengers(*, user:users(name, avatar_url, phone)),
  pricing:trip_passenger_pricing(*),
  attendance:trip_attendance(*),
  offers:captain_offers(*),
  captain:users!captain_id(name, avatar_url, phone)
`;

const mapDbTripToModel = (data: any): Trip => {
  return {
    ...data,
    stops: (data.stops || []).sort((a: any, b: any) => a.stop_order - b.stop_order),
    schedule_days: (data.schedule_days || []).map((d: any) => d.day_of_week).sort(),
    passengers: (data.passengers || []).map((p: any) => ({
      ...p,
      user_name: p.user?.name,
      user_avatar: p.user?.avatar_url,
      user_phone: p.user?.phone,
      user: undefined,
    })),
    captain_name: data.captain?.name || data.captain_name,
    captain_avatar: data.captain?.avatar_url,
    captain_phone: data.captain?.phone,
    pricing: data.pricing || [],
    attendance: data.attendance || [],
    offers: data.offers || [],
  } as Trip;
};

export const tripsRepository = {
  async listTrips(filters: TripSearchFilters = {}): Promise<Trip[]> {
    if (isDevMode()) {
      return dummyTrips
        .filter(
          (t) =>
            matchText(t.start_address, filters.startQuery) &&
            matchText(t.end_address, filters.endQuery)
        )
        .filter(
          (t) =>
            !filters.days?.length ||
            filters.days.some((d) => t.schedule_days.includes(d))
        )
        .map(cloneTrip);
    }

    let query = supabase.from('trips').select(tripRelationsQuery);
    if (filters.startQuery)
      query = query.ilike('start_address', `%${filters.startQuery}%`);
    if (filters.endQuery)
      query = query.ilike('end_address', `%${filters.endQuery}%`);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(mapDbTripToModel);
  },

  async getTrip(id: string): Promise<Trip | null> {
    if (isDevMode()) {
      const t = dummyTrips.find((x) => x.id === id);
      return t ? cloneTrip(t) : null;
    }
    const { data, error } = await supabase.from('trips').select(tripRelationsQuery).eq('id', id).single();
    if (error || !data) return null;
    return mapDbTripToModel(data);
  },

  async listTripsForUser(userId: string): Promise<Trip[]> {
    if (isDevMode()) {
      return dummyTrips
        .filter(
          (t) =>
            t.admin_id === userId ||
            t.passengers.some((p) => p.user_id === userId)
        )
        .map(cloneTrip);
    }
    const { data: passengerRows } = await supabase
      .from('trip_passengers')
      .select('trip_id')
      .eq('user_id', userId);
    const ids = (passengerRows || []).map((r: any) => r.trip_id);
    if (!ids.length) return [];
    const { data } = await supabase
      .from('trips')
      .select(tripRelationsQuery)
      .in('id', ids);
    return (data || []).map(mapDbTripToModel);
  },

  async listTripsForCaptain(filters: TripSearchFilters = {}): Promise<Trip[]> {
    if (isDevMode()) {
      return dummyTrips
        .filter(
          (t) =>
            (t.status === TripStatus.Pricing ||
              t.status === TripStatus.Bidding ||
              t.status === TripStatus.Open) &&
            matchText(t.start_address, filters.startQuery) &&
            matchText(t.end_address, filters.endQuery)
        )
        .map(cloneTrip);
    }
    let q = supabase
      .from('trips')
      .select(tripRelationsQuery)
      .in('status', [TripStatus.Open, TripStatus.Pricing, TripStatus.Bidding]);
    if (filters.startQuery) q = q.ilike('start_address', `%${filters.startQuery}%`);
    if (filters.endQuery) q = q.ilike('end_address', `%${filters.endQuery}%`);
    const { data } = await q;
    return (data || []).map(mapDbTripToModel);
  },

  async createTrip(input: CreateTripInput): Promise<Trip> {
    if (isDevMode()) {
      const newId = `trip-${Date.now()}`;
      const now = new Date().toISOString();
      const stops: TripStop[] = input.stops.map((s, i) => ({
        id: `stop-${newId}-${i}`,
        trip_id: newId,
        stop_order: i,
        address: s.address,
        lat: s.lat,
        lng: s.lng,
        distance_from_start_km: s.distance_from_start_km,
      }));
      const adminPassenger: TripPassenger = {
        id: `tp-${newId}-admin`,
        trip_id: newId,
        user_id: input.admin_id,
        pickup_address: input.start_address,
        distance_km: 0,
        is_admin: true,
        status: 'active',
        joined_at: now,
      };
      const trip: Trip = {
        id: newId,
        name: input.name,
        admin_id: input.admin_id,
        start_address: input.start_address,
        start_lat: input.start_lat,
        start_lng: input.start_lng,
        end_address: input.end_address,
        end_lat: input.end_lat,
        end_lng: input.end_lng,
        active_from: input.active_from,
        active_to: input.active_to,
        departure_time: input.departure_time,
        total_seats: input.total_seats,
        is_round_trip: input.is_round_trip,
        status: TripStatus.Open,
        base_price_per_km: input.base_price_per_km,
        distance_km: input.distance_km,
        notes: input.notes,
        created_at: now,
        updated_at: now,
        stops,
        schedule_days: [...input.schedule_days].sort(),
        passengers: [adminPassenger],
        pricing: [],
        attendance: [],
        offers: [],
      };
      dummyTrips.unshift(trip);
      return cloneTrip(trip);
    }

    const { data: tripRow, error } = await supabase
      .from('trips')
      .insert({
        name: input.name,
        admin_id: input.admin_id,
        start_address: input.start_address,
        start_lat: input.start_lat,
        start_lng: input.start_lng,
        end_address: input.end_address,
        end_lat: input.end_lat,
        end_lng: input.end_lng,
        active_from: input.active_from,
        active_to: input.active_to,
        departure_time: input.departure_time,
        total_seats: input.total_seats,
        is_round_trip: input.is_round_trip,
        base_price_per_km: input.base_price_per_km,
        distance_km: input.distance_km,
        notes: input.notes,
      })
      .select('*')
      .single();
    if (error || !tripRow) throw error || new Error('Could not create trip');

    if (input.stops.length) {
      await supabase.from('trip_stops').insert(
        input.stops.map((s, i) => ({
          trip_id: tripRow.id,
          stop_order: i,
          address: s.address,
          lat: s.lat,
          lng: s.lng,
          distance_from_start_km: s.distance_from_start_km,
        }))
      );
    }
    if (input.schedule_days.length) {
      await supabase.from('trip_schedule_days').insert(
        input.schedule_days.map((d) => ({ trip_id: tripRow.id, day_of_week: d }))
      );
    }
    await supabase.from('trip_passengers').insert({
      trip_id: tripRow.id,
      user_id: input.admin_id,
      pickup_address: input.start_address,
      is_admin: true,
    });

    const fresh = await tripsRepository.getTrip(tripRow.id);
    if (!fresh) throw new Error('Trip created but could not be fetched');
    return fresh;
  },

  async extendSchedule(
    tripId: string,
    days: number[],
    activeTo?: string
  ): Promise<void> {
    if (isDevMode()) {
      const t = dummyTrips.find((x) => x.id === tripId);
      if (!t) return;
      const set = new Set([...t.schedule_days, ...days]);
      t.schedule_days = Array.from(set).sort();
      if (activeTo) t.active_to = activeTo;
      t.updated_at = new Date().toISOString();
      return;
    }
    await supabase.rpc('extend_trip_schedule', {
      p_trip_id: tripId,
      p_days: days,
      p_active_to: activeTo || null,
    });
  },

  async joinTrip(
    tripId: string,
    userId: string,
    pickup_address?: string,
    distance_km?: number
  ): Promise<void> {
    if (isDevMode()) {
      const t = dummyTrips.find((x) => x.id === tripId);
      if (!t) return;
      if (t.passengers.find((p) => p.user_id === userId)) return;
      t.passengers.push({
        id: `tp-${tripId}-${userId}`,
        trip_id: tripId,
        user_id: userId,
        pickup_address,
        distance_km,
        is_admin: false,
        status: 'active',
        joined_at: new Date().toISOString(),
      });
      t.updated_at = new Date().toISOString();
      return;
    }
    await supabase.from('trip_passengers').insert({
      trip_id: tripId,
      user_id: userId,
      pickup_address,
      distance_km,
    });
  },

  async leaveTrip(tripId: string, userId: string): Promise<void> {
    if (isDevMode()) {
      const t = dummyTrips.find((x) => x.id === tripId);
      if (!t) return;
      t.passengers = t.passengers.filter((p) => p.user_id !== userId);
      return;
    }
    await supabase
      .from('trip_passengers')
      .delete()
      .eq('trip_id', tripId)
      .eq('user_id', userId);
  },

  async confirmAttendance(
    tripId: string,
    userId: string,
    tripDate: string
  ): Promise<void> {
    if (isDevMode()) {
      const t = dummyTrips.find((x) => x.id === tripId);
      if (!t) return;
      const existing = t.attendance.find(
        (a) => a.user_id === userId && a.trip_date === tripDate
      );
      const pricing = t.pricing.find((p) => p.user_id === userId);
      if (existing) {
        existing.status = AttendanceStatus.Confirmed;
        existing.confirmed_at = new Date().toISOString();
        existing.price_locked = existing.price_locked ?? pricing?.price;
      } else {
        t.attendance.push({
          id: `at-${tripId}-${userId}-${tripDate}`,
          trip_id: tripId,
          user_id: userId,
          trip_date: tripDate,
          status: AttendanceStatus.Confirmed,
          confirmed_at: new Date().toISOString(),
          price_locked: pricing?.price,
        });
      }
      if (t.status === TripStatus.Open) t.status = TripStatus.Pricing;
      t.updated_at = new Date().toISOString();
      return;
    }
    await supabase.rpc('confirm_attendance', {
      p_trip_id: tripId,
      p_trip_date: tripDate,
    });
  },

  async cancelAttendance(
    tripId: string,
    userId: string,
    tripDate: string
  ): Promise<void> {
    if (isDevMode()) {
      const t = dummyTrips.find((x) => x.id === tripId);
      if (!t) return;
      const existing = t.attendance.find(
        (a) => a.user_id === userId && a.trip_date === tripDate
      );
      if (existing) {
        existing.status = AttendanceStatus.Declined;
        existing.confirmed_at = undefined;
      } else {
        t.attendance.push({
          id: `at-${tripId}-${userId}-${tripDate}`,
          trip_id: tripId,
          user_id: userId,
          trip_date: tripDate,
          status: AttendanceStatus.Declined,
        });
      }
      t.updated_at = new Date().toISOString();
      return;
    }
    await supabase.rpc('cancel_attendance', {
      p_trip_id: tripId,
      p_trip_date: tripDate,
    });
  },

  async setPassengerPrice(
    tripId: string,
    userId: string,
    price: number,
    setBy: string,
    tripDate?: string
  ): Promise<void> {
    if (isDevMode()) {
      const t = dummyTrips.find((x) => x.id === tripId);
      if (!t) return;
      const existing = t.pricing.find(
        (p) => p.user_id === userId && p.trip_date === tripDate
      );
      const now = new Date().toISOString();
      if (existing) {
        existing.price = price;
        existing.set_by = setBy;
        existing.updated_at = now;
      } else {
        t.pricing.push({
          id: `pr-${tripId}-${userId}-${tripDate || 'default'}`,
          trip_id: tripId,
          user_id: userId,
          trip_date: tripDate,
          price,
          set_by: setBy,
          updated_at: now,
        });
      }
      if (tripDate) {
        t.attendance
          .filter((a) => a.user_id === userId && a.trip_date === tripDate)
          .forEach((a) => (a.price_locked = price));
      }
      return;
    }
    await supabase.rpc('set_passenger_daily_price', {
      p_trip_id: tripId,
      p_user_id: userId,
      p_trip_date: tripDate || null,
      p_price: price,
    });
  },

  async submitOffer(input: {
    trip_id: string;
    captain_id: string;
    captain_name: string;
    vehicle_label?: string;
    vehicle_seats?: number;
    captain_rating?: number;
    offer_price: number;
    price_per_ride?: number;
    eta_minutes?: number;
    comment?: string;
  }): Promise<CaptainOffer> {
    if (isDevMode()) {
      const t = dummyTrips.find((x) => x.id === input.trip_id);
      if (!t) throw new Error('Trip not found');
      const existing = t.offers.find((o) => o.captain_id === input.captain_id);
      const offer: CaptainOffer = existing || {
        id: `of-${input.trip_id}-${input.captain_id}`,
        trip_id: input.trip_id,
        captain_id: input.captain_id,
        offer_price: input.offer_price,
        price_per_ride: input.price_per_ride,
        eta_minutes: input.eta_minutes,
        comment: input.comment,
        captain_name: input.captain_name,
        vehicle_label: input.vehicle_label,
        vehicle_seats: input.vehicle_seats,
        captain_rating: input.captain_rating,
        status: OfferStatus.Pending,
        created_at: new Date().toISOString(),
      };
      offer.offer_price = input.offer_price;
      offer.price_per_ride = input.price_per_ride;
      offer.eta_minutes = input.eta_minutes;
      offer.comment = input.comment;
      offer.captain_name = input.captain_name;
      offer.vehicle_label = input.vehicle_label;
      offer.vehicle_seats = input.vehicle_seats;
      offer.captain_rating = input.captain_rating;
      offer.status = OfferStatus.Pending;
      if (!existing) t.offers.push(offer);
      if (t.status === TripStatus.Open || t.status === TripStatus.Pricing)
        t.status = TripStatus.Bidding;
      t.updated_at = new Date().toISOString();
      return { ...offer };
    }
    const { data, error } = await supabase
      .from('captain_offers')
      .upsert(
        {
          trip_id: input.trip_id,
          captain_id: input.captain_id,
          offer_price: input.offer_price,
          price_per_ride: input.price_per_ride,
          eta_minutes: input.eta_minutes,
          comment: input.comment,
          status: OfferStatus.Pending,
        },
        { onConflict: 'trip_id,captain_id' }
      )
      .select('*')
      .single();
    if (error || !data) throw error || new Error('Offer failed');
    return data as unknown as CaptainOffer;
  },

  async acceptOffer(offerId: string): Promise<void> {
    if (isDevMode()) {
      for (const t of dummyTrips) {
        const offer = t.offers.find((o) => o.id === offerId);
        if (!offer) continue;
        offer.status = OfferStatus.Accepted;
        t.offers
          .filter((o) => o.id !== offerId && o.status === OfferStatus.Pending)
          .forEach((o) => (o.status = OfferStatus.Rejected));
        t.captain_id = offer.captain_id;
        t.captain_name = offer.captain_name;
        t.status = TripStatus.Assigned;
        t.updated_at = new Date().toISOString();
        return;
      }
      return;
    }
    await supabase.rpc('accept_captain_offer', { p_offer_id: offerId });
  },

  async rejectOffer(offerId: string): Promise<void> {
    if (isDevMode()) {
      for (const t of dummyTrips) {
        const offer = t.offers.find((o) => o.id === offerId);
        if (!offer) continue;
        offer.status = OfferStatus.Rejected;
        t.updated_at = new Date().toISOString();
        return;
      }
      return;
    }
    await supabase.rpc('reject_captain_offer', { p_offer_id: offerId });
  },

  async listMyOffers(captainId: string): Promise<CaptainOffer[]> {
    if (isDevMode()) {
      return dummyTrips.flatMap((t) =>
        t.offers.filter((o) => o.captain_id === captainId).map((o) => ({ ...o }))
      );
    }
    const { data } = await supabase
      .from('captain_offers')
      .select('*')
      .eq('captain_id', captainId);
    return (data || []) as unknown as CaptainOffer[];
  },
};
