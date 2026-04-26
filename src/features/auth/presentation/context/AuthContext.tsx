import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { authRepository, SignUpInput } from '../../data/authRepository';
import { AuthUser } from '../../domain/models/User';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  initialising: boolean;
  signIn: (phone: string, password: string) => Promise<void>;
  signUp: (input: SignUpInput) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialising, setInitialising] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const restored = await authRepository.restoreSession();
        setUser(restored);
      } catch {
        setUser(null);
      } finally {
        setInitialising(false);
      }
    })();
  }, []);

  const signIn = useCallback(async (phone: string, password: string) => {
    setLoading(true);
    try {
      const u = await authRepository.signIn(phone, password);
      setUser(u);
    } finally {
      setLoading(false);
    }
  }, []);

  const signUp = useCallback(async (input: SignUpInput) => {
    setLoading(true);
    try {
      const u = await authRepository.signUp(input);
      setUser(u);
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      await authRepository.signOut();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!user) return;
    const fresh = await authRepository.fetchProfile(user.id);
    if (fresh) setUser(fresh);
  }, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, initialising, signIn, signUp, signOut, refresh }),
    [user, loading, initialising, signIn, signUp, signOut, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
