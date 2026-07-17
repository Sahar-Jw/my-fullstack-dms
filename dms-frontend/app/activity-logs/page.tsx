'use client';

import { useEffect, useState, useCallback } from 'react';
import RequireAuth from '@/components/RequireAuth';
import { activityLogsApi } from '@/lib/endpoints';
import { ActivityLog, ActivityAction, PaginatedResult, RoleName } from '@/lib/types';
import { errorMessage } from '@/lib/api';

const ACTION_LABELS: Record<ActivityAction, string> = {
  [ActivityAction.LOGIN]: 'Logged in',
  [ActivityAction.LOGIN_FAILED]: 'Failed login attempt',
  [ActivityAction.LOGOUT]: 'Logged out',
  [ActivityAction.REGISTER]: 'Registered account',
  [ActivityAction.DOCUMENT_UPLOAD]: 'Uploaded document',
  [ActivityAction.DOCUMENT_DOWNLOAD]: 'Downloaded document',
  [ActivityAction.DOCUMENT_UPDATE]: 'Updated document',
  [ActivityAction.DOCUMENT_DELETE]: 'Deleted document',
  [ActivityAction.DOCUMENT_RESTORE]: 'Restored document',
  [ActivityAction.DOCUMENT_MOVE]: 'Moved document',
  [ActivityAction.FOLDER_CREATE]: 'Created folder',
  [ActivityAction.FOLDER_DELETE]: 'Deleted folder',
  [ActivityAction.USER_UPDATE]: 'Updated user',
  [ActivityAction.USER_STATUS_TOGGLE]: 'Toggled user status',
  [ActivityAction.SETTINGS_UPDATE]: 'Updated system settings',
  [ActivityAction.ATTACHMENT_UPLOAD]: 'Uploaded attachment',
  [ActivityAction.ATTACHMENT_DOWNLOAD]: 'Downloaded attachment',
  [ActivityAction.ATTACHMENT_DELETE]: 'Deleted attachment',
  [ActivityAction.DEPARTMENT_CREATE]: 'Created department',
  [ActivityAction.DEPARTMENT_UPDATE]: 'Updated department',
  [ActivityAction.DEPARTMENT_DELETE]: 'Deleted department',
  [ActivityAction.CATEGORY_CREATE]: 'Created category',
  [ActivityAction.CATEGORY_UPDATE]: 'Updated category',
  [ActivityAction.CATEGORY_DELETE]: 'Deleted category',
};

function ActivityLogsBody() {
  const [result, setResult] = useState<PaginatedResult<ActivityLog> | null>(null);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState<ActivityAction | ''>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="activity-logs-page">
      {/* Header with filter */}
      <div className="logs-header">
        <div>
          <h1 className="logs-title">All Activity</h1>
          <p className="logs-subtitle">Track all user actions across the system</p>
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
            <option value=""> All actions</option>
            {Object.entries(ACTION_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
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
          <span>Loading activity logs...</span>
        </div>
      )}

      {!loading && result && (
        <>
          {/* Table */}
          <div className="table-wrapper">
            <table className="logs-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Details</th>
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
                        {ACTION_LABELS[log.action] ?? log.action}
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
                      <div>No activity found</div>
                      <div className="empty-hint">Try adjusting your filters</div>
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
                Page <strong>{result.page}</strong> of <strong>{result.totalPages}</strong>
              </span>
              <span className="info-divider">•</span>
              <span className="info-text">
                <strong>{result.total}</strong> total entries
              </span>
              <span className="info-divider">•</span>
              {/* <span className="info-text">
                Showing {result.data.length} per page
              </span> */}
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
                Previous
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
                Next
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