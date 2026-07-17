'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { errorMessage } from '@/lib/api';

export default function LoginPage() {
  const { login, token, mustChangePassword, loading } = useAuth();
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
        ← Back to home
      </Link>

      <div className="auth-card">
        <div className="auth-mark" />
        <h1 className="auth-title">Sign in to Ledger</h1>
        <p className="auth-subtitle">Your department&apos;s document system.</p>

        {error && <div className="banner banner-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
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
            <label htmlFor="password">Password</label>
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
          </div>
          <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>

          <div style={{ marginTop: 14, textAlign: 'center' }}>
            <span style={{ color: 'var(--color-muted)', fontSize: 13 }}>
              Don&apos;t have an account?{' '}
            </span>
            <Link className="link-btn" href="/register">
              Register
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}