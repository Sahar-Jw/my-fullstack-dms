'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import RequireAuth from '@/components/RequireAuth';
import { useAuth } from '@/lib/auth-context';
import { dashboardApi } from '@/lib/endpoints';
import { DashboardData } from '@/lib/types';
import { errorMessage } from '@/lib/api';
import { formatBytes, formatDateTime } from '@/lib/format';
import { useLocale } from '@/lib/i18n/locale-provider';

function DashboardBody() {
  const { user } = useAuth();
  const { t } = useLocale();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi
      .get()
      .then(setData)
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <span className="page-eyebrow">{t('dashboard.overview')}</span>
          <h1 className="page-title">{t('dashboard.welcomeBack', { name: user?.name?.split(' ')[0] })}</h1>
          <p className="page-subtitle">
            {user?.role}
            {user?.department ? t('dashboard.inDepartment', { department: user.department }) : t('dashboard.allDepartments')}
          </p>
        </div>
        <div className="page-actions">
          <Link href="/documents" className="btn btn-primary">
            {t('dashboard.goToDocuments')}
          </Link>
        </div>
      </div>

      {error && <div className="banner banner-danger">{error}</div>}

      {loading ? (
        <div className="center-loading">
          <div className="spinner" />
        </div>
      ) : data?.role === 'Admin' ? (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">{t('dashboard.uploadersCount')}</div>
            <div className="stat-value">{data.uploadersCount}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">{t('dashboard.totalDocuments')}</div>
            <div className="stat-value">{data.totalDocuments}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">{t('dashboard.storageUsed')}</div>
            <div className="stat-value">{formatBytes(data.storageUsedBytes)}</div>
          </div>
        </div>
      ) : data?.role === 'Manager' ? (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">{t('dashboard.departmentUploaders')}</div>
            <div className="stat-value">{data.departmentUploaders}</div>
          </div>
        </div>
      ) : data?.role === 'Employee' ? (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">{t('dashboard.myDocuments')}</div>
              <div className="stat-value">{data.myDocuments}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">{t('dashboard.storageUsed')}</div>
              <div className="stat-value">{formatBytes(data.storageUsedBytes)}</div>
            </div>
          </div>

          <h2 style={{ fontSize: 16, marginBottom: 12 }}>{t('dashboard.recentDocuments')}</h2>
          {data.recentDocuments.length === 0 ? (
            <div className="card card-pad">
              <p style={{ color: 'var(--color-muted)' }}>
                {t('dashboard.noDocumentsYet')}
              </p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{t('dashboard.name')}</th>
                    <th>{t('dashboard.folder')}</th>
                    <th>{t('dashboard.category')}</th>
                    <th>{t('dashboard.updated')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentDocuments.map((doc) => (
                    <tr key={doc.id}>
                      <td>
                        <Link href={`/documents/${doc.id}`} className="link-btn">
                          {doc.name}
                        </Link>
                      </td>
                      <td>{doc.folder?.name}</td>
                      <td>{doc.category?.name}</td>
                      <td>{formatDateTime(doc.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <RequireAuth>
      <DashboardBody />
    </RequireAuth>
  );
}