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
import {
  previewTargetForDocument,
  previewTargetForVersion,
  previewTargetForAttachment,
} from '@/lib/preview';
import { PreviewTarget } from '@/lib/types';
import { useLocale } from '@/lib/i18n/locale-provider';
import { useSettings } from '@/lib/settings-context';

type Tab = 'overview' | 'preview' | 'versions' | 'attachments';

function DocumentDetailBody() {
  const { notify } = useToast();
  const { t } = useLocale();
  const { maxUploadSizeBytes, maxUploadSizeMb } = useSettings();
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

  // Attachments now support multi-file upload in a single request.
  const [attachFiles, setAttachFiles] = useState<File[]>([]);
  const [attachOpen, setAttachOpen] = useState(false);
  const [attachSaving, setAttachSaving] = useState(false);
  const [attachError, setAttachError] = useState('');

  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Unified preview modal state — used by Versions AND Attachments,
  // always rendered through <FilePreview>, which handles image/pdf/docx/excel.
  const [previewTarget, setPreviewTarget] = useState<PreviewTarget | null>(null);

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
      notify(t('documentDetail.updated_toast'), 'success');
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
      await loadDoc();
      notify(t('documentDetail.moved'), 'success');
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
      setVersionError(t('documentDetail.chooseFileError'));
      return;
    }
    if (newVersionFile.size > maxUploadSizeBytes) {
      setVersionError(
        t('settings.fileTooLarge', { max: maxUploadSizeMb }) +
          ` (${formatBytes(newVersionFile.size)})`,
      );
      return;
    }
    setVersionSaving(true);
    setVersionError('');
    try {
      const updated = await documentsApi.updateFile(id, newVersionFile);
      setDoc(updated);
      await loadVersions();
      notify(t('documentDetail.newVersionUploaded'), 'success');
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
      notify(t('documentDetail.versionRestored'), 'success');
    } catch (e) {
      notify(errorMessage(e), 'error');
    }
  }

  async function handleAttachSubmit(e: FormEvent) {
    e.preventDefault();
    if (attachFiles.length === 0) {
      setAttachError(t('documentDetail.attachFilesError'));
      return;
    }
    const oversized = attachFiles.find((f) => f.size > maxUploadSizeBytes);
    if (oversized) {
      setAttachError(
        t('settings.fileTooLarge', { max: maxUploadSizeMb }) +
          ` (${oversized.name} · ${formatBytes(oversized.size)})`,
      );
      return;
    }
    setAttachSaving(true);
    setAttachError('');
    try {
      const added = await documentsApi.addAttachment(id, attachFiles);
      await loadAttachments();
      notify(
        added.length > 1 ? t('documentDetail.attachmentsAdded', { count: added.length }) : t('documentDetail.attachmentAdded'),
        'success',
      );
      setAttachOpen(false);
      setAttachFiles([]);
    } catch (e) {
      setAttachError(errorMessage(e));
    } finally {
      setAttachSaving(false);
    }
  }

  async function handleDeleteAttachment(attachmentId: number) {
    try {
      await documentsApi.deleteAttachment(attachmentId);
      notify(t('documentDetail.attachmentDeleted'), 'success');
      loadAttachments();
    } catch (e) {
      notify(errorMessage(e), 'error');
    }
  }

  async function handleSoftDelete() {
    setDeleteLoading(true);
    try {
      await documentsApi.softDelete(id);
      notify(t('documentDetail.movedToTrash'), 'success');
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
    return <div className="banner banner-danger">{error || t('documentDetail.documentNotFound')}</div>;
  }

  return (
    <div>
      <div className="breadcrumbs">
        <Link href="/documents">{t('documentDetail.documentsBreadcrumb')}</Link>
        <span>/</span>
        <span>{doc.name}</span>
      </div>

      <div className="page-header">
        <div>
          <span className="page-eyebrow">{doc.category?.name}</span>
          <h1 className="page-title">{doc.name}</h1>
          <p className="page-subtitle">
            {t('documentDetail.inFolder', { folder: doc.folder?.name })}
            {t('documentDetail.ownedBy', { owner: doc.owner?.name })}
            {t('documentDetail.updated', { date: formatDateTime(doc.updatedAt) })}
          </p>
        </div>
        <div className="page-actions">
          <button
            className="btn btn-secondary"
            onClick={() => documentsApi.download(id, doc.name)}
          >
            {t('documentDetail.downloadLatest')}
          </button>
          <button className="btn btn-secondary" onClick={openEdit}>
            {t('documentDetail.editMetadata')}
          </button>
          <button className="btn btn-secondary" onClick={openMove}>
            {t('documentDetail.move')}
          </button>
          <button className="btn btn-danger" onClick={() => setDeleteConfirm(true)}>
            {t('documentDetail.delete')}
          </button>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab${tab === 'overview' ? ' active' : ''}`} onClick={() => setTab('overview')}>
          {t('documentDetail.overview')}
        </button>
        <button className={`tab${tab === 'preview' ? ' active' : ''}`} onClick={() => setTab('preview')}>
          {t('documentDetail.preview')}
        </button>
        <button className={`tab${tab === 'versions' ? ' active' : ''}`} onClick={() => setTab('versions')}>
          {t('documentDetail.versions')} ({versions.length})
        </button>
        <button
          className={`tab${tab === 'attachments' ? ' active' : ''}`}
          onClick={() => setTab('attachments')}
        >
          {t('documentDetail.attachments')} ({attachments.length})
        </button>
      </div>

      {tab === 'overview' && (
        <div className="card card-pad">
          <div className="field">
            <label>{t('documentDetail.description')}</label>
            <p>{doc.description || '—'}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 16 }}>
            <div>
              <div className="field-hint">{t('documentDetail.category')}</div>
              <p>{doc.category?.name}</p>
            </div>
            <div>
              <div className="field-hint">{t('documentDetail.folder')}</div>
              <p>{doc.folder?.name}</p>
            </div>
            <div>
              <div className="field-hint">{t('documentDetail.department')}</div>
              <p>{doc.folder?.department?.name}</p>
            </div>
            <div>
              <div className="field-hint">{t('documentDetail.owner')}</div>
              <p>{doc.owner?.name}</p>
            </div>
            <div>
              <div className="field-hint">{t('documentDetail.created')}</div>
              <p>{formatDateTime(doc.createdAt)}</p>
            </div>
            <div>
              <div className="field-hint">{t('documentDetail.lastUpdated')}</div>
              <p>{formatDateTime(doc.updatedAt)}</p>
            </div>
          </div>
        </div>
      )}

      {tab === 'preview' &&
        (() => {
          const target = previewTargetForDocument(doc, versions[0]);
          return target ? (
            <FilePreview target={target} />
          ) : (
            <div className="card card-pad">{t('documentDetail.noFileUploaded')}</div>
          );
        })()}

      {tab === 'versions' && (
        <div>
          <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary btn-sm" onClick={() => setNewVersionOpen(true)}>
              {t('documentDetail.uploadNewVersion')}
            </button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t('documentDetail.version')}</th>
                  <th>{t('documentDetail.file')}</th>
                  <th>{t('documentDetail.size')}</th>
                  <th>{t('documentDetail.uploadedBy')}</th>
                  <th>{t('documentDetail.date')}</th>
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
                          onClick={() => setPreviewTarget(previewTargetForVersion(id, v))}
                        >
                          {t('documentDetail.previewAction')}
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => documentsApi.downloadVersion(id, v.id, v.originalFileName)}
                        >
                          {t('documentDetail.download')}
                        </button>
                        {v.versionNumber !== versions[0]?.versionNumber && (
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleRestoreVersion(v.id)}
                          >
                            {t('documentDetail.restore')}
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
              {t('documentDetail.addAttachments')}
            </button>
          </div>
          {attachments.length === 0 ? (
            <div className="card card-pad" style={{ textAlign: 'center', color: 'var(--color-muted)' }}>
              {t('documentDetail.noAttachmentsYet')}
            </div>
          ) : (
            <div className="attachment-grid">
              {attachments.map((a) => (
                <div key={a.id} className="attachment-card">
                  <div className="attachment-card-header">
                    <span className="badge badge-muted">{fileTypeLabel(a.mimeType)}</span>
                    <div className="attachment-card-title" title={a.fileName}>
                      {a.fileName}
                    </div>
                  </div>

                  <div className="attachment-card-preview-slot">
                    <FilePreview target={previewTargetForAttachment(a)} />
                  </div>

                  <div className="attachment-card-actions">
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setPreviewTarget(previewTargetForAttachment(a))}
                    >
                      {t('documentDetail.previewAction')}
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => documentsApi.downloadAttachment(a.id, a.fileName)}
                    >
                      {t('documentDetail.download')}
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteAttachment(a.id)}
                    >
                      {t('documentDetail.delete')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {editOpen && (
        <Modal
          title={t('documentDetail.editMetadataTitle')}
          onClose={() => setEditOpen(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setEditOpen(false)}>
                {t('documentDetail.cancel')}
              </button>
              <button className="btn btn-primary" onClick={handleEditSubmit} disabled={editSaving}>
                {editSaving ? t('documentDetail.saving') : t('documentDetail.saveChanges')}
              </button>
            </>
          }
        >
          <form onSubmit={handleEditSubmit}>
            {editError && <div className="banner banner-danger">{editError}</div>}
            <div className="field">
              <label>{t('documentDetail.name')}</label>
              <input
                className="input"
                required
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="field">
              <label>{t('documentDetail.description')}</label>
              <input
                className="input"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
            </div>
            <div className="field">
              <label>{t('documentDetail.category')}</label>
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
          title={t('documentDetail.moveDocumentTitle')}
          onClose={() => setMoveOpen(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setMoveOpen(false)}>
                {t('documentDetail.cancel')}
              </button>
              <button className="btn btn-primary" onClick={handleMoveSubmit} disabled={moveSaving}>
                {moveSaving ? t('documentDetail.moving') : t('documentDetail.move')}
              </button>
            </>
          }
        >
          <form onSubmit={handleMoveSubmit}>
            {moveError && <div className="banner banner-danger">{moveError}</div>}
            <div className="field">
              <label>{t('documentDetail.destinationFolder')}</label>
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
          title={t('documentDetail.uploadNewVersionTitle')}
          onClose={() => setNewVersionOpen(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setNewVersionOpen(false)}>
                {t('documentDetail.cancel')}
              </button>
              <button
                className="btn btn-primary"
                onClick={handleNewVersionSubmit}
                disabled={versionSaving}
              >
                {versionSaving ? t('documents.uploading') : t('documents.upload')}
              </button>
            </>
          }
        >
          <form onSubmit={handleNewVersionSubmit}>
            {versionError && <div className="banner banner-danger">{versionError}</div>}
            <div className="field">
              <label>{t('documentDetail.file')}</label>
              <FileDrop
                files={newVersionFile ? [newVersionFile] : []}
                onChange={(files) => setNewVersionFile(files[0] || null)}
              />
            </div>
          </form>
        </Modal>
      )}

      {attachOpen && (
        <Modal
          title={t('documentDetail.addAttachmentsTitle')}
          onClose={() => setAttachOpen(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setAttachOpen(false)}>
                {t('documentDetail.cancel')}
              </button>
              <button className="btn btn-primary" onClick={handleAttachSubmit} disabled={attachSaving}>
                {attachSaving ? t('documents.uploading') : t('documentDetail.add')}
              </button>
            </>
          }
        >
          <form onSubmit={handleAttachSubmit}>
            {attachError && <div className="banner banner-danger">{attachError}</div>}
            <div className="field">
              <label>{t('documents.files')}</label>
              <FileDrop files={attachFiles} onChange={setAttachFiles} multiple />
            </div>
          </form>
        </Modal>
      )}

      {previewTarget && (
        <Modal
          title={t('documentDetail.previewTitle', { filename: previewTarget.filename })}
          onClose={() => setPreviewTarget(null)}
          footer={
            <button className="btn btn-secondary" onClick={() => setPreviewTarget(null)}>
              {t('documentDetail.close')}
            </button>
          }
        >
          <FilePreview target={previewTarget} />
        </Modal>
      )}

      {deleteConfirm && (
        <ConfirmDialog
          title={t('documentDetail.deleteDocumentTitle')}
          message={t('documentDetail.deleteConfirm', { name: doc.name })}
          confirmLabel={t('documentDetail.moveToTrash')}
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