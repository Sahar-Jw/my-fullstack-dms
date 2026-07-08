'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '../../context/AppContext';
import Sidebar from '../../components/layout/Sidebar';
import Topbar from '../../components/layout/Topbar';

const ADMIN_ONLY_PREFIXES = ['/users', '/departments', '/categories'];

export default function AppLayout({ children }) {
  const { isAuthenticated, role } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
      <div className="flex min-h-screen flex-col bg-[#f6f3ec] lg:flex-row">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex min-h-screen flex-1 flex-col">
          <Topbar onMenuClick={() => setSidebarOpen(true)} />
          <div className="flex-1 p-4 sm:p-5 lg:p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
