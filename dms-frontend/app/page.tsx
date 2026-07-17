// app/page.tsx
'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function LandingPage() {
  const { token, mustChangePassword, loading } = useAuth();
  const router = useRouter();

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
            <span className="landing-brand-name">Ledger</span>
          </div>
          <div className="landing-nav-actions">
            <Link className="link-btn" href="/login">
              Sign in
            </Link>
            <Link className="btn btn-primary btn-sm" href="/register">
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="landing-hero">
          <span className="page-eyebrow">Document Management</span>
          <h1 className="landing-title">
            Keep every department&apos;s documents organized, secure, and easy to find.
          </h1>
          <p className="landing-subtitle">
            Ledger gives your team a single place to upload, version, and share files —
            with role-based access so the right people see the right documents.
          </p>
          <div className="landing-hero-actions">
            <Link className="btn btn-primary btn-lg" href="/register">
              Create your account
            </Link>
            <Link className="btn btn-secondary btn-lg" href="/login">
              Sign in
            </Link>
          </div>
        </section>

        <section className="landing-features">
          <div className="landing-feature">
            <h3>Organized by department</h3>
            <p>
              Every document lives in a folder tied to your team, so people only see
              what&apos;s relevant to them.
            </p>
          </div>
          <div className="landing-feature">
            <h3>Version history built in</h3>
            <p>
              Upload a new version of a file without losing the old one — restore any
              prior version whenever you need it.
            </p>
          </div>
          <div className="landing-feature">
            <h3>Role-based access</h3>
            <p>
              Admins manage accounts and permissions; everyone else just sees the
              documents that matter to their work.
            </p>
          </div>
        </section>

        <section className="landing-cta">
          <h2>Ready to get your documents in order?</h2>
          <Link className="btn btn-primary btn-lg" href="/register">
            Create your account
          </Link>
        </section>
      </main>

      <footer className="landing-footer">
        <span>© {new Date().getFullYear()} Ledger. All rights reserved.</span>
      </footer>
    </div>
  );
}