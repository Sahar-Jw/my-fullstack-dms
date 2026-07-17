'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, useEffect, useState, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useLocale } from '@/lib/i18n/locale-provider';
import { initials } from '@/lib/format';
import { User, LogOut, Languages } from 'lucide-react';

const NAV_ITEMS: { href: string; labelKey: string; roles?: string[] }[] = [
  { href: '/dashboard', labelKey: 'nav.dashboard' },
  { href: '/documents', labelKey: 'nav.documents' },
  { href: '/folders', labelKey: 'nav.folders' },
  { href: '/categories', labelKey: 'nav.categories' },
  { href: '/departments', labelKey: 'nav.departments', roles: ['Admin'] },
  { href: '/users', labelKey: 'nav.users', roles: ['Admin'] },
  { href: '/activity-logs', labelKey: 'nav.activityLogs', roles: ['Admin', 'Manager'] },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const { user, logout, refreshUser } = useAuth();
  const { locale, setLocale, t } = useLocale();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const menuToggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    refreshUser();
  }, []);

  useEffect(() => {
    if (user?.profilePicture) {
      setImageError(false);
    }
  }, [user?.profilePicture]);

  useEffect(() => {
    setMenuOpen(false);
    setDropdownOpen(false);
  }, [pathname]);

  // ✅ Click outside handler for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ✅ NEW: Click outside handler for mobile menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is outside the mobile menu AND outside the toggle button
      const target = event.target as Node;
      const isMenuClick = mobileMenuRef.current && mobileMenuRef.current.contains(target);
      const isToggleClick = menuToggleRef.current && menuToggleRef.current.contains(target);
      
      // If click is outside both the menu and the toggle, close the menu
      if (!isMenuClick && !isToggleClick) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  useEffect(() => {
    setImageError(false);
  }, [user?.profilePicture]);

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
    setImageError(true);
  };

  const toggleLocale = () => {
    setLocale(locale === 'en' ? 'ar' : 'en');
  };

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
                  {t(item.labelKey)}
                </Link>
              );
            })}
          </nav>

          <div className="navbar-right">
            <button
              className="navbar-lang-toggle"
              onClick={toggleLocale}
              title={locale === 'en' ? 'التحويل إلى العربية' : 'Switch to English'}
              aria-label="Toggle language"
            >
              <Languages size={16} />
              <span>{locale === 'en' ? 'العربية' : 'English'}</span>
            </button>

            <div className="navbar-profile-wrapper">
              <div className="navbar-profile-container">
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
                      <span className="navbar-avatar-text">{initials(user?.name || '')}</span>
                    )}
                  </div>
                </button>

                <div className="navbar-avatar mobile-only">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={user?.name || 'User'}
                      className="w-full h-full rounded-full object-cover"
                      onError={handleImageError}
                    />
                  ) : (
                    <span className="navbar-avatar-text">{initials(user?.name || '')}</span>
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
                          <span className="dropdown-avatar-text">{initials(user?.name || '')}</span>
                        )}
                      </div>
                      <div className="dropdown-user-info">
                        <span className="dropdown-user-name">{user?.name || 'User'}</span>
                        <span className="dropdown-user-email">{user?.email || ''}</span>
                        <span className="dropdown-user-role">{user?.role || ''}</span>
                      </div>
                    </div>

                    <div className="dropdown-divider" />

                    <Link href="/profile" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                      <User className="dropdown-item-icon" size={16} />
                      {t('nav.profileSettings')}
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
                      {t('nav.logout')}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <button
              ref={menuToggleRef} // ✅ Add ref to toggle button
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
          <div className="navbar-mobile-menu" ref={mobileMenuRef}> {/* ✅ Add ref to mobile menu */}
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
                  {t(item.labelKey)}
                </Link>
              );
            })}

            <div className="navbar-mobile-divider" />
            <Link href="/profile" className="navbar-mobile-link" onClick={() => setMenuOpen(false)}>
              <User size={16} className="inline mr-2" />
              {t('nav.profileSettings')}
            </Link>
            <button
              className="navbar-mobile-logout"
              onClick={() => {
                setMenuOpen(false);
                logout();
              }}
            >
              <LogOut size={16} className="inline mr-2" />
              {t('nav.logout')}
            </button>
          </div>
        )}
      </header>

      <main className="content">{children}</main>
    </div>
  );
}