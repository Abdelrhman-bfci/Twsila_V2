import { DEV_ACCOUNTS } from '@core/config/devMode';
import {
  AttendanceStatus,
  OfferStatus,
  TripStatus,
} from '@core/constants';
import { AuthUser, CaptainProfile, User } from '@features/auth/domain/models/User';
import {
  CaptainOffer,
  Trip,
  TripAttendance,
  TripPassenger,
  TripPassengerPricing,
  TripStop,
} from '@features/trips/domain/models/Trip';

/**
 * In-memory dummy store used when EXPO_PUBLIC_DEV_MODE === 'true'.
 * Mutations on these arrays survive for the lifetime of the JS bundle,
 * which is enough to exercise the V2 flows end-to-end.
 */

const today = new Date();
const isoDate = (d: Date) => d.toISOString().split('T')[0];
const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

export const dummyUsers: User[] = [
  ...DEV_ACCOUNTS.map((a) => ({
    id: a.id,
    name: a.name,
    phone: a.phone,
    email: a.email,
    role: a.role,
    rating: 4.8,
    is_verified: true,
    created_at: '2025-09-01T08:00:00Z',
  })),
  {
    id: 'dev-passenger-3',
    name: 'Noor Ibrahim',
    phone: '+201555555555',
    role: 'passenger',
    rating: 4.9,
    is_verified: true,
    created_at: '2025-09-15T08:00:00Z',
  },
];

export const dummyCaptains: CaptainProfile[] = [
  {
    user_id: 'dev-captain-1',
    car_number: 'ABC 1234',
    car_model: 'Mercedes Sprinter 2023',
    seats: 14,
    vehicle_type: 'microbus',
    created_at: '2025-09-01T08:00:00Z',
  },
  {
    user_id: 'dev-captain-2',
    car_number: 'XYZ 7788',
    car_model: 'Toyota Hiace 2022',
    seats: 12,
    vehicle_type: 'microbus',
    created_at: '2025-09-01T08:00:00Z',
  },
];

const tripId1 = 'trip-1';
const tripId2 = 'trip-2';
const tripId3 = 'trip-3';

const stops1: TripStop[] = [
  {
    id: 'stop-1-1',
    trip_id: tripId1,
    stop_order: 0,
    address: 'Maadi - Road 9',
    lat: 29.9614,
    lng: 31.2543,
    distance_from_start_km: 4,
  },
  {
    id: 'stop-1-2',
    trip_id: tripId1,
    stop_order: 1,
    address: 'Nasr City - Hassan Maamoun',
    lat: 30.0596,
    lng: 31.3308,
    distance_from_start_km: 12,
  },
];

const passengers1: TripPassenger[] = [
  {
    id: 'tp-1-admin',
    trip_id: tripId1,
    user_id: 'dev-passenger-1',
    user_name: 'Yara El-Sayed',
    pickup_address: 'New Cairo - Fifth Settlement',
    distance_km: 0,
    is_admin: true,
    status: 'active',
    joined_at: '2025-10-12T08:00:00Z',
  },
  {
    id: 'tp-1-omar',
    trip_id: tripId1,
    user_id: 'dev-passenger-2',
    user_name: 'Omar Khaled',
    pickup_address: 'Maadi - Road 9',
    distance_km: 4,
    is_admin: false,
    status: 'active',
    joined_at: '2025-10-13T09:00:00Z',
  },
  {
    id: 'tp-1-noor',
    trip_id: tripId1,
    user_id: 'dev-passenger-3',
    user_name: 'Noor Ibrahim',
    pickup_address: 'Nasr City - Hassan Maamoun',
    distance_km: 12,
    is_admin: false,
    status: 'active',
    joined_at: '2025-10-14T07:30:00Z',
  },
];

const pricing1: TripPassengerPricing[] = [
  {
    id: 'pr-1-omar',
    trip_id: tripId1,
    user_id: 'dev-passenger-2',
    price: 35,
    set_by: 'dev-passenger-1',
    updated_at: '2025-10-15T08:00:00Z',
  },
  {
    id: 'pr-1-noor',
    trip_id: tripId1,
    user_id: 'dev-passenger-3',
    price: 55,
    set_by: 'dev-passenger-1',
    updated_at: '2025-10-15T08:00:00Z',
  },
];

const attendance1: TripAttendance[] = [
  {
    id: 'at-1-yara-today',
    trip_id: tripId1,
    user_id: 'dev-passenger-1',
    trip_date: isoDate(today),
    status: AttendanceStatus.Pending,
  },
  {
    id: 'at-1-omar-today',
    trip_id: tripId1,
    user_id: 'dev-passenger-2',
    trip_date: isoDate(today),
    status: AttendanceStatus.Confirmed,
    confirmed_at: today.toISOString(),
    price_locked: 35,
  },
  {
    id: 'at-1-noor-today',
    trip_id: tripId1,
    user_id: 'dev-passenger-3',
    trip_date: isoDate(today),
    status: AttendanceStatus.Confirmed,
    confirmed_at: today.toISOString(),
    price_locked: 55,
  },
];

const offers1: CaptainOffer[] = [
  {
    id: 'of-1-cap1',
    trip_id: tripId1,
    captain_id: 'dev-captain-1',
    captain_name: 'Captain Ahmed Hassan',
    captain_rating: 4.9,
    vehicle_label: 'Mercedes Sprinter 2023',
    vehicle_seats: 14,
    offer_price: 1200,
    price_per_ride: 100,
    eta_minutes: 12,
    comment: 'Reliable on this route. AC + wifi onboard.',
    status: OfferStatus.Pending,
    created_at: '2025-10-21T08:00:00Z',
  },
  {
    id: 'of-1-cap2',
    trip_id: tripId1,
    captain_id: 'dev-captain-2',
    captain_name: 'Captain Mahmoud Ali',
    captain_rating: 4.7,
    vehicle_label: 'Toyota Hiace 2022',
    vehicle_seats: 12,
    offer_price: 1080,
    price_per_ride: 90,
    eta_minutes: 18,
    comment: 'Best price for the period. 12 seats only.',
    status: OfferStatus.Pending,
    created_at: '2025-10-21T11:00:00Z',
  },
];

export const dummyTrips: Trip[] = [
  {
    id: tripId1,
    name: 'New Cairo → AUC Daily',
    admin_id: 'dev-passenger-1',
    admin_name: 'Yara El-Sayed',
    start_address: 'New Cairo - Fifth Settlement',
    start_lat: 30.0131,
    start_lng: 31.4914,
    end_address: 'AUC New Cairo Campus',
    end_lat: 30.0192,
    end_lng: 31.4998,
    active_from: isoDate(addDays(today, -7)),
    active_to: isoDate(addDays(today, 21)),
    departure_time: '07:30',
    total_seats: 14,
    status: TripStatus.Bidding,
    base_price_per_km: 5,
    distance_km: 22,
    created_at: '2025-10-12T08:00:00Z',
    updated_at: '2025-10-21T11:00:00Z',
    stops: stops1,
    schedule_days: [0, 1, 2, 3, 4],
    passengers: passengers1,
    pricing: pricing1,
    attendance: attendance1,
    offers: offers1,
  },
  {
    id: tripId2,
    name: '6 October → GUC',
    admin_id: 'dev-passenger-2',
    admin_name: 'Omar Khaled',
    start_address: '6th October - Sheikh Zayed',
    start_lat: 30.0584,
    start_lng: 30.9764,
    end_address: 'GUC Main Campus',
    end_lat: 29.9870,
    end_lng: 31.4400,
    active_from: isoDate(addDays(today, -3)),
    active_to: isoDate(addDays(today, 30)),
    departure_time: '08:00',
    total_seats: 12,
    status: TripStatus.Open,
    base_price_per_km: 4.5,
    distance_km: 28,
    created_at: '2025-10-15T08:00:00Z',
    updated_at: '2025-10-20T08:00:00Z',
    stops: [
      {
        id: 'stop-2-1',
        trip_id: tripId2,
        stop_order: 0,
        address: 'Sheikh Zayed - Beverly Hills',
        lat: 30.0470,
        lng: 30.9920,
        distance_from_start_km: 6,
      },
    ],
    schedule_days: [0, 2, 4],
    passengers: [
      {
        id: 'tp-2-admin',
        trip_id: tripId2,
        user_id: 'dev-passenger-2',
        user_name: 'Omar Khaled',
        pickup_address: '6th October - Sheikh Zayed',
        distance_km: 0,
        is_admin: true,
        status: 'active',
        joined_at: '2025-10-15T08:00:00Z',
      },
    ],
    pricing: [],
    attendance: [],
    offers: [],
  },
  {
    id: tripId3,
    name: 'Heliopolis → Cairo Univ.',
    admin_id: 'dev-passenger-1',
    admin_name: 'Yara El-Sayed',
    start_address: 'Heliopolis - Triumph Square',
    start_lat: 30.0900,
    start_lng: 31.3220,
    end_address: 'Cairo University - Giza',
    end_lat: 30.0265,
    end_lng: 31.2103,
    active_from: isoDate(addDays(today, -1)),
    active_to: isoDate(addDays(today, 60)),
    departure_time: '07:15',
    total_seats: 14,
    status: TripStatus.Pricing,
    base_price_per_km: 5,
    distance_km: 19,
    created_at: '2025-10-18T08:00:00Z',
    updated_at: '2025-10-21T08:00:00Z',
    stops: [
      {
        id: 'stop-3-1',
        trip_id: tripId3,
        stop_order: 0,
        address: 'Abbasia Square',
        lat: 30.0716,
        lng: 31.2779,
        distance_from_start_km: 5,
      },
      {
        id: 'stop-3-2',
        trip_id: tripId3,
        stop_order: 1,
        address: 'Tahrir Square',
        lat: 30.0444,
        lng: 31.2357,
        distance_from_start_km: 11,
      },
    ],
    schedule_days: [1, 3, 5],
    passengers: [
      {
        id: 'tp-3-admin',
        trip_id: tripId3,
        user_id: 'dev-passenger-1',
        user_name: 'Yara El-Sayed',
        pickup_address: 'Heliopolis - Triumph Square',
        distance_km: 0,
        is_admin: true,
        status: 'active',
        joined_at: '2025-10-18T08:00:00Z',
      },
    ],
    pricing: [],
    attendance: [],
    offers: [],
  },
];

export const findUserById = (id: string): AuthUser | undefined => {
  const u = dummyUsers.find((x) => x.id === id);
  if (!u) return undefined;
  const captain = dummyCaptains.find((c) => c.user_id === id);
  return { ...u, captain };
};

export const findTripById = (id: string): Trip | undefined =>
  dummyTrips.find((t) => t.id === id);
