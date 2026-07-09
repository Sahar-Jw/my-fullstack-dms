'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { initials } from '@/lib/format';

const NAV_ITEMS: { href: string; label: string; roles?: string[] }[] = [
  { href: '/', label: 'Dashboard' },
  { href: '/documents', label: 'Documents' },
  { href: '/folders', label: 'Folders' },
  { href: '/categories', label: 'Categories' },
  { href: '/departments', label: 'Departments', roles: ['Admin'] },
  { href: '/users', label: 'Users', roles: ['Admin'] },
];

const TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/documents': 'Documents',
  '/folders': 'Folders',
  '/categories': 'Categories',
  '/departments': 'Departments',
  '/users': 'Users',
};

function pageTitle(pathname: string): string {
  if (TITLES[pathname]) return TITLES[pathname];
  if (pathname.startsWith('/documents')) return 'Documents';
  return 'Ledger';
}

export default function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="app-shell">
      {sidebarOpen && (
        <button
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside className={`sidebar${sidebarOpen ? ' is-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-mark" />
          <div className="sidebar-brand-text">
            Ledger
            <small>Document System</small>
          </div>
        </div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(user?.role || '')).map(
            (item) => {
              const active =
                item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-link${active ? ' active' : ''}`}
                >
                  {item.label}
                </Link>
              );
            },
          )}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <span className="sidebar-user-name">{user?.name}</span>
            <span className="sidebar-user-role">
              {user?.role}
              {user?.department ? ` · ${user.department}` : ''}
            </span>
          </div>
          <button className="sidebar-logout" onClick={logout}>
            Log out
          </button>
        </div>
      </aside>
      <div className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="topbar-menu"
              type="button"
              aria-label="Open navigation"
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen(true)}
            >
              <span />
              <span />
              <span />
            </button>
            <div className="topbar-title">{pageTitle(pathname)}</div>
          </div>
          <div className="topbar-profile" title={user?.name}>
            <div className="topbar-avatar">{initials(user?.name || '')}</div>
            <div className="topbar-profile-text">
              <span>{user?.name || 'Profile'}</span>
              <small>
                {user?.role}
                {user?.department ? ` - ${user.department}` : ''}
              </small>
            </div>
          </div>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
