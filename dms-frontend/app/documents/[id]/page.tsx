'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import RequireAuth from '@/components/RequireAuth';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import FileDrop from '@/components/FileDrop';
import { categoriesApi, documentsApi, foldersApi } from '@/lib/endpoints';
import { Category, DmsDocument, DocAttachment, DocVersion, Folder } from '@/lib/types';
import { errorMessage } from '@/lib/api';
import { useToast } from '@/lib/toast-context';
import { formatBytes, formatDateTime, fileTypeLabel } from '@/lib/format';
import FilePreview from '@/components/FilePreview';
import { previewTargetForDocument } from '@/lib/preview';

type Tab = 'overview' | 'preview' | 'versions' | 'attachments';

type PreviewState = {
  url: string;
  contentType: string;
  name: string;
} | null;

function DocumentDetailBody() {
  const { notify } = useToast();
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);

  const [doc, setDoc] = useState<DmsDocument | null>(null);
  const [versions, setVersions] = useState<DocVersion[]>([]);
  const [attachments, setAttachments] = useState<DocAttachment[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('overview');

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', description: '', categoryId: '' });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  const [moveOpen, setMoveOpen] = useState(false);
  const [moveFolderId, setMoveFolderId] = useState('');
  const [moveSaving, setMoveSaving] = useState(false);
  const [moveError, setMoveError] = useState('');

  const [newVersionFile, setNewVersionFile] = useState<File | null>(null);
  const [newVersionOpen, setNewVersionOpen] = useState(false);
  const [versionSaving, setVersionSaving] = useState(false);
  const [versionError, setVersionError] = useState('');

  const [attachFile, setAttachFile] = useState<File | null>(null);
  const [attachOpen, setAttachOpen] = useState(false);
  const [attachSaving, setAttachSaving] = useState(false);
  const [attachError, setAttachError] = useState('');

  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [preview, setPreview] = useState<PreviewState>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');

  async function loadDoc() {
    setLoading(true);
    setError('');
    try {
      const d = await documentsApi.get(id);
      setDoc(d);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  async function loadVersions() {
    try {
      setVersions(await documentsApi.getVersions(id));
    } catch (e) {
      notify(errorMessage(e), 'error');
    }
  }

  async function loadAttachments() {
    try {
      setAttachments(await documentsApi.getAttachments(id));
    } catch (e) {
      notify(errorMessage(e), 'error');
    }
  }

  useEffect(() => {
    loadDoc();
    loadVersions();
    loadAttachments();
    Promise.all([categoriesApi.list(), foldersApi.list()]).then(([c, f]) => {
      setCategories(c);
      setFolders(f);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    return () => {
      if (preview?.url) window.URL.revokeObjectURL(preview.url);
    };
  }, [preview?.url]);

  function openEdit() {
    if (!doc) return;
    setEditForm({
      name: doc.name,
      description: doc.description || '',
      categoryId: String(doc.categoryId),
    });
    setEditError('');
    setEditOpen(true);
  }

  async function handleEditSubmit(e: FormEvent) {
    e.preventDefault();
    setEditSaving(true);
    setEditError('');
    try {
      const updated = await documentsApi.updateMetadata(id, {
        name: editForm.name,
        description: editForm.description,
        categoryId: Number(editForm.categoryId),
      });
      setDoc(updated);
      notify('Document updated.', 'success');
      setEditOpen(false);
    } catch (e) {
      setEditError(errorMessage(e));
    } finally {
      setEditSaving(false);
    }
  }

  function openMove() {
    if (!doc) return;
    setMoveFolderId(String(doc.folderId));
    setMoveError('');
    setMoveOpen(true);
  }

  async function handleMoveSubmit(e: FormEvent) {
    e.preventDefault();
    setMoveSaving(true);
    setMoveError('');
    try {
      await documentsApi.move(id, Number(moveFolderId));
      // Reload to ensure folder/folder relation is updated in UI
      await loadDoc();
      notify('Document moved.', 'success');
      setMoveOpen(false);
    } catch (e) {
      setMoveError(errorMessage(e));
    } finally {
      setMoveSaving(false);
    }
  }

  async function handleNewVersionSubmit(e: FormEvent) {
    e.preventDefault();
    if (!newVersionFile) {
      setVersionError('Please choose a file.');
      return;
    }
    setVersionSaving(true);
    setVersionError('');
    try {
      const updated = await documentsApi.updateFile(id, newVersionFile);
      setDoc(updated);
      await loadVersions();
      notify('New version uploaded.', 'success');
      setNewVersionOpen(false);
      setNewVersionFile(null);
    } catch (e) {
      setVersionError(errorMessage(e));
    } finally {
      setVersionSaving(false);
    }
  }

  async function handleRestoreVersion(versionId: number) {
    try {
      const updated = await documentsApi.restoreVersion(id, versionId);
      setDoc(updated);
      await loadVersions();
      notify('Version restored as the latest version.', 'success');
    } catch (e) {
      notify(errorMessage(e), 'error');
    }
  }

  async function handleAttachSubmit(e: FormEvent) {
    e.preventDefault();
    if (!attachFile) {
      setAttachError('Please choose a file.');
      return;
    }
    setAttachSaving(true);
    setAttachError('');
    try {
      await documentsApi.addAttachment(id, attachFile);
      await loadAttachments();
      notify('Attachment added.', 'success');
      setAttachOpen(false);
      setAttachFile(null);
    } catch (e) {
      setAttachError(errorMessage(e));
    } finally {
      setAttachSaving(false);
    }
  }

  async function handleDeleteAttachment(attachmentId: number) {
    try {
      await documentsApi.deleteAttachment(attachmentId);
      notify('Attachment deleted.', 'success');
      loadAttachments();
    } catch (e) {
      notify(errorMessage(e), 'error');
    }
  }

  function closePreview() {
    if (preview?.url) window.URL.revokeObjectURL(preview.url);
    setPreview(null);
    setPreviewError('');
  }

  async function openPreview(name: string, load: () => Promise<{ url: string; contentType: string }>) {
    setPreviewLoading(true);
    setPreviewError('');
    try {
      const result = await load();
      setPreview({ ...result, name });
    } catch (e) {
      const message = errorMessage(e);
      setPreviewError(message);
      notify(message, 'error');
    } finally {
      setPreviewLoading(false);
    }
  }

  function previewKind(file: PreviewState): 'image' | 'frame' | 'unsupported' {
    if (!file) return 'unsupported';
    const name = file.name.toLowerCase();
    const type = file.contentType.toLowerCase();
    if (type.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp|svg)$/.test(name)) return 'image';
    if (
      type.includes('pdf') ||
      type.startsWith('text/') ||
      /\.(pdf|txt|csv|html?)$/.test(name)
    ) {
      return 'frame';
    }
    return 'unsupported';
  }

  async function handleSoftDelete() {
    setDeleteLoading(true);
    try {
      await documentsApi.softDelete(id);
      notify('Document moved to trash.', 'success');
      router.push('/documents');
    } catch (e) {
      notify(errorMessage(e), 'error');
    } finally {
      setDeleteLoading(false);
      setDeleteConfirm(false);
    }
  }

  if (loading) {
    return (
      <div className="center-loading">
        <div className="spinner" />
      </div>
    );
  }

  if (error || !doc) {
    return <div className="banner banner-danger">{error || 'Document not found.'}</div>;
  }

  return (
    <div>
      <div className="breadcrumbs">
        <Link href="/documents">Documents</Link>
        <span>/</span>
        <span>{doc.name}</span>
      </div>

      <div className="page-header">
        <div>
          <span className="page-eyebrow">{doc.category?.name}</span>
          <h1 className="page-title">{doc.name}</h1>
          <p className="page-subtitle">
            in {doc.folder?.name} · owned by {doc.owner?.name} · updated{' '}
            {formatDateTime(doc.updatedAt)}
          </p>
        </div>
        <div className="page-actions">
          {/* <button
            className="btn btn-primary"
            onClick={() => openPreview(doc.name, () => documentsApi.preview(id))}
            disabled={previewLoading}
          >
            {previewLoading ? 'Loading...' : 'Preview'}
          </button> */}
          <button
            className="btn btn-secondary"
            onClick={() => documentsApi.download(id, doc.name)}
          >
            Download latest
          </button>
          <button className="btn btn-secondary" onClick={openEdit}>
            Edit metadata
          </button>
          <button className="btn btn-secondary" onClick={openMove}>
            Move
          </button>
          <button className="btn btn-danger" onClick={() => setDeleteConfirm(true)}>
            Delete
          </button>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab${tab === 'overview' ? ' active' : ''}`} onClick={() => setTab('overview')}>
          Overview
        </button>
        <button className={`tab${tab === 'preview' ? ' active' : ''}`} onClick={() => setTab('preview')}>
          Preview
        </button>
        <button className={`tab${tab === 'versions' ? ' active' : ''}`} onClick={() => setTab('versions')}>
          Versions ({versions.length})
        </button>
        <button
          className={`tab${tab === 'attachments' ? ' active' : ''}`}
          onClick={() => setTab('attachments')}
        >
          Attachments ({attachments.length})
        </button>
      </div>

      {tab === 'overview' && (
        <div className="card card-pad">
          <div className="field">
            <label>Description</label>
            <p>{doc.description || '—'}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 16 }}>
            <div>
              <div className="field-hint">Category</div>
              <p>{doc.category?.name}</p>
            </div>
            <div>
              <div className="field-hint">Folder</div>
              <p>{doc.folder?.name}</p>
            </div>
            <div>
              <div className="field-hint">Department</div>
              <p>{doc.folder?.department?.name}</p>
            </div>
            <div>
              <div className="field-hint">Owner</div>
              <p>{doc.owner?.name}</p>
            </div>
            <div>
              <div className="field-hint">Created</div>
              <p>{formatDateTime(doc.createdAt)}</p>
            </div>
            <div>
              <div className="field-hint">Last updated</div>
              <p>{formatDateTime(doc.updatedAt)}</p>
            </div>
          </div>
        </div>
      )}
        {tab === 'preview' && (
          (() => {
            const target = previewTargetForDocument(doc, versions[0]); // versions[0] = latest, per your existing sort
            return target ? (
              <FilePreview target={target} />
            ) : (
              <div className="card card-pad">No file uploaded yet.</div>
            );
          })()
        )}
      {tab === 'versions' && (
        <div>
          <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary btn-sm" onClick={() => setNewVersionOpen(true)}>
              + Upload new version
            </button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Version</th>
                  <th>File</th>
                  <th>Size</th>
                  <th>Uploaded by</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {versions.map((v) => (
                  <tr key={v.id}>
                    <td>v{v.versionNumber}</td>
                    <td>
                      <span className="badge badge-muted">{fileTypeLabel(v.mimeType)}</span>{' '}
                      {v.originalFileName}
                    </td>
                    <td>{formatBytes(v.fileSize)}</td>
                    <td>{v.uploadedBy?.name}</td>
                    <td>{formatDateTime(v.createdAt)}</td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() =>
                            openPreview(v.originalFileName, () =>
                              documentsApi.previewVersion(id, v.id),
                            )
                          }
                        >
                          Preview
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => documentsApi.downloadVersion(id, v.id, v.originalFileName)}
                        >
                          Download
                        </button>
                        {v.versionNumber !== versions[0]?.versionNumber && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleRestoreVersion(v.id)}
                          >
                            Restore
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'attachments' && (
        <div>
          <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary btn-sm" onClick={() => setAttachOpen(true)}>
              + Add attachment
            </button>
          </div>
          {attachments.length === 0 ? (
            <div className="card card-pad" style={{ textAlign: 'center', color: 'var(--color-muted)' }}>
              No attachments yet.
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>File</th>
                    <th>Size</th>
                    <th>Uploaded by</th>
                    <th>Date</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {attachments.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <span className="badge badge-muted">{fileTypeLabel(a.mimeType)}</span>{' '}
                        {a.fileName}
                      </td>
                      <td>{formatBytes(a.fileSize)}</td>
                      <td>{a.uploadedBy?.name}</td>
                      <td>{formatDateTime(a.createdAt)}</td>
                      <td>
                        <div className="row-actions">
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() =>
                              openPreview(a.fileName, () => documentsApi.previewAttachment(a.id))
                            }
                          >
                            Preview
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => documentsApi.downloadAttachment(a.id, a.fileName)}
                          >
                            Download
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteAttachment(a.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {editOpen && (
        <Modal
          title="Edit metadata"
          onClose={() => setEditOpen(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setEditOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleEditSubmit} disabled={editSaving}>
                {editSaving ? 'Saving…' : 'Save changes'}
              </button>
            </>
          }
        >
          <form onSubmit={handleEditSubmit}>
            {editError && <div className="banner banner-danger">{editError}</div>}
            <div className="field">
              <label>Name</label>
              <input
                className="input"
                required
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Description</label>
              <input
                className="input"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Category</label>
              <select
                className="select"
                value={editForm.categoryId}
                onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </form>
        </Modal>
      )}

      {moveOpen && (
        <Modal
          title="Move document"
          onClose={() => setMoveOpen(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setMoveOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleMoveSubmit} disabled={moveSaving}>
                {moveSaving ? 'Moving…' : 'Move'}
              </button>
            </>
          }
        >
          <form onSubmit={handleMoveSubmit}>
            {moveError && <div className="banner banner-danger">{moveError}</div>}
            <div className="field">
              <label>Destination folder</label>
              <select
                className="select"
                value={moveFolderId}
                onChange={(e) => setMoveFolderId(e.target.value)}
              >
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          </form>
        </Modal>
      )}

      {newVersionOpen && (
        <Modal
          title="Upload new version"
          onClose={() => setNewVersionOpen(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setNewVersionOpen(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleNewVersionSubmit}
                disabled={versionSaving}
              >
                {versionSaving ? 'Uploading…' : 'Upload'}
              </button>
            </>
          }
        >
          <form onSubmit={handleNewVersionSubmit}>
            {versionError && <div className="banner banner-danger">{versionError}</div>}
            <div className="field">
              <label>File</label>
              <FileDrop file={newVersionFile} onChange={setNewVersionFile} />
            </div>
          </form>
        </Modal>
      )}

      {attachOpen && (
        <Modal
          title="Add attachment"
          onClose={() => setAttachOpen(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setAttachOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleAttachSubmit} disabled={attachSaving}>
                {attachSaving ? 'Uploading…' : 'Add'}
              </button>
            </>
          }
        >
          <form onSubmit={handleAttachSubmit}>
            {attachError && <div className="banner banner-danger">{attachError}</div>}
            <div className="field">
              <label>File</label>
              <FileDrop file={attachFile} onChange={setAttachFile} />
            </div>
          </form>
        </Modal>
      )}

      {previewError && <div className="banner banner-danger">{previewError}</div>}

      {preview && (
        <Modal
          title={`Preview: ${preview.name}`}
          onClose={closePreview}
          footer={
            <button className="btn btn-secondary" onClick={closePreview}>
              Close
            </button>
          }
        >
          {previewKind(preview) === 'image' ? (
            <img className="preview-image" src={preview.url} alt={preview.name} />
          ) : previewKind(preview) === 'frame' ? (
            <iframe className="preview-frame" src={preview.url} title={preview.name} />
          ) : (
            <div className="preview-empty">
              This file type cannot be previewed directly in the browser. Download it to open it.
            </div>
          )}
        </Modal>
      )}

      {deleteConfirm && (
        <ConfirmDialog
          title="Delete document"
          message={`Move "${doc.name}" to trash? You can restore it later from the trash.`}
          confirmLabel="Move to trash"
          danger
          loading={deleteLoading}
          onConfirm={handleSoftDelete}
          onCancel={() => setDeleteConfirm(false)}
        />
      )}
    </div>
  );
}

export default function DocumentDetailPage() {
  return (
    <RequireAuth>
      <DocumentDetailBody />
    </RequireAuth>
  );
}
