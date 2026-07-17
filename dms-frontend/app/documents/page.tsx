'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import RequireAuth from '@/components/RequireAuth';
import Modal from '@/components/Modal';
import EmptyState from '@/components/EmptyState';
import FileDrop from '@/components/FileDrop';
import { useAuth } from '@/lib/auth-context';
import { categoriesApi, departmentsApi, documentsApi, foldersApi } from '@/lib/endpoints';
import { Category, Department, DmsDocument, Folder } from '@/lib/types';
import { errorMessage } from '@/lib/api';
import { useToast } from '@/lib/toast-context';
import { formatDateTime } from '@/lib/format';
import { useLocale } from '@/lib/i18n/locale-provider';

function DocumentsBody() {
  const { notify } = useToast();
  const { t } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const folderIdParam = searchParams.get('folderId');

  const { user, loading: authLoading } = useAuth();
  const isAdmin = user?.role === 'Admin';

  const [docs, setDocs] = useState<DmsDocument[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [nameFilter, setNameFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [folderFilter, setFolderFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    name: '',
    description: '',
    folderId: folderIdParam || '',
    categoryId: '',
  });
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadError, setUploadError] = useState('');
  const [uploading, setUploading] = useState(false);

  async function loadLookups() {
    try {
      const [f, c] = await Promise.all([foldersApi.list(), categoriesApi.list()]);
      setFolders(f);
      setCategories(c);
      if (isAdmin) {
        const d = await departmentsApi.list();
        setDepartments(d);
      }
    } catch (e) {
      notify(errorMessage(e), 'error');
    }
  }

  async function loadDocs(useSearch = false) {
    setLoading(true);
    setError('');
    try {
      let result: DmsDocument[];
      if (
        useSearch ||
        nameFilter ||
        categoryFilter ||
        folderFilter ||
        departmentFilter ||
        dateFrom ||
        dateTo ||
        folderIdParam
      ) {
        result = await documentsApi.search({
          name: nameFilter || undefined,
          categoryId: categoryFilter ? Number(categoryFilter) : undefined,
          folderId: folderFilter
            ? Number(folderFilter)
            : folderIdParam
              ? Number(folderIdParam)
              : undefined,
          departmentId: isAdmin && departmentFilter ? Number(departmentFilter) : undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
        });
      } else {
        result = await documentsApi.list();
      }
      setDocs(result);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authLoading) return;
    loadLookups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]);

  useEffect(() => {
    if (authLoading) return;
    loadDocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, folderIdParam]);

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    loadDocs(true);
  }

  function clearFolderFilter() {
    router.push('/documents');
  }

  function openUpload() {
    setUploadForm({
      name: '',
      description: '',
      folderId: folderIdParam || '',
      categoryId: '',
    });
    setUploadFiles([]);
    setUploadError('');
    setUploadOpen(true);
  }

  async function handleUpload(e: FormEvent) {
    e.preventDefault();
    setUploadError('');
    if (uploadFiles.length === 0) {
      setUploadError(t('documents.chooseFileError'));
      return;
    }
    if (!uploadForm.folderId || !uploadForm.categoryId) {
      setUploadError(t('documents.chooseFolderCategoryError'));
      return;
    }
    setUploading(true);
    try {
      const docs = await documentsApi.upload({
        files: uploadFiles,
         name: uploadFiles.length === 1
        ? (uploadForm.name || uploadFiles[0].name)
         : uploadFiles[0].name,
        description: uploadForm.description || undefined,
        folderId: Number(uploadForm.folderId),
        categoryId: Number(uploadForm.categoryId),
      });
      notify(
        docs.length > 1 ? t('documents.uploadedMulti', { count: docs.length }) : t('documents.uploadedSingle'),
        'success',
      );
      setUploadOpen(false);
      if (docs.length === 1) {
        router.push(`/documents/${docs[0].id}`);
      } else {
        router.push('/documents');
        loadDocs();
      }
    } catch (err) {
      setUploadError(errorMessage(err));
    } finally {
      setUploading(false);
    }
  }

  const activeFolder = folderIdParam ? folders.find((f) => f.id === Number(folderIdParam)) : null;

  return (
    <div>
      <div className="page-header">
        <div>
          <span className="page-eyebrow">{t('documents.eyebrow')}</span>
          <h1 className="page-title">{t('documents.title')}</h1>
          <p className="page-subtitle">
            {activeFolder ? t('documents.filteredToFolder', { name: activeFolder.name }) : t('documents.allDocuments')}
          </p>
        </div>
        <div className="page-actions">
          <Link href="/documents/trash" className="btn btn-secondary">
            {t('documents.trash')}
          </Link>
          <button className="btn btn-primary" onClick={openUpload}>
            {t('documents.uploadDocument')}
          </button>
        </div>
      </div>

      {activeFolder && (
        <div className="breadcrumbs">
          <button onClick={clearFolderFilter}>{t('documents.allDocumentsBreadcrumb')}</button>
          <span>/</span>
          <span>{activeFolder.name}</span>
        </div>
      )}

      <form className="card card-pad" onSubmit={handleSearchSubmit} style={{ marginBottom: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: 12 }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>{t('documents.name')}</label>
            <input
              className="input"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              placeholder={t('documents.searchPlaceholder')}
            />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>{t('documents.category')}</label>
            <select
              className="select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">{t('documents.anyCategory')}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>{t('documents.folder')}</label>
            <select
              className="select"
              value={folderFilter}
              onChange={(e) => setFolderFilter(e.target.value)}
            >
              <option value="">{t('documents.anyFolder')}</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
          {isAdmin && (
            <div className="field" style={{ marginBottom: 0 }}>
              <label>{t('documents.department')}</label>
              <select
                className="select"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
              >
                <option value="">{t('documents.anyDepartment')}</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="field" style={{ marginBottom: 0 }}>
            <label>{t('documents.from')}</label>
            <input
              className="input"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>{t('documents.to')}</label>
            <input
              className="input"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>
        <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
          <button className="btn btn-primary btn-sm" type="submit">
            {t('documents.search')}
          </button>
          <button
            className="btn btn-ghost btn-sm"
            type="button"
            onClick={() => {
              setNameFilter('');
              setCategoryFilter('');
              setFolderFilter('');
              setDepartmentFilter('');
              setDateFrom('');
              setDateTo('');
              loadDocs(false);
            }}
          >
            {t('documents.reset')}
          </button>
        </div>
      </form>

      {error && <div className="banner banner-danger">{error}</div>}

      {loading ? (
        <div className="center-loading">
          <div className="spinner" />
        </div>
      ) : docs.length === 0 ? (
        <EmptyState
          title={t('documents.noDocumentsFound')}
          message={t('documents.tryAdjusting')}
          action={
            <button className="btn btn-primary" onClick={openUpload}>
              {t('documents.uploadDocument')}
            </button>
          }
        />
      ) : (
        <div className="doc-grid">
          {docs.map((doc) => (
            <Link key={doc.id} href={`/documents/${doc.id}`} className="doc-card">
              <span className="badge badge-accent" style={{ alignSelf: 'flex-start' }}>
                {doc.category?.name}
              </span>
              <div className="doc-card-name">{doc.name}</div>
              <div className="doc-card-meta">{doc.folder?.name}</div>
              <div className="doc-card-meta">
                {doc.owner?.name} · {formatDateTime(doc.updatedAt)}
              </div>
            </Link>
          ))}
        </div>
      )}

      {uploadOpen && (
        <Modal
          title={t('documents.uploadModalTitle')}
          onClose={() => setUploadOpen(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setUploadOpen(false)}>
                {t('documents.cancel')}
              </button>
              <button className="btn btn-primary" onClick={handleUpload} disabled={uploading}>
                {uploading ? t('documents.uploading') : t('documents.upload')}
              </button>
            </>
          }
        >
          <form onSubmit={handleUpload}>
            {uploadError && <div className="banner banner-danger">{uploadError}</div>}
            <div className="field">
              <label>{t('documents.files')}</label>
              <FileDrop files={uploadFiles} onChange={setUploadFiles} multiple />
            </div>
            <div className="field">
              <label>
                {t('documents.documentName')}
                {uploadFiles.length > 1 && t('documents.ignoredForMultiple')}
              </label>
              <input
                className="input"
                value={uploadForm.name}
                onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                placeholder={uploadFiles[0]?.name || t('documents.defaultsToFileName')}
                disabled={uploadFiles.length > 1}
              />
            </div>
            <div className="field">
              <label>{t('documents.description')}</label>
              <input
                className="input"
                value={uploadForm.description}
                onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
              />
            </div>
            <div className="field">
              <label>{t('documents.folder')}</label>
              <select
                className="select"
                required
                value={uploadForm.folderId}
                onChange={(e) => setUploadForm({ ...uploadForm, folderId: e.target.value })}
              >
                <option value="">{t('documents.selectFolder')}</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>{t('documents.category')}</label>
              <select
                className="select"
                required
                value={uploadForm.categoryId}
                onChange={(e) => setUploadForm({ ...uploadForm, categoryId: e.target.value })}
              >
                <option value="">{t('documents.selectCategory')}</option>
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
    </div>
  );
}

export default function DocumentsPage() {
  return (
    <RequireAuth>
      <DocumentsBody />
    </RequireAuth>
  );
}