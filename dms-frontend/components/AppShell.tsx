'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, useEffect, useState, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useLocale } from '@/lib/i18n/locale-provider';
import { useSettings } from '@/lib/settings-context';
import { profileApi } from '@/lib/endpoints';
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
  { href: '/settings', labelKey: 'nav.settings', roles: ['Admin'] },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const { user, logout, refreshUser } = useAuth();
  const { locale, setLocale, t } = useLocale();
  const { settings, logoUrl } = useSettings();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  // The avatar bytes now live in Postgres and are served through an
  // authenticated route, so we fetch them as a blob URL instead of
  // pointing straight at a static file path.
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const menuToggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    refreshUser();
  }, []);

  useEffect(() => {
    if (user?.profilePictureMime) {
      setImageError(false);
    }
  }, [user?.profilePictureMime]);

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
  }, [user?.profilePictureMime]);

  // Fetch (and clean up) the avatar blob whenever the user's picture changes.
  useEffect(() => {
    let activeUrl: string | null = null;
    let cancelled = false;

    if (user?.profilePictureMime) {
      profileApi
        .getPictureUrl()
        .then(({ url }) => {
          if (cancelled) {
            window.URL.revokeObjectURL(url);
            return;
          }
          activeUrl = url;
          setImageUrl(url);
        })
        .catch(() => {
          if (!cancelled) setImageUrl(null);
        });
    } else {
      setImageUrl(null);
    }

    return () => {
      cancelled = true;
      if (activeUrl) window.URL.revokeObjectURL(activeUrl);
    };
  }, [user?.profilePictureMime]);

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(user?.role || ''),
  );

  const displayImageUrl = !imageError ? imageUrl : null;

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
            {logoUrl ? (
              <img src={logoUrl} alt={settings?.siteName || 'Logo'} className="navbar-brand-logo" />
            ) : (
              <div className="auth-mark" />
            )}
            <span className="navbar-brand-text">{settings?.siteName || 'Ledger'}</span>
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
                    {displayImageUrl ? (
                      <img
                        src={displayImageUrl}
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
                  {displayImageUrl ? (
                    <img
                      src={displayImageUrl}
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
                        {displayImageUrl ? (
                          <img
                            src={displayImageUrl}
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
