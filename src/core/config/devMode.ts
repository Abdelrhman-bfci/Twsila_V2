/**
 * Development mode toggle.
 *
 * When EXPO_PUBLIC_DEV_MODE === 'true' the app runs entirely against
 * in-memory dummy data — no Supabase calls, no auth, no network.
 */
export const isDevMode = (): boolean =>
  process.env.EXPO_PUBLIC_DEV_MODE === 'true';

export interface DevAccount {
  id: string;
  phone: string;
  password: string;
  name: string;
  role: 'passenger' | 'captain';
  email?: string;
}

export const DEV_ACCOUNTS: DevAccount[] = [
  {
    id: 'dev-passenger-1',
    phone: '+201111111111',
    password: 'twsila123',
    name: 'Yara El-Sayed',
    role: 'passenger',
    email: 'yara.passenger@twsila.dev',
  },
  {
    id: 'dev-passenger-2',
    phone: '+201222222222',
    password: 'twsila123',
    name: 'Omar Khaled',
    role: 'passenger',
    email: 'omar.passenger@twsila.dev',
  },
  {
    id: 'dev-captain-1',
    phone: '+201333333333',
    password: 'twsila123',
    name: 'Captain Ahmed Hassan',
    role: 'captain',
    email: 'ahmed.captain@twsila.dev',
  },
  {
    id: 'dev-captain-2',
    phone: '+201444444444',
    password: 'twsila123',
    name: 'Captain Mahmoud Ali',
    role: 'captain',
    email: 'mahmoud.captain@twsila.dev',
  },
];

export const findDevAccount = (
  phone: string,
  password: string
): DevAccount | undefined =>
  DEV_ACCOUNTS.find((a) => a.phone === phone && a.password === password);
