'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import RequireAuth from '@/components/RequireAuth';
import ConfirmDialog from '@/components/ConfirmDialog';
import EmptyState from '@/components/EmptyState';
import { documentsApi } from '@/lib/endpoints';
import { DmsDocument } from '@/lib/types';
import { errorMessage } from '@/lib/api';
import { useToast } from '@/lib/toast-context';
import { useAuth } from '@/lib/auth-context';
import { formatDateTime } from '@/lib/format';

function TrashBody() {
  const { user } = useAuth();
  const { notify } = useToast();
  const [docs, setDocs] = useState<DmsDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [permanentTarget, setPermanentTarget] = useState<DmsDocument | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      setDocs(await documentsApi.trash());
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleRestore(doc: DmsDocument) {
    try {
      await documentsApi.restore(doc.id);
      notify('Document restored.', 'success');
      load();
    } catch (e) {
      notify(errorMessage(e), 'error');
    }
  }

  async function handlePermanentDelete() {
    if (!permanentTarget) return;
    setConfirmLoading(true);
    try {
      await documentsApi.permanentDelete(permanentTarget.id);
      notify('Document permanently deleted.', 'success');
      setPermanentTarget(null);
      load();
    } catch (e) {
      notify(errorMessage(e), 'error');
    } finally {
      setConfirmLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <span className="page-eyebrow">Records</span>
          <h1 className="page-title">Trash</h1>
          <p className="page-subtitle">Deleted documents can be restored or permanently removed.</p>
        </div>
        <div className="page-actions">
          <Link href="/documents" className="btn btn-secondary">
            Back to documents
          </Link>
        </div>
      </div>

      {error && <div className="banner banner-danger">{error}</div>}

      {loading ? (
        <div className="center-loading">
          <div className="spinner" />
        </div>
      ) : docs.length === 0 ? (
        <EmptyState title="Trash is empty" />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Folder</th>
                <th>Owner</th>
                <th>Deleted</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {docs.map((doc) => (
                <tr key={doc.id}>
                  <td>{doc.name}</td>
                  <td>{doc.folder?.name}</td>
                  <td>{doc.owner?.name}</td>
                  <td>{formatDateTime(doc.updatedAt)}</td>
                  <td>
                    <div className="row-actions">
                      <button className="btn btn-secondary btn-sm" onClick={() => handleRestore(doc)}>
                        Restore
                      </button>
                      {user?.role === 'Admin' && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => setPermanentTarget(doc)}
                        >
                          Delete forever
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {permanentTarget && (
        <ConfirmDialog
          title="Permanently delete"
          message={`Permanently delete "${permanentTarget.name}"? This removes all versions and attachments and cannot be undone.`}
          confirmLabel="Delete forever"
          danger
          loading={confirmLoading}
          onConfirm={handlePermanentDelete}
          onCancel={() => setPermanentTarget(null)}
        />
      )}
    </div>
  );
}

export default function TrashPage() {
  return (
    <RequireAuth>
      <TrashBody />
    </RequireAuth>
  );
}
