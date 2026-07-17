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

function FolderNode({
  node,
  depth,
  canManage,
  onAddChild,
  onRename,
  onDelete,
  onOpenDocuments,
}: {
  node: FolderTreeNode;
  depth: number;
  canManage: boolean;
  onAddChild: (parent: FolderTreeNode) => void;
  onRename: (node: FolderTreeNode) => void;
  onDelete: (node: FolderTreeNode) => void;
  onOpenDocuments: (node: FolderTreeNode) => void;
}) {
  return (
    <li>
      <div className="folder-row" onClick={() => onOpenDocuments(node)}>
        <span className="folder-row-label">
          📁 {node.name}
          <span className="badge badge-muted" style={{ marginLeft: 8 }}>
            {node.documentCount} {node.documentCount === 1 ? 'document' : 'documents'}
          </span>
        </span>
        {canManage && (
          <span className="folder-row-actions" onClick={(e) => e.stopPropagation()}>
            <button className="btn btn-ghost btn-sm" onClick={() => onAddChild(node)}>
              + Sub
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => onRename(node)}>
              Rename
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => onDelete(node)}>
              Delete
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
        notify('Folder renamed.', 'success');
      } else {
        if (user?.role === 'Admin' && !form.departmentId) {
          setFormError('Please choose a department for this folder.');
          setSaving(false);
          return;
        }
        await foldersApi.create({
          name: form.name,
          parentFolderId: form.parentFolderId ? Number(form.parentFolderId) : undefined,
          departmentId: user?.role === 'Admin' ? Number(form.departmentId) : undefined,
        });
        notify('Folder created.', 'success');
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
      notify('Folder deleted.', 'success');
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
          <span className="page-eyebrow">Structure</span>
          <h1 className="page-title">Folders</h1>
          <p className="page-subtitle">
            {canManage
              ? 'Organize documents into folders. Click a folder to view its documents.'
              : 'Browse your department&apos;s folders (view only).'}
          </p>
        </div>
        {canManage && (
          <div className="page-actions">
            <button className="btn btn-primary" onClick={openCreateRoot}>
              + New folder
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
          title="No folders yet"
          message={canManage ? 'Create a folder to start organizing documents.' : undefined}
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
              />
            ))}
          </ul>
        </div>
      )}

      {modalOpen && (
        <Modal
          title={form.id ? 'Rename folder' : 'New folder'}
          onClose={() => setModalOpen(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </>
          }
        >
          <form onSubmit={handleSubmit}>
            {formError && <div className="banner banner-danger">{formError}</div>}
            <div className="field">
              <label>Folder name</label>
              <input
                className="input"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            {!form.id && user?.role === 'Admin' && (
              <div className="field">
                <label>Department</label>
                <select
                  className="select"
                  value={form.departmentId}
                  onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                  disabled={!!form.parentFolderId}
                >
                  <option value="">Select a department…</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                {form.parentFolderId && (
                  <span className="field-hint">
                    Inherited from the parent folder&apos;s department.
                  </span>
                )}
              </div>
            )}
          </form>
        </Modal>
      )}

      {confirmTarget && (
        <ConfirmDialog
          title="Delete folder"
          message={`Delete "${confirmTarget.name}"? Only empty folders (no subfolders or documents) can be deleted.`}
          confirmLabel="Delete"
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
