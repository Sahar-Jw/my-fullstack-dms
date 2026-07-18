'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { errorMessage } from '@/lib/api';
import { useLocale } from '@/lib/i18n/locale-provider';
import { useSettings } from '@/lib/settings-context';

export default function LoginPage() {
  const { login, token, mustChangePassword, loading } = useAuth();
  const { t } = useLocale();
  const { settings, logoUrl } = useSettings();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && token) {
      router.replace(mustChangePassword ? '/force-change-password' : '/dashboard');
    }
  }, [loading, token, mustChangePassword, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await login(email, password);
      router.push(res.mustChangePassword ? '/force-change-password' : '/dashboard');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-screen">
      <Link href="/" className="auth-home-link">
        {t('common.backToHome')}
      </Link>

      <div className="auth-card">
        {logoUrl ? (
          <img src={logoUrl} alt={settings?.siteName || 'Logo'} className="navbar-brand-logo" />
        ) : (
          <div className="auth-mark" />
        )}
        <h1 className="auth-title">{t('auth.signInTitle')}</h1>
        <p className="auth-subtitle">{t('auth.signInSubtitle')}</p>

        {error && <div className="banner banner-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">{t('auth.email')}</label>
            <input
              id="email"
              className="input"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@dms.com"
            />
          </div>
          <div className="field">
            <label htmlFor="password">{t('auth.password')}</label>
            <input
              id="password"
              className="input"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
            <div style={{ marginTop: 6, textAlign: 'end' }}>
              <Link className="link-btn" href="/forgot-password" style={{ fontSize: 13 }}>
                {t('auth.forgotPasswordLink')}
              </Link>
            </div>
          </div>
          <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
            {submitting ? t('auth.signingIn') : t('auth.signInButton')}
          </button>

          <div style={{ marginTop: 14, textAlign: 'center' }}>
            <span style={{ color: 'var(--color-muted)', fontSize: 13 }}>
              {t('auth.noAccount')}
            </span>
            <Link className="link-btn" href="/register">
              {t('auth.registerLink')}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
