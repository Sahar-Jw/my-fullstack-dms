'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi, departmentsApi } from '@/lib/endpoints';
import { Department } from '@/lib/types';
import { errorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function RegisterPage() {
  const router = useRouter();
  const { setSession } = useAuth();

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
      .catch(() => setDeptError('Could not load departments. Try refreshing the page.'));
  }, []);

  function validate() {
    if (!name.trim()) return 'Please enter your full name.';
    if (!email.trim()) return 'Please enter your email.';
    if (!departmentId) return 'Please select your department.';
    if (!password) return 'Please enter a password.';
    if (password.length < 8) return 'Password must be at least 8 characters.';
    if (password !== confirmPassword) return 'Passwords do not match.';
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
        ← Back to home
      </Link>

      <div className="auth-card">
        <div className="auth-mark" />
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Register to access your department&apos;s documents.</p>

        {error && <div className="banner banner-danger">{error}</div>}
        {deptError && <div className="banner banner-danger">{deptError}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="name">Full name</label>
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
            <label htmlFor="department">Department</label>
            <select
              id="department"
              className="select"
              required
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
            >
              <option value="">Select your department...</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
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
            <label htmlFor="confirmPassword">Confirm password</label>
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
            {submitting ? 'Creating…' : 'Register'}
          </button>

          <div style={{ marginTop: 14, textAlign: 'center' }}>
            <span style={{ color: 'var(--color-muted)', fontSize: 13 }}>Already have an account? </span>
            <Link className="link-btn" href="/login">
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}