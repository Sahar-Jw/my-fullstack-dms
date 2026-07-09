'use client';

import { FormEvent, useEffect, useState } from 'react';
import RequireAuth from '@/components/RequireAuth';
import Modal from '@/components/Modal';
import EmptyState from '@/components/EmptyState';
import { usersApi, rolesApi, departmentsApi } from '@/lib/endpoints';
import { AppUser, Department, Role } from '@/lib/types';
import { errorMessage } from '@/lib/api';
import { useToast } from '@/lib/toast-context';
import { formatDate } from '@/lib/format';
import { useAuth } from '@/lib/auth-context';

interface UserFormState {
  id?: number;
  name: string;
  email: string;
  roleId: string;
  departmentId: string;
}

const EMPTY_FORM: UserFormState = {
  name: '',
  email: '',
  roleId: '',
  departmentId: '',
};

function formatApiResult(value: unknown): string {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return String(value ?? '');

  const data = value as Record<string, unknown>;
  const lines: string[] = [];
  const add = (label: string, key: string) => {
    const field = data[key];
    if (field !== undefined && field !== null && field !== '') {
      lines.push(`${label}: ${String(field)}`);
    }
  };

  add('Name', 'name');
  add('Email', 'email');
  add('Password', 'password');
  add('Password', 'temporaryPassword');
  add('Temporary password', 'tempPassword');
  add('Message', 'message');

  Object.entries(data).forEach(([key, field]) => {
    if (
      ['id', 'name', 'email', 'password', 'temporaryPassword', 'tempPassword', 'message'].includes(
        key,
      ) ||
      field === undefined ||
      field === null ||
      typeof field === 'object'
    ) {
      return;
    }
    lines.push(`${key}: ${String(field)}`);
  });

  return lines.length > 0 ? lines.join('\n') : 'User created successfully.';
}

function userDeleteMessage(message: string, userName: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes('foreign key') && normalized.includes('document_versions')) {
    return `${userName} cannot be deleted because they uploaded one or more document versions. Disable this user instead to keep the document history and audit trail intact.`;
  }

  if (normalized.includes('foreign key') && normalized.includes('documents')) {
    return `${userName} cannot be deleted because they are linked to existing documents. Disable this user instead, or reassign those documents first.`;
  }

  if (normalized.includes('foreign key')) {
    return `${userName} cannot be deleted because other records still depend on this account. Disable the user instead, or remove/reassign the related records first.`;
  }

  return message;
}

function UsersBody() {
  const { notify } = useToast();
  const { user: sessionUser } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<UserFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [createResult, setCreateResult] = useState<unknown>(null);
  const [copying, setCopying] = useState(false);

  const [confirmTarget, setConfirmTarget] = useState<AppUser | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  async function loadAll() {
    setLoading(true);
    setError('');
    try {
      const [u, r, d] = await Promise.all([
        usersApi.list(),
        rolesApi.list(),
        departmentsApi.list(),
      ]);
      setUsers(u);
      setRoles(r);
      setDepartments(d);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  function openCreate() {
    setForm(EMPTY_FORM);
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(u: AppUser) {
    setForm({
      id: u.id,
      name: u.name,
      email: u.email,
      roleId: String(u.roleId ?? u.role?.id ?? ''),
      departmentId: u.departmentId ? String(u.departmentId) : '',
    });
    setFormError('');
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError('');
    if (!form.roleId) {
      setFormError('Please select a role.');
      return;
    }
    setSaving(true);
    try {
      if (form.id) {
        await usersApi.update(form.id, {
          name: form.name,
          email: form.email,
          roleId: Number(form.roleId),
          departmentId: form.departmentId ? Number(form.departmentId) : null,
        });
        notify('User updated.', 'success');
      } else {
        const created = await usersApi.create({
          name: form.name,
          email: form.email,
          roleId: Number(form.roleId),
          departmentId: form.departmentId ? Number(form.departmentId) : undefined,
        });
        setCreateResult(created);
        notify('User created.', 'success');
      }
      setModalOpen(false);
      loadAll();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function copyCreateResult() {
    if (!createResult) return;
    const text = formatApiResult(createResult);
    setCopying(true);
    try {
      await navigator.clipboard.writeText(text);
      notify('Copied user details.', 'success');
    } catch {
      notify('Copy failed. Select the text and copy it manually.', 'error');
    } finally {
      setCopying(false);
    }
  }

  async function toggleStatus(u: AppUser) {
    try {
      await usersApi.toggleStatus(u.id);
      notify(u.isActive ? 'User deactivated.' : 'User activated.', 'success');
      loadAll();
    } catch (e) {
      notify(errorMessage(e), 'error');
    }
  }

  async function forceReset(u: AppUser) {
    try {
      await usersApi.forceResetRequired(u.id);
      notify('User must change their password on next login.', 'success');
      loadAll();
    } catch (e) {
      notify(errorMessage(e), 'error');
    }
  }

  async function handleDelete() {
    if (!confirmTarget) return;
    setConfirmLoading(true);
    setDeleteError('');
    try {
      await usersApi.remove(confirmTarget.id);
      notify('User deleted.', 'success');
      setConfirmTarget(null);
      loadAll();
    } catch (e) {
      const message = userDeleteMessage(errorMessage(e), confirmTarget.name);
      setDeleteError(message);
      notify(message, 'error');
    } finally {
      setConfirmLoading(false);
    }
  }

  const roleBadgeClass = (roleName: string) =>
    roleName === 'Admin' ? 'badge-brass' : roleName === 'Manager' ? 'badge-accent' : 'badge-muted';

  return (
    <div>
      <div className="page-header">
        <div>
          <span className="page-eyebrow">Administration</span>
          <h1 className="page-title">Users</h1>
          <p className="page-subtitle">Create accounts and assign roles and departments.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={openCreate}>
            + New user
          </button>
        </div>
      </div>

      {error && <div className="banner banner-danger">{error}</div>}

      {loading ? (
        <div className="center-loading">
          <div className="spinner" />
        </div>
      ) : users.length === 0 ? (
        <EmptyState title="No users yet" message="Create the first account to get started." />
      ) : (
        <div className="table-wrap users-table-wrap">
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Department</th>
                <th>Status</th>
                <th>Joined</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td data-label="Name">{u.name}</td>
                  <td data-label="Email">{u.email}</td>
                  <td data-label="Role">
                    <span className={`badge ${roleBadgeClass(u.role?.name)}`}>{u.role?.name}</span>
                  </td>
                  <td data-label="Department">{u.department?.name || '-'}</td>
                  <td data-label="Status">
                    <span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {u.isActive ? 'Active' : 'Disabled'}
                    </span>
                    {u.mustChangePassword && (
                      <span className="badge badge-brass" style={{ marginLeft: 6 }}>
                        Pwd reset pending
                      </span>
                    )}
                  </td>
                  <td data-label="Joined">{formatDate(u.createdAt)}</td>
                  <td data-label="Actions">
                    <div className="row-actions">
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(u)}>
                        Edit
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => toggleStatus(u)}>
                        {u.isActive ? 'Disable' : 'Enable'}
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => forceReset(u)}>
                        Force reset
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => {
                          setDeleteError('');
                          setConfirmTarget(u);
                        }}
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

      {modalOpen && (
        <Modal
          title={form.id ? 'Edit user' : 'New user'}
          onClose={() => setModalOpen(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
                {saving ? 'Saving...' : form.id ? 'Save changes' : 'Create user'}
              </button>
            </>
          }
        >
          <form onSubmit={handleSubmit}>
            {formError && <div className="banner banner-danger">{formError}</div>}
            <div className="field">
              <label>Full name</label>
              <input
                className="input"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Email</label>
              <input
                className="input"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Role</label>
              <select
                className="select"
                required
                value={form.roleId}
                onChange={(e) => setForm({ ...form, roleId: e.target.value })}
              >
                <option value="">Select a role...</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Department</label>
              <select
                className="select"
                value={form.departmentId}
                onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
              >
                <option value="">No department (Admin only)</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </form>
        </Modal>
      )}

      {createResult && (
        <Modal
          title="User created"
          onClose={() => setCreateResult(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setCreateResult(null)}>
                Close
              </button>
              <button className="btn btn-primary" onClick={copyCreateResult} disabled={copying}>
                {copying ? 'Copying...' : 'Copy'}
              </button>
            </>
          }
        >
          <p className="modal-note">Copy these details and send them to the new user.</p>
          <div className="api-result">{formatApiResult(createResult)}</div>
        </Modal>
      )}

      {confirmTarget && (
        <Modal
          title="Delete user"
          onClose={() => {
            setDeleteError('');
            setConfirmTarget(null);
          }}
          footer={
            <>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setDeleteError('');
                  setConfirmTarget(null);
                }}
                disabled={confirmLoading}
              >
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={confirmLoading}>
                {confirmLoading ? 'Working...' : 'Delete'}
              </button>
            </>
          }
        >
          {deleteError && <div className="banner banner-danger">{deleteError}</div>}
          {confirmTarget.id === sessionUser?.id && (
            <div className="banner banner-warn">
              You are trying to delete your own signed-in account. The API may block this.
            </div>
          )}
          <p>
            Delete {confirmTarget.name}? 
          </p>
        </Modal>
      )}
    </div>
  );
}

export default function UsersPage() {
  return (
    <RequireAuth allow={['Admin']}>
      <UsersBody />
    </RequireAuth>
  );
}
