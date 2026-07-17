'use client';

import { useEffect, useState, useCallback } from 'react';
import RequireAuth from '@/components/RequireAuth';
import { activityLogsApi } from '@/lib/endpoints';
import { ActivityLog, ActivityAction, PaginatedResult, RoleName } from '@/lib/types';
import { errorMessage } from '@/lib/api';
import { useLocale } from '@/lib/i18n/locale-provider';

function ActivityLogsBody() {
  const { t } = useLocale();
  const [result, setResult] = useState<PaginatedResult<ActivityLog> | null>(null);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState<ActivityAction | ''>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get translated action labels
  const getActionLabel = (action: ActivityAction): string => {
    const actionMap: Record<ActivityAction, string> = {
      [ActivityAction.LOGIN]: t('activityLogs.actions.loggedIn'),
      [ActivityAction.LOGIN_FAILED]: t('activityLogs.actions.loginFailed'),
      [ActivityAction.LOGOUT]: t('activityLogs.actions.loggedOut'),
      [ActivityAction.REGISTER]: t('activityLogs.actions.registered'),
      [ActivityAction.DOCUMENT_UPLOAD]: t('activityLogs.actions.documentUpload'),
      [ActivityAction.DOCUMENT_DOWNLOAD]: t('activityLogs.actions.documentDownload'),
      [ActivityAction.DOCUMENT_UPDATE]: t('activityLogs.actions.documentUpdate'),
      [ActivityAction.DOCUMENT_DELETE]: t('activityLogs.actions.documentDelete'),
      [ActivityAction.DOCUMENT_RESTORE]: t('activityLogs.actions.documentRestore'),
      [ActivityAction.DOCUMENT_MOVE]: t('activityLogs.actions.documentMove'),
      [ActivityAction.FOLDER_CREATE]: t('activityLogs.actions.folderCreate'),
      [ActivityAction.FOLDER_DELETE]: t('activityLogs.actions.folderDelete'),
      [ActivityAction.USER_UPDATE]: t('activityLogs.actions.userUpdate'),
      [ActivityAction.USER_STATUS_TOGGLE]: t('activityLogs.actions.userStatusToggle'),
      [ActivityAction.SETTINGS_UPDATE]: t('activityLogs.actions.settingsUpdate'),
      [ActivityAction.ATTACHMENT_UPLOAD]: t('activityLogs.actions.attachmentUpload'),
      [ActivityAction.ATTACHMENT_DOWNLOAD]: t('activityLogs.actions.attachmentDownload'),
      [ActivityAction.ATTACHMENT_DELETE]: t('activityLogs.actions.attachmentDelete'),
      [ActivityAction.DEPARTMENT_CREATE]: t('activityLogs.actions.departmentCreate'),
      [ActivityAction.DEPARTMENT_UPDATE]: t('activityLogs.actions.departmentUpdate'),
      [ActivityAction.DEPARTMENT_DELETE]: t('activityLogs.actions.departmentDelete'),
      [ActivityAction.CATEGORY_CREATE]: t('activityLogs.actions.categoryCreate'),
      [ActivityAction.CATEGORY_UPDATE]: t('activityLogs.actions.categoryUpdate'),
      [ActivityAction.CATEGORY_DELETE]: t('activityLogs.actions.categoryDelete'),
    };
    return actionMap[action] || action;
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await activityLogsApi.list({
        page,
        limit: 25,
        action: actionFilter || undefined,
      });
      setResult(data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter]);

  useEffect(() => {
    load();
  }, [load]);

  // Build action options for the filter dropdown
  const actionOptions = Object.values(ActivityAction).map((action) => ({
    value: action,
    label: getActionLabel(action),
  }));

  return (
    <div className="activity-logs-page">
      {/* Header with filter */}
      <div className="logs-header">
        <div>
          <h1 className="logs-title">{t('activityLogs.title')}</h1>
          <p className="logs-subtitle">{t('activityLogs.subtitle')}</p>
        </div>
        <div className="filter-wrapper">
          <select
            value={actionFilter}
            onChange={(e) => {
              setPage(1);
              setActionFilter(e.target.value as ActivityAction | '');
            }}
            className="filter-select"
          >
            <option value=""> {t('activityLogs.allActions')}</option>
            {actionOptions.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}
      
      {loading && (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <span>{t('activityLogs.loadingLogs')}</span>
        </div>
      )}

      {!loading && result && (
        <>
          {/* Table */}
          <div className="table-wrapper">
            <table className="logs-table">
              <thead>
                <tr>
                  <th>{t('activityLogs.when')}</th>
                  <th>{t('activityLogs.user')}</th>
                  <th>{t('activityLogs.action')}</th>
                  <th>{t('activityLogs.details')}</th>
                </tr>
              </thead>
              <tbody>
                {result.data.map((log) => (
                  <tr key={log.id}>
                    <td className="timestamp-cell">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="user-cell">
                      <div className="user-name">{log.actorName}</div>
                      <div className="user-email">{log.actorEmail}</div>
                    </td>
                    <td>
                      <span className="action-badge">
                        {getActionLabel(log.action)}
                      </span>
                    </td>
                    <td className="details-cell">
                      {log.description ?? <span className="empty-detail">—</span>}
                    </td>
                  </tr>
                ))}
                {result.data.length === 0 && (
                  <tr>
                    <td colSpan={4} className="empty-state">
                      <div className="empty-icon">📭</div>
                      <div>{t('activityLogs.noActivityFound')}</div>
                      <div className="empty-hint">{t('activityLogs.tryAdjustingFilters')}</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="pagination-wrapper">
            <div className="pagination-info">
              <span className="info-text">
                {t('activityLogs.pageOf', { page: result.page, total: result.totalPages })}
              </span>
              <span className="info-divider">•</span>
              <span className="info-text">
                {t('activityLogs.totalEntries', { count: result.total })}
              </span>
            </div>
            
            <div className="pagination-controls">
              <button 
                disabled={page === 1} 
                onClick={() => setPage((p) => p - 1)}
                className="pagination-btn prev-btn"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {t('activityLogs.previous')}
              </button>
              
              <div className="page-indicators">
                {Array.from({ length: Math.min(5, result.totalPages) }, (_, i) => {
                  let pageNum;
                  if (result.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= result.totalPages - 2) {
                    pageNum = result.totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  
                  if (pageNum > result.totalPages) return null;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`page-dot ${pageNum === page ? 'active' : ''}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button 
                disabled={page >= result.totalPages} 
                onClick={() => setPage((p) => p + 1)}
                className="pagination-btn next-btn"
              >
                {t('activityLogs.next')}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function ActivityLogsPage() {
  return (
    <RequireAuth>
      <ActivityLogsBody />
    </RequireAuth>
  );
}