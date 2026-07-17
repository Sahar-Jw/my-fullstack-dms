
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
  profilePicture: string | null;
}

interface AuthState {
  user: SessionUser | null;
  token: string | null;
  mustChangePassword: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<LoginResponse>;
  setSession: (res: LoginResponse) => void;
  logout: () => void;
  markPasswordChanged: () => void;
  refreshUser: () => Promise<void>;
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
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setMustChangePassword(storedFlag === 'true');
    }
    setLoading(false);
  }, []);

  const applySession = useCallback((res: LoginResponse) => {
    const userData = {
      ...res.user,
      profilePicture: res.user.profilePicture || null,
    };
    window.localStorage.setItem('dms_token', res.accessToken);
    window.localStorage.setItem('dms_user', JSON.stringify(userData));
    window.localStorage.setItem('dms_must_change', String(res.mustChangePassword ?? false));
    setToken(res.accessToken);
    setUser(userData);
    setMustChangePassword(res.mustChangePassword ?? false);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await authApi.login(email, password);
      applySession(res);
      return res;
    },
    [applySession],
  );

  const setSession = useCallback(
    (res: LoginResponse) => {
      applySession(res);
    },
    [applySession],
  );

  // ✅ FIX: Logout redirects to landing page (/) using window.location
  const logout = useCallback(() => {
    authApi.logout().catch(() => {});
    
    // Clear storage immediately
    window.localStorage.removeItem('dms_token');
    window.localStorage.removeItem('dms_user');
    window.localStorage.removeItem('dms_must_change');
    setToken(null);
    setUser(null);
    setMustChangePassword(false);
    
    // ✅ Use window.location for a full page reload to landing page
    window.location.href = '/';
  }, []);

  const markPasswordChanged = useCallback(() => {
    window.localStorage.setItem('dms_must_change', 'false');
    setMustChangePassword(false);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    try {
      const { profileApi } = await import('./endpoints');
      const data = await profileApi.get();
      const updatedUser = {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role?.name as RoleName,
        departmentId: data.departmentId,
        department: data.department?.name || null,
        profilePicture: data.profilePicture || null,
      };
      setUser(updatedUser);
      window.localStorage.setItem('dms_user', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  }, [token]);

  return (
    <AuthContext.Provider
      value={{ 
        user, 
        token, 
        mustChangePassword, 
        loading, 
        login, 
        setSession, 
        logout, 
        markPasswordChanged,
        refreshUser,
      }}
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