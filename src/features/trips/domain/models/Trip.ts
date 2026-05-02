import { TripStatusValue, AttendanceStatusValue, OfferStatusValue } from '@core/constants';

export interface TripStop {
  id: string;
  trip_id: string;
  stop_order: number;
  address: string;
  lat?: number;
  lng?: number;
  distance_from_start_km?: number;
}

export interface TripScheduleDay {
  id: string;
  trip_id: string;
  day_of_week: number;
  is_active: boolean;
}

export interface TripPassenger {
  id: string;
  trip_id: string;
  user_id: string;
  user_name?: string;
  user_avatar?: string;
  user_phone?: string;
  pickup_address?: string;
  pickup_lat?: number;
  pickup_lng?: number;
  dropoff_address?: string;
  distance_km?: number;
  is_admin: boolean;
  status: 'active' | 'left' | 'kicked';
  joined_at: string;
}

export interface TripPassengerPricing {
  id: string;
  trip_id: string;
  user_id: string;
  trip_date?: string;
  price: number;
  set_by: string;
  updated_at: string;
}

export interface TripAttendance {
  id: string;
  trip_id: string;
  user_id: string;
  trip_date: string;
  status: AttendanceStatusValue;
  confirmed_at?: string;
  price_locked?: number;
  notes?: string;
}

export interface CaptainOffer {
  id: string;
  trip_id: string;
  captain_id: string;
  captain_name?: string;
  captain_avatar?: string;
  captain_phone?: string;
  captain_rating?: number;
  vehicle_label?: string;
  vehicle_seats?: number;
  offer_price: number;
  price_per_ride?: number;
  eta_minutes?: number;
  comment?: string;
  status: OfferStatusValue;
  created_at: string;
}

export interface Trip {
  id: string;
  name?: string;
  admin_id: string;
  admin_name?: string;
  start_address: string;
  start_lat?: number;
  start_lng?: number;
  end_address: string;
  end_lat?: number;
  end_lng?: number;
  active_from: string;
  active_to?: string;
  departure_time: string;
  total_seats: number;
  is_round_trip: boolean;
  status: TripStatusValue;
  captain_id?: string;
  captain_name?: string;
  captain_avatar?: string;
  captain_phone?: string;
  base_price_per_km?: number;
  distance_km?: number;
  notes?: string;
  created_at: string;
  updated_at: string;

  stops: TripStop[];
  schedule_days: number[];
  passengers: TripPassenger[];
  pricing: TripPassengerPricing[];
  attendance: TripAttendance[];
  offers: CaptainOffer[];
}

export interface TripSearchFilters {
  startQuery?: string;
  endQuery?: string;
  days?: number[];
}

export interface CreateTripInput {
  admin_id: string;
  name?: string;
  start_address: string;
  start_lat?: number;
  start_lng?: number;
  end_address: string;
  end_lat?: number;
  end_lng?: number;
  stops: { address: string; lat?: number; lng?: number; distance_from_start_km?: number }[];
  schedule_days: number[];
  active_from: string;
  active_to?: string;
  departure_time: string;
  total_seats: number;
  is_round_trip: boolean;
  base_price_per_km?: number;
  distance_km?: number;
  notes?: string;
}
