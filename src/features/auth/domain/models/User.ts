import { UserRoleValue } from '@core/constants';

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: UserRoleValue;
  avatar_url?: string;
  rating: number;
  is_verified: boolean;
  created_at: string;
}

export interface CaptainProfile {
  user_id: string;
  car_number: string;
  car_model?: string;
  seats: number;
  vehicle_type: string;
  license_number?: string;
  created_at: string;
}

export interface AuthUser extends User {
  captain?: CaptainProfile;
}
