'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import RequireAuth from '@/components/RequireAuth';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import EmptyState from '@/components/EmptyState';
import { foldersApi, departmentsApi } from '@/lib/endpoints';
import { Department, FolderTreeNode } from '@/lib/types';
import { errorMessage } from '@/lib/api';
import { useToast } from '@/lib/toast-context';
import { useAuth } from '@/lib/auth-context';
import { useLocale } from '@/lib/i18n/locale-provider';

function FolderNode({
  node,
  depth,
  canManage,
  onAddChild,
  onRename,
  onDelete,
  onOpenDocuments,
  t,
}: {
  node: FolderTreeNode;
  depth: number;
  canManage: boolean;
  onAddChild: (parent: FolderTreeNode) => void;
  onRename: (node: FolderTreeNode) => void;
  onDelete: (node: FolderTreeNode) => void;
  onOpenDocuments: (node: FolderTreeNode) => void;
  t: (key: string, opts?: any) => string;
}) {
  return (
    <li>
      <div className="folder-row" onClick={() => onOpenDocuments(node)}>
        <span className="folder-row-label">
          📁 {node.name}
          <span className="badge badge-muted" style={{ marginLeft: 8 }}>
            {t('common.documentCount', { count: node.documentCount })}
          </span>
        </span>
        {canManage && (
          <span className="folder-row-actions" onClick={(e) => e.stopPropagation()}>
            <button className="btn btn-ghost btn-sm" onClick={() => onAddChild(node)}>
              {t('folders.addSub')}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => onRename(node)}>
              {t('folders.rename')}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => onDelete(node)}>
              {t('folders.delete')}
            </button>
          </span>
        )}
      </div>
      {node.children.length > 0 && (
        <ul>
          {node.children.map((child) => (
            <FolderNode
              key={child.id}
              node={child}
              depth={depth + 1}
              canManage={canManage}
              onAddChild={onAddChild}
              onRename={onRename}
              onDelete={onDelete}
              onOpenDocuments={onOpenDocuments}
              t={t}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function FoldersBody() {
  const { user } = useAuth();
  const { notify } = useToast();
  const { t } = useLocale();
  const router = useRouter();
  const canManage = user?.role === 'Admin' || user?.role === 'Manager';

  const [tree, setTree] = useState<FolderTreeNode[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<{
    id?: number;
    name: string;
    parentFolderId: string;
    departmentId: string;
  }>({ name: '', parentFolderId: '', departmentId: '' });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<FolderTreeNode | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [t, d] = await Promise.all([
        foldersApi.tree(),
        user?.role === 'Admin' ? departmentsApi.list() : Promise.resolve([]),
      ]);
      setTree(t);
      setDepartments(d);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openCreateRoot() {
    setForm({
      name: '',
      parentFolderId: '',
      departmentId: user?.role !== 'Admin' ? '' : '',
    });
    setFormError('');
    setModalOpen(true);
  }

  function openAddChild(parent: FolderTreeNode) {
    setForm({
      name: '',
      parentFolderId: String(parent.id),
      departmentId: String(parent.departmentId),
    });
    setFormError('');
    setModalOpen(true);
  }

  function openRename(node: FolderTreeNode) {
    setForm({
      id: node.id,
      name: node.name,
      parentFolderId: node.parentFolderId ? String(node.parentFolderId) : '',
      departmentId: String(node.departmentId),
    });
    setFormError('');
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      if (form.id) {
        await foldersApi.update(form.id, { name: form.name });
        notify(t('folders.renamed'), 'success');
      } else {
        if (user?.role === 'Admin' && !form.departmentId) {
          setFormError(t('folders.departmentRequired'));
          setSaving(false);
          return;
        }
        await foldersApi.create({
          name: form.name,
          parentFolderId: form.parentFolderId ? Number(form.parentFolderId) : undefined,
          departmentId: user?.role === 'Admin' ? Number(form.departmentId) : undefined,
        });
        notify(t('folders.created'), 'success');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirmTarget) return;
    setConfirmLoading(true);
    try {
      await foldersApi.remove(confirmTarget.id);
      notify(t('folders.deleted'), 'success');
      setConfirmTarget(null);
      load();
    } catch (e) {
      notify(errorMessage(e), 'error');
    } finally {
      setConfirmLoading(false);
    }
  }

  function openDocuments(node: FolderTreeNode) {
    router.push(`/documents?folderId=${node.id}`);
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <span className="page-eyebrow">{t('folders.eyebrow')}</span>
          <h1 className="page-title">{t('folders.title')}</h1>
          <p className="page-subtitle">
            {canManage ? t('folders.subtitleManage') : t('folders.subtitleView')}
          </p>
        </div>
        {canManage && (
          <div className="page-actions">
            <button className="btn btn-primary" onClick={openCreateRoot}>
              {t('folders.newFolder')}
            </button>
          </div>
        )}
      </div>

      {error && <div className="banner banner-danger">{error}</div>}

      {loading ? (
        <div className="center-loading">
          <div className="spinner" />
        </div>
      ) : tree.length === 0 ? (
        <EmptyState
          title={t('folders.noFoldersYet')}
          message={canManage ? t('folders.createHint') : undefined}
        />
      ) : (
        <div className="card card-pad">
          <ul className="folder-tree">
            {tree.map((node) => (
              <FolderNode
                key={node.id}
                node={node}
                depth={0}
                canManage={canManage}
                onAddChild={openAddChild}
                onRename={openRename}
                onDelete={setConfirmTarget}
                onOpenDocuments={openDocuments}
                t={t}
              />
            ))}
          </ul>
        </div>
      )}

      {modalOpen && (
        <Modal
          title={form.id ? t('folders.renameFolder') : t('folders.newFolderTitle')}
          onClose={() => setModalOpen(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                {t('folders.cancel')}
              </button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
                {saving ? t('folders.saving') : t('folders.save')}
              </button>
            </>
          }
        >
          <form onSubmit={handleSubmit}>
            {formError && <div className="banner banner-danger">{formError}</div>}
            <div className="field">
              <label>{t('folders.folderName')}</label>
              <input
                className="input"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            {!form.id && user?.role === 'Admin' && (
              <div className="field">
                <label>{t('folders.department')}</label>
                <select
                  className="select"
                  value={form.departmentId}
                  onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                  disabled={!!form.parentFolderId}
                >
                  <option value="">{t('folders.selectDepartment')}</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                {form.parentFolderId && (
                  <span className="field-hint">
                    {t('folders.inheritedHint')}
                  </span>
                )}
              </div>
            )}
          </form>
        </Modal>
      )}

      {confirmTarget && (
        <ConfirmDialog
          title={t('folders.deleteFolder')}
          message={t('folders.deleteConfirm', { name: confirmTarget.name })}
          confirmLabel={t('folders.delete')}
          danger
          loading={confirmLoading}
          onConfirm={handleDelete}
          onCancel={() => setConfirmTarget(null)}
        />
      )}
    </div>
  );
}

export default function FoldersPage() {
  return (
    <RequireAuth>
      <FoldersBody />
    </RequireAuth>
  );
}