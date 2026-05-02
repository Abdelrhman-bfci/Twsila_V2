-- Migration to add is_round_trip column to trips table
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS is_round_trip BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.trips.is_round_trip IS 'Flag indicating if the trip is a round trip (true) or one-way (false).';
