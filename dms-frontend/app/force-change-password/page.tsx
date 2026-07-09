'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { authApi } from '@/lib/endpoints';
import { errorMessage } from '@/lib/api';

export default function ForceChangePasswordPage() {
  const { token, mustChangePassword, markPasswordChanged, loading, logout } = useAuth();
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!token) {
      router.replace('/login');
    } else if (!mustChangePassword) {
      router.replace('/');
    }
  }, [loading, token, mustChangePassword, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      await authApi.forceChangePassword(newPassword);
      markPasswordChanged();
      router.push('/');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-mark" />
        <h1 className="auth-title">Set a new password</h1>
        <p className="auth-subtitle">
          This account was created with a temporary password. Choose a new one before continuing.
        </p>

        {error && <div className="banner banner-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="newPassword">New password</label>
            <input
              id="newPassword"
              className="input"
              type="password"
              autoComplete="new-password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
            />
          </div>
          <div className="field">
            <label htmlFor="confirm">Confirm password</label>
            <input
              id="confirm"
              className="input"
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save and continue'}
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-block"
            style={{ marginTop: 8 }}
            onClick={logout}
          >
            Log out instead
          </button>
        </form>
      </div>
    </div>
  );
}
