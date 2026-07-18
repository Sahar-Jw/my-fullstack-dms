'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { authApi } from '@/lib/endpoints';
import { errorMessage } from '@/lib/api';
import { useLocale } from '@/lib/i18n/locale-provider';
import { useSettings } from '@/lib/settings-context';

export default function ForgotPasswordPage() {
  const { t } = useLocale();
  const { settings, logoUrl } = useSettings();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError(t('auth.validation.emailRequired'));
      return;
    }

    setSubmitting(true);
    try {
      await authApi.requestReset(email.trim());
      // Always show the same success state, whether or not the email is
      // registered — this endpoint intentionally never reveals that.
      setSent(true);
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
        <h1 className="auth-title">{t('auth.forgotPasswordTitle')}</h1>
        <p className="auth-subtitle">{t('auth.forgotPasswordSubtitle')}</p>

        {error && <div className="banner banner-danger">{error}</div>}

        {sent ? (
          <>
            <div className="banner banner-success">{t('auth.forgotPasswordSent')}</div>
            <div style={{ marginTop: 14, textAlign: 'center' }}>
              <Link className="link-btn" href="/login">
                {t('auth.signInLink')}
              </Link>
            </div>
          </>
        ) : (
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

            <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
              {submitting ? t('auth.forgotPasswordSubmitting') : t('auth.forgotPasswordSubmit')}
            </button>

            <div style={{ marginTop: 14, textAlign: 'center' }}>
              <Link className="link-btn" href="/login">
                {t('auth.backToSignIn')}
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
