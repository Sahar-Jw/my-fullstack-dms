'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from './endpoints';
import { LoginResponse, RoleName } from './types';

interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: RoleName;
  departmentId: number | null;
  department: string | null;
}

interface AuthState {
  user: SessionUser | null;
  token: string | null;
  mustChangePassword: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<LoginResponse>;
  logout: () => void;
  markPasswordChanged: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedToken = window.localStorage.getItem('dms_token');
    const storedUser = window.localStorage.getItem('dms_user');
    const storedFlag = window.localStorage.getItem('dms_must_change');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setMustChangePassword(storedFlag === 'true');
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    window.localStorage.setItem('dms_token', res.accessToken);
    window.localStorage.setItem('dms_user', JSON.stringify(res.user));
    window.localStorage.setItem('dms_must_change', String(res.mustChangePassword));
    setToken(res.accessToken);
    setUser(res.user);
    setMustChangePassword(res.mustChangePassword);
    return res;
  }, []);

  const logout = useCallback(() => {
    authApi.logout().catch(() => {});
    window.localStorage.removeItem('dms_token');
    window.localStorage.removeItem('dms_user');
    window.localStorage.removeItem('dms_must_change');
    setToken(null);
    setUser(null);
    setMustChangePassword(false);
    router.push('/login');
  }, [router]);

  const markPasswordChanged = useCallback(() => {
    window.localStorage.setItem('dms_must_change', 'false');
    setMustChangePassword(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, token, mustChangePassword, loading, login, logout, markPasswordChanged }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
