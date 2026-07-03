'use client';

import { createContext, useCallback, useContext, useRef, useState } from 'react';
const ROLE_INFO = {
  admin: { name: 'Admin', permissions: [] },
  manager: { name: 'Manager', permissions: [] },
  employee: { name: 'Employee', permissions: [] }
};
const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRoleState] = useState('admin');
  const [toast, setToast] = useState({ message: '', show: false });
  const toastTimer = useRef(null);

  const login = useCallback((r) => {
    setRoleState(r);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
  }, []);

  const setRole = useCallback((r) => {
    setRoleState(r);
  }, []);

  const showToast = useCallback((message) => {
    setToast({ message, show: true });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, show: false })), 2600);
  }, []);

  const value = {
    isAuthenticated,
    role,
    roleInfo: ROLE_INFO[role],
    login,
    logout,
    setRole,
    toast,
    showToast,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within an AppProvider');
  return ctx;
}
