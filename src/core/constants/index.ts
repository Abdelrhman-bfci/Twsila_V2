export const APP_VERSION = '2.0.0';

export const UserRole = {
  Passenger: 'passenger',
  Captain: 'captain',
} as const;
export type UserRoleValue = (typeof UserRole)[keyof typeof UserRole];

export const TripStatus = {
  Open: 'open',
  Pricing: 'pricing',
  Bidding: 'bidding',
  Assigned: 'assigned',
  InProgress: 'in_progress',
  Completed: 'completed',
  Cancelled: 'cancelled',
} as const;
export type TripStatusValue = (typeof TripStatus)[keyof typeof TripStatus];

export const OfferStatus = {
  Pending: 'pending',
  Accepted: 'accepted',
  Rejected: 'rejected',
  Withdrawn: 'withdrawn',
  Expired: 'expired',
} as const;
export type OfferStatusValue = (typeof OfferStatus)[keyof typeof OfferStatus];

export const AttendanceStatus = {
  Pending: 'pending',
  Confirmed: 'confirmed',
  Declined: 'declined',
  NoShow: 'no_show',
  Completed: 'completed',
} as const;
export type AttendanceStatusValue =
  (typeof AttendanceStatus)[keyof typeof AttendanceStatus];

export const PassengerStatus = {
  Active: 'active',
  Left: 'left',
  Kicked: 'kicked',
} as const;

export const DAYS_OF_WEEK = [
  { value: 0, key: 'sun' },
  { value: 1, key: 'mon' },
  { value: 2, key: 'tue' },
  { value: 3, key: 'wed' },
  { value: 4, key: 'thu' },
  { value: 5, key: 'fri' },
  { value: 6, key: 'sat' },
] as const;

export const DEFAULT_TRIP_SEATS = 14;
export const DEFAULT_BASE_PRICE_PER_KM = 5;
export const DEFAULT_DEPARTURE_TIME = '08:00';
