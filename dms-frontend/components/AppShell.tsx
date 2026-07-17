
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, useEffect, useState, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { initials } from '@/lib/format';
import { User, LogOut } from 'lucide-react';

const NAV_ITEMS: { href: string; label: string; roles?: string[] }[] = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/documents', label: 'Documents' },
  { href: '/folders', label: 'Folders' },
  { href: '/categories', label: 'Categories' },
  { href: '/departments', label: 'Departments', roles: ['Admin'] },
  { href: '/users', label: 'Users', roles: ['Admin'] },
  { href: '/activity-logs', label: 'Activity Logs', roles: ['Admin', 'Manager'] },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const { user, logout, refreshUser } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ✅ Refresh user data when component mounts (after login)
  useEffect(() => {
    refreshUser();
  }, []);

  // ✅ Also refresh when user object changes (profile updates)
  useEffect(() => {
    if (user?.profilePicture) {
      setImageError(false);
    }
  }, [user?.profilePicture]);

  useEffect(() => {
    setMenuOpen(false);
    setDropdownOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(user?.role || ''),
  );

  const getProfileImageUrl = () => {
    if (user?.profilePicture && !imageError) {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
      return `${baseUrl}/uploads/profile-pictures/${user.profilePicture}`;
    }
    return null;
  };

  const imageUrl = getProfileImageUrl();

  const handleImageError = () => {
    console.error('❌ Image failed to load, showing initials instead');
    setImageError(true);
  };

  // ✅ Reset image error when user changes
  useEffect(() => {
    setImageError(false);
  }, [user?.profilePicture]);

  return (
    <div className="app-shell">
      <header className="navbar">
        <div className="navbar-inner">
          <div className="navbar-brand">
            <div className="auth-mark" />
            <span className="navbar-brand-text">Ledger</span>
          </div>

          <nav className="navbar-links">
            {visibleItems.map((item) => {
              const active =
                item.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`navbar-link${active ? ' active' : ''}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="navbar-right">
            <div className="navbar-profile-wrapper">
              <div className="navbar-profile-container">
                {/* Desktop: clickable button with dropdown */}
                <button
                  className="navbar-profile-btn desktop-only"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  title={user?.name}
                >
                  <div className="navbar-avatar">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={user?.name || 'User'}
                        className="w-full h-full rounded-full object-cover"
                        onError={handleImageError}
                      />
                    ) : (
                      <span className="navbar-avatar-text">
                        {initials(user?.name || '')}
                      </span>
                    )}
                  </div>
                </button>

                {/* Mobile: just the avatar (not clickable) */}
                <div className="navbar-avatar mobile-only">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={user?.name || 'User'}
                      className="w-full h-full rounded-full object-cover"
                      onError={handleImageError}
                    />
                  ) : (
                    <span className="navbar-avatar-text">
                      {initials(user?.name || '')}
                    </span>
                  )}
                </div>

                {dropdownOpen && (
                  <div className="dropdown-menu" ref={dropdownRef}>
                    <div className="dropdown-header">
                      <div className="dropdown-avatar">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={user?.name || 'User'}
                            className="w-full h-full rounded-full object-cover"
                            onError={handleImageError}
                          />
                        ) : (
                          <span className="dropdown-avatar-text">
                            {initials(user?.name || '')}
                          </span>
                        )}
                      </div>
                      <div className="dropdown-user-info">
                        <span className="dropdown-user-name">{user?.name || 'User'}</span>
                        <span className="dropdown-user-email">{user?.email || ''}</span>
                        <span className="dropdown-user-role">{user?.role || ''}</span>
                      </div>
                    </div>

                    <div className="dropdown-divider" />

                    <Link
                      href="/profile"
                      className="dropdown-item"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <User className="dropdown-item-icon" size={16} />
                      Profile Settings
                    </Link>

                    <div className="dropdown-divider" />

                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        logout();
                      }}
                      className="dropdown-item dropdown-item-danger"
                    >
                      <LogOut className="dropdown-item-icon" size={16} />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>

            <button
              className="navbar-menu-toggle"
              type="button"
              aria-label="Toggle navigation"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="navbar-mobile-menu">
            {visibleItems.map((item) => {
              const active =
                item.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`navbar-mobile-link${active ? ' active' : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
            
            <div className="navbar-mobile-divider" />
            <Link
              href="/profile"
              className="navbar-mobile-link"
              onClick={() => setMenuOpen(false)}
            >
              <User size={16} className="inline mr-2" />
              Profile Settings
            </Link>
            <button
              className="navbar-mobile-logout"
              onClick={() => {
                setMenuOpen(false);
                logout();
              }}
            >
              <LogOut size={16} className="inline mr-2" />
              Logout
            </button>
          </div>
        )}
      </header>

      <main className="content">{children}</main>
    </div>
  );
}