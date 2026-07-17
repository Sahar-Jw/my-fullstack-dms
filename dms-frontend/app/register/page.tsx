'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi, departmentsApi } from '@/lib/endpoints';
import { Department } from '@/lib/types';
import { errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { useLocale } from '@/lib/i18n/locale-provider';

export default function RegisterPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const { t } = useLocale();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [departmentId, setDepartmentId] = useState('');

  const [departments, setDepartments] = useState<Department[]>([]);
  const [deptError, setDeptError] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    departmentsApi
      .list()
      .then(setDepartments)
      .catch(() => setDeptError(t('auth.departmentsLoadError')));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function validate() {
    if (!name.trim()) return t('auth.validation.nameRequired');
    if (!email.trim()) return t('auth.validation.emailRequired');
    if (!departmentId) return t('auth.validation.departmentRequired');
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
      const res = await authApi.register({
        name: name.trim(),
        email: email.trim(),
        password,
        departmentId: Number(departmentId),
      });
      setSession(res);
      router.push('/dashboard');
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
        <div className="auth-mark" />
        <h1 className="auth-title">{t('auth.registerTitle')}</h1>
        <p className="auth-subtitle">{t('auth.registerSubtitle')}</p>

        {error && <div className="banner banner-danger">{error}</div>}
        {deptError && <div className="banner banner-danger">{deptError}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="name">{t('auth.fullName')}</label>
            <input
              id="name"
              className="input"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Appleseed"
            />
          </div>

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
            <label htmlFor="department">{t('auth.department')}</label>
            <select
              id="department"
              className="select"
              required
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
            >
              <option value="">{t('auth.selectDepartment')}</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="password">{t('auth.password')}</label>
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
            <label htmlFor="confirmPassword">{t('auth.confirmPassword')}</label>
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
            {submitting ? t('auth.creating') : t('auth.registerButton')}
          </button>

          <div style={{ marginTop: 14, textAlign: 'center' }}>
            <span style={{ color: 'var(--color-muted)', fontSize: 13 }}>{t('auth.haveAccount')}</span>
            <Link className="link-btn" href="/login">
              {t('auth.signInLink')}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
