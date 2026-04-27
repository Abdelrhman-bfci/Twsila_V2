import AsyncStorage from '@react-native-async-storage/async-storage';
import { isDevMode, findDevAccount } from '@core/config/devMode';
import { supabase } from '@core/config/supabase';
import { dummyCaptains, dummyUsers } from '@core/data/dummyStore';
import { UserRoleValue } from '@core/constants';
import { AuthUser, CaptainProfile, User } from '../domain/models/User';

const SESSION_KEY = '@twsila_v2_session_user';

const persistDevSession = (user: AuthUser | null) =>
  user
    ? AsyncStorage.setItem(SESSION_KEY, JSON.stringify(user))
    : AsyncStorage.removeItem(SESSION_KEY);

export interface SignUpInput {
  name: string;
  phone: string;
  password: string;
  email?: string;
  role: UserRoleValue;
  captain?: {
    car_number: string;
    car_model?: string;
    seats?: number;
  };
}

export const authRepository = {
  async restoreSession(): Promise<AuthUser | null> {
    if (isDevMode()) {
      const raw = await AsyncStorage.getItem(SESSION_KEY);
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    }
    const { data } = await supabase.auth.getSession();
    if (!data.session?.user) return null;
    return await authRepository.fetchProfile(data.session.user.id);
  },

  async fetchProfile(userId: string): Promise<AuthUser | null> {
    if (isDevMode()) {
      const u = dummyUsers.find((x) => x.id === userId);
      if (!u) return null;
      const captain = dummyCaptains.find((c) => c.user_id === userId);
      return { ...u, captain };
    }
    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    if (error || !profile) return null;
    let captain: CaptainProfile | undefined;
    if (profile.role === 'captain') {
      const { data: cp } = await supabase
        .from('captains')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (cp) captain = cp as CaptainProfile;
    }
    return { ...(profile as User), captain };
  },

  async signIn(phone: string, password: string): Promise<AuthUser> {
    if (isDevMode()) {
      const account = findDevAccount(phone, password);
      if (!account) throw new Error('Invalid phone or password');
      const user: AuthUser = {
        id: account.id,
        name: account.name,
        phone: account.phone,
        email: account.email,
        role: account.role,
        rating: 4.8,
        is_verified: true,
        created_at: '2025-09-01T08:00:00Z',
        captain: dummyCaptains.find((c) => c.user_id === account.id),
      };
      await persistDevSession(user);
      return user;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      phone,
      password,
    });
    if (error || !data.user) throw error || new Error('Login failed');
    const profile = await authRepository.fetchProfile(data.user.id);
    if (!profile) throw new Error('Profile not found');
    return profile;
  },

  async signUp(input: SignUpInput): Promise<AuthUser> {
    if (isDevMode()) {
      const newUser: AuthUser = {
        id: `dev-${input.role}-${Date.now()}`,
        name: input.name,
        phone: input.phone,
        email: input.email,
        role: input.role,
        rating: 5,
        is_verified: false,
        created_at: new Date().toISOString(),
        captain: input.role === 'captain' && input.captain
          ? {
              user_id: `dev-${input.role}-${Date.now()}`,
              car_number: input.captain.car_number,
              car_model: input.captain.car_model,
              seats: input.captain.seats || 14,
              vehicle_type: 'microbus',
              created_at: new Date().toISOString(),
            }
          : undefined,
      };
      dummyUsers.push({
        id: newUser.id,
        name: newUser.name,
        phone: newUser.phone,
        email: newUser.email,
        role: newUser.role,
        rating: newUser.rating,
        is_verified: newUser.is_verified,
        created_at: newUser.created_at,
      });
      if (newUser.captain) dummyCaptains.push(newUser.captain);
      await persistDevSession(newUser);
      return newUser;
    }

    const { data, error } = await supabase.auth.signUp({
      phone: input.phone,
      password: input.password,
    });
    if (error || !data.user) throw error || new Error('Sign-up failed');

    await supabase.from('users').insert({
      id: data.user.id,
      name: input.name,
      phone: input.phone,
      email: input.email,
      role: input.role,
    });
    if (input.role === 'captain' && input.captain) {
      await supabase.from('captains').insert({
        user_id: data.user.id,
        car_number: input.captain.car_number,
        car_model: input.captain.car_model,
        seats: input.captain.seats || 14,
      });
    }

    const profile = await authRepository.fetchProfile(data.user.id);
    if (!profile) throw new Error('Profile creation failed');
    return profile;
  },

  async signOut(): Promise<void> {
    if (isDevMode()) {
      await persistDevSession(null);
      return;
    }
    await supabase.auth.signOut();
  },
};
