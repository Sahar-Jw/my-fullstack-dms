'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { RoleName } from '@/lib/types';
import AppShell from './AppShell';

export default function RequireAuth({
  children,
  allow,
}: {
  children: ReactNode;
  /** If provided, only these roles may view the page. */
  allow?: RoleName[];
}) {
  const { user, token, mustChangePassword, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!token || !user) {
      router.replace('/login');
      return;
    }
    if (mustChangePassword && pathname !== '/force-change-password') {
      router.replace('/force-change-password');
    }
  }, [loading, token, user, mustChangePassword, pathname, router]);

  if (loading || !token || !user) {
    return (
      <div className="center-loading" style={{ minHeight: '100vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (mustChangePassword) {
    return (
      <div className="center-loading" style={{ minHeight: '100vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (allow && !allow.includes(user.role)) {
    return (
      <AppShell>
        <div className="empty-state">
          <div className="empty-state-title">Access restricted</div>
          <p>Your role ({user.role}) does not have permission to view this page.</p>
        </div>
      </AppShell>
    );
  }

  return <AppShell>{children}</AppShell>;
}
