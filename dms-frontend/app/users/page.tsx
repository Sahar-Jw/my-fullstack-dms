'use client';

import { FormEvent, useEffect, useState } from 'react';
import RequireAuth from '@/components/RequireAuth';
import Modal from '@/components/Modal';
import EmptyState from '@/components/EmptyState';
import { usersApi, rolesApi, departmentsApi } from '@/lib/endpoints';
import { AppUser, Department, Role, RoleName } from '@/lib/types';
import { errorMessage } from '@/lib/api';
import { useToast } from '@/lib/toast-context';
import { formatDate } from '@/lib/format';
import { useAuth } from '@/lib/auth-context';
import { useLocale } from '@/lib/i18n/locale-provider';

interface UserFormState {
  id: number;
  name: string;
  email: string;
  roleId: string;
  departmentId: string;
}

const EMPTY_FORM: UserFormState = {
  id: 0,
  name: '',
  email: '',
  roleId: '',
  departmentId: '',
};

function userDeleteMessage(
  message: string,
  userName: string,
  t: (key: string, opts?: any) => string,
): string {
  const normalized = message.toLowerCase();

  if (normalized.includes('foreign key') && normalized.includes('document_versions')) {
    return t('users.cannotDeleteVersions', { name: userName });
  }

  if (normalized.includes('foreign key') && normalized.includes('documents')) {
    return t('users.cannotDeleteDocuments', { name: userName });
  }

  if (normalized.includes('foreign key')) {
    return t('users.cannotDeleteGeneric', { name: userName });
  }

  return message;
}

function UsersBody() {
  const { notify } = useToast();
  const { t } = useLocale();
  const { user: sessionUser } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ---------- Search (same pattern/style as the documents page) ----------
  const [nameFilter, setNameFilter] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [joinedFrom, setJoinedFrom] = useState('');
  const [joinedTo, setJoinedTo] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<UserFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const [confirmTarget, setConfirmTarget] = useState<AppUser | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  async function loadLookups() {
    try {
      const [r, d] = await Promise.all([rolesApi.list(), departmentsApi.list()]);
      setRoles(r);
      setDepartments(d);
    } catch (e) {
      notify(errorMessage(e), 'error');
    }
  }

  async function loadUsers(useSearch = false) {
    setLoading(true);
    setError('');
    try {
      if (
        useSearch ||
        nameFilter ||
        emailFilter ||
        departmentFilter ||
        roleFilter ||
        statusFilter ||
        joinedFrom ||
        joinedTo
      ) {
        const result = await usersApi.search({
          name: nameFilter || undefined,
          email: emailFilter || undefined,
          departmentId: departmentFilter ? Number(departmentFilter) : undefined,
          roleId: roleFilter ? Number(roleFilter) : undefined,
          isActive: statusFilter ? (statusFilter as 'true' | 'false') : undefined,
          joinedFrom: joinedFrom || undefined,
          joinedTo: joinedTo || undefined,
        });
        setUsers(result ?? []);
      } else {
        const result = await usersApi.list();
        setUsers(result ?? []);
      }
    } catch (e) {
      setError(errorMessage(e));
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLookups();
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    loadUsers(true);
  }

  function handleResetSearch() {
    setNameFilter('');
    setEmailFilter('');
    setDepartmentFilter('');
    setRoleFilter('');
    setStatusFilter('');
    setJoinedFrom('');
    setJoinedTo('');
    loadUsers(false);
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
      setFormError(t('users.roleRequired'));
      return;
    }
    setSaving(true);
    try {
      const updateData: any = {};
      if (form.name) updateData.name = form.name;
      if (form.email) updateData.email = form.email;
      if (form.roleId) updateData.roleId = Number(form.roleId);
      updateData.departmentId = form.departmentId ? Number(form.departmentId) : null;

      await usersApi.update(form.id, updateData);
      notify(t('users.userUpdated'), 'success');
      setModalOpen(false);
      loadUsers();
    } catch (err) {
      setFormError(errorMessage(err));
      notify(errorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(u: AppUser) {
    try {
      await usersApi.toggleStatus(u.id);
      notify(u.isActive ? t('users.userDeactivated') : t('users.userActivated'), 'success');
      loadUsers();
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
      notify(t('users.userDeleted'), 'success');
      setConfirmTarget(null);
      loadUsers();
    } catch (e) {
      const message = userDeleteMessage(errorMessage(e), confirmTarget.name, t);
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
          <span className="page-eyebrow">{t('users.eyebrow')}</span>
          <h1 className="page-title">{t('users.title')}</h1>
          <p className="page-subtitle">{t('users.subtitle')}</p>
        </div>
      </div>

      <form className="card card-pad" onSubmit={handleSearchSubmit} style={{ marginBottom: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: 12 }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>{t('users.name')}</label>
            <input
              className="input"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              placeholder={t('users.searchByNamePlaceholder')}
            />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>{t('users.email')}</label>
            <input
              className="input"
              value={emailFilter}
              onChange={(e) => setEmailFilter(e.target.value)}
              placeholder={t('users.searchByEmailPlaceholder')}
            />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>{t('users.department')}</label>
            <select
              className="select"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <option value="">{t('users.anyDepartment')}</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>{t('users.role')}</label>
            <select
              className="select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">{t('users.anyRole')}</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>{t('users.status')}</label>
            <select
              className="select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">{t('users.anyStatus')}</option>
              <option value="true">{t('users.active')}</option>
              <option value="false">{t('users.disabled')}</option>
            </select>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>{t('users.joinedFrom')}</label>
            <input
              className="input"
              type="date"
              value={joinedFrom}
              onChange={(e) => setJoinedFrom(e.target.value)}
            />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>{t('users.joinedTo')}</label>
            <input
              className="input"
              type="date"
              value={joinedTo}
              onChange={(e) => setJoinedTo(e.target.value)}
            />
          </div>
        </div>
        <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
          <button className="btn btn-primary btn-sm" type="submit">
            {t('users.search')}
          </button>
          <button
            className="btn btn-ghost btn-sm"
            type="button"
            onClick={handleResetSearch}
          >
            {t('users.reset')}
          </button>
        </div>
      </form>

      {error && <div className="banner banner-danger">{error}</div>}

      {loading ? (
        <div className="center-loading">
          <div className="spinner" />
        </div>
      ) : users.length === 0 ? (
        <EmptyState title={t('users.noUsersFound')} message={t('users.tryAdjusting')} />
      ) : (
        <div className="table-wrap users-table-wrap">
          <table className="users-table">
            <thead>
              <tr>
                <th>{t('users.name')}</th>
                <th>{t('users.email')}</th>
                <th>{t('users.role')}</th>
                <th>{t('users.department')}</th>
                <th>{t('users.status')}</th>
                <th>{t('users.joined')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td data-label={t('users.name')}>{u.name}</td>
                  <td data-label={t('users.email')}>{u.email}</td>
                  <td data-label={t('users.role')}>
                    <span className={`badge ${roleBadgeClass(u.role?.name)}`}>{u.role?.name}</span>
                  </td>
                  <td data-label={t('users.department')}>{u.department?.name || '-'}</td>
                  <td data-label={t('users.status')}>
                    <span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {u.isActive ? t('users.active') : t('users.disabled')}
                    </span>
                  </td>
                  <td data-label={t('users.joined')}>{formatDate(u.createdAt)}</td>
                  <td data-label="Actions">
                    <div className="row-actions">
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(u)}>
                        {t('users.edit')}
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => toggleStatus(u)}>
                        {u.isActive ? t('users.disable') : t('users.enable')}
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => {
                          setDeleteError('');
                          setConfirmTarget(u);
                        }}
                      >
                        {t('users.delete')}
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
          title={t('users.editUser')}
          onClose={() => setModalOpen(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                {t('users.cancel')}
              </button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
                {saving ? t('users.saving') : t('users.saveChanges')}
              </button>
            </>
          }
        >
          <form onSubmit={handleSubmit}>
            {formError && <div className="banner banner-danger">{formError}</div>}
            <div className="field">
              <label>{t('users.fullName')}</label>
              <input
                className="input"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="field">
              <label>{t('users.email')}</label>
              <input
                className="input"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="field">
              <label>{t('users.role')}</label>
              <select
                className="select"
                required
                value={form.roleId}
                onChange={(e) => setForm({ ...form, roleId: e.target.value })}
              >
                <option value="">{t('users.selectRole')}</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>{t('users.department')}</label>
              <select
                className="select"
                value={form.departmentId}
                onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
              >
                <option value="">{t('users.noDepartmentAdminOnly')}</option>
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

      {confirmTarget && (
        <Modal
          title={t('users.deleteUser')}
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
                {t('users.cancel')}
              </button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={confirmLoading}>
                {confirmLoading ? t('users.working') : t('users.delete')}
              </button>
            </>
          }
        >
          {deleteError && <div className="banner banner-danger">{deleteError}</div>}
          {confirmTarget.id === sessionUser?.id && (
            <div className="banner banner-warn">
              {t('users.ownAccountWarning')}
            </div>
          )}
          <p>{t('users.deleteConfirm', { name: confirmTarget.name })}</p>
        </Modal>
      )}
    </div>
  );
}

export default function UsersPage() {
  return (
    <RequireAuth allow={[RoleName.Admin]}>
      <UsersBody />
    </RequireAuth>
  );
}
