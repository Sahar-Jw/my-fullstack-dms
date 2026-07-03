'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '../../context/AppContext';
import Sidebar from '../../components/layout/Sidebar';
import Topbar from '../../components/layout/Topbar';

const ADMIN_ONLY_PREFIXES = ['/users', '/departments', '/categories'];

export default function AppLayout({ children }) {
  const { isAuthenticated, role } = useApp();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    // Bounce non-admin roles away from admin-only pages, mirroring the
    // prototype's setRole() behaviour.
    if (role !== 'admin' && ADMIN_ONLY_PREFIXES.some((p) => pathname.startsWith(p))) {
      router.replace('/dashboard');
    }
  }, [role, pathname, router]);

  if (!isAuthenticated) return null;

  return (
    <div id="app">
      <div className="shell">
        <Sidebar />
        <div className="main">
          <Topbar />
          <div className="content">{children}</div>
        </div>
      </div>
    </div>
  );
}
