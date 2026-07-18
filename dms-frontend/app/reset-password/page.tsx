'use client';

import { FormEvent, Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi } from '@/lib/endpoints';
import { errorMessage } from '@/lib/api';
import { useLocale } from '@/lib/i18n/locale-provider';
import { useSettings } from '@/lib/settings-context';

function ResetPasswordBody() {
  const { t } = useLocale();
  const { settings, logoUrl } = useSettings();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  function validate() {
    if (!password) return t('auth.validation.passwordRequired');
    if (password.length < 8) return t('auth.validation.passwordTooShort');
    if (password !== confirmPassword) return t('auth.validation.passwordMismatch');
    return '';
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    setSubmitting(true);
    try {
      await authApi.completeReset(token, password);
      setDone(true);
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
        <h1 className="auth-title">{t('auth.resetPasswordTitle')}</h1>
        <p className="auth-subtitle">{t('auth.resetPasswordSubtitle')}</p>

        {!token ? (
          // Strict token validation: never render the reset form itself
          // without a token present in the URL.
          <>
            <div className="banner banner-danger">{t('auth.resetPasswordMissingToken')}</div>
            <div style={{ marginTop: 14, textAlign: 'center' }}>
              <Link className="link-btn" href="/forgot-password">
                {t('auth.forgotPasswordLink')}
              </Link>
            </div>
          </>
        ) : done ? (
          <>
            <div className="banner banner-success">{t('auth.resetPasswordSuccess')}</div>
            <button
              className="btn btn-primary btn-block"
              style={{ marginTop: 14 }}
              onClick={() => router.push('/login')}
            >
              {t('auth.signInLink')}
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <div className="banner banner-danger">{error}</div>}

            <div className="field">
              <label htmlFor="password">{t('auth.newPassword')}</label>
              <input
                id="password"
                className="input"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <div className="field">
              <label htmlFor="confirmPassword">{t('auth.confirmNewPassword')}</label>
              <input
                id="confirmPassword"
                className="input"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
              {submitting ? t('auth.resetPasswordSubmitting') : t('auth.resetPasswordSubmit')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="center-loading"><div className="spinner" /></div>}>
      <ResetPasswordBody />
    </Suspense>
  );
}
