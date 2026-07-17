// app/page.tsx
'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useLocale } from '@/lib/i18n/locale-provider';
import { Languages } from 'lucide-react';


export default function LandingPage() {
  const { token, mustChangePassword, loading } = useAuth();
  const router = useRouter();
  const { locale, setLocale, t } = useLocale();



  const toggleLocale = () => {
    setLocale(locale === 'en' ? 'ar' : 'en');
  };

  useEffect(() => {
    if (loading) return;
    if (token) {
      router.replace(mustChangePassword ? '/force-change-password' : '/dashboard');
    }
  }, [loading, token, mustChangePassword, router]);

  if (loading) {
    return (
      <div className="center-loading" style={{ minHeight: '100vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (token) {
    // About to redirect via the effect above — render nothing to avoid a flash of the landing page.
    return (
      <div className="center-loading" style={{ minHeight: '100vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="landing">
      <header className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-brand">
            <span className="auth-mark" style={{ width: 28, height: 28 }} />
            <span className="landing-brand-name">{t('landing.brandName')}</span>
          </div>
          <div className="landing-nav-actions">
            <Link className="link-btn" href="/login">
              {t('landing.signIn')}
            </Link>
            <Link className="btn btn-primary btn-sm" href="/register">
              {t('landing.getStarted')}
            </Link>
            <button
              className="navbar-lang-toggle"
              onClick={toggleLocale}
              title={locale === 'en' ? 'التحويل إلى العربية' : 'Switch to English'}
              aria-label="Toggle language"
            >
              <Languages size={16} />
              <span>{locale === 'en' ? 'العربية' : 'English'}</span>
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="landing-hero">
          <span className="page-eyebrow">{t('landing.eyebrow')}</span>
          <h1 className="landing-title">{t('landing.heroTitle')}</h1>
          <p className="landing-subtitle">{t('landing.heroSubtitle')}</p>
          <div className="landing-hero-actions">
            <Link className="btn btn-primary btn-lg" href="/register">
              {t('landing.createAccount')}
            </Link>
            <Link className="btn btn-secondary btn-lg" href="/login">
              {t('landing.signIn')}
            </Link>
          </div>
        </section>

        <section className="landing-features">
          <div className="landing-feature">
            <h3>{t('landing.feature1Title')}</h3>
            <p>{t('landing.feature1Body')}</p>
          </div>
          <div className="landing-feature">
            <h3>{t('landing.feature2Title')}</h3>
            <p>{t('landing.feature2Body')}</p>
          </div>
          <div className="landing-feature">
            <h3>{t('landing.feature3Title')}</h3>
            <p>{t('landing.feature3Body')}</p>
          </div>
        </section>

        <section className="landing-cta">
          <h2>{t('landing.ctaTitle')}</h2>
          <Link className="btn btn-primary btn-lg" href="/register">
            {t('landing.createAccount')}
          </Link>
        </section>
      </main>

      <footer className="landing-footer">
        <span>{t('landing.footer', { year: new Date().getFullYear() })}</span>
      </footer>
    </div>
  );
}
