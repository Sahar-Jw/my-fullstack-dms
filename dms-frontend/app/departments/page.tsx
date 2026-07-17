'use client';

import { FormEvent, useEffect, useState } from 'react';
import RequireAuth from '@/components/RequireAuth';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import EmptyState from '@/components/EmptyState';
import { departmentsApi } from '@/lib/endpoints';
import { Department, RoleName } from '@/lib/types';
import { errorMessage } from '@/lib/api';
import { useToast } from '@/lib/toast-context';
import { useLocale } from '@/lib/i18n/locale-provider';

function DepartmentsBody() {
  const { notify } = useToast();
  const { t } = useLocale();
  const [items, setItems] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<{ id?: number; name: string; description: string }>({
    name: '',
    description: '',
  });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<Department | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      setItems(await departmentsApi.list());
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setForm({ name: '', description: '' });
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(d: Department) {
    setForm({ id: d.id, name: d.name, description: d.description || '' });
    setFormError('');
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      if (form.id) {
        await departmentsApi.update(form.id, { name: form.name, description: form.description });
        notify(t('departments.updated'), 'success');
      } else {
        await departmentsApi.create({ name: form.name, description: form.description });
        notify(t('departments.created'), 'success');
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
      await departmentsApi.remove(confirmTarget.id);
      notify(t('departments.deleted'), 'success');
      setConfirmTarget(null);
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
          <span className="page-eyebrow">{t('departments.eyebrow')}</span>
          <h1 className="page-title">{t('departments.title')}</h1>
          <p className="page-subtitle">{t('departments.subtitle')}</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={openCreate}>
            {t('departments.newDepartment')}
          </button>
        </div>
      </div>

      {error && <div className="banner banner-danger">{error}</div>}

      {loading ? (
        <div className="center-loading">
          <div className="spinner" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState title={t('departments.noDepartmentsYet')} message={t('departments.createFirst')} />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('departments.name')}</th>
                <th>{t('departments.description')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((d) => (
                <tr key={d.id}>
                  <td>{d.name}</td>
                  <td>{d.description || '—'}</td>
                  <td>
                    <div className="row-actions">
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(d)}>
                        {t('departments.edit')}
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => setConfirmTarget(d)}
                      >
                        {t('departments.delete')}
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
          title={form.id ? t('departments.editDepartment') : t('departments.newDepartmentTitle')}
          onClose={() => setModalOpen(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                {t('departments.cancel')}
              </button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
                {saving ? t('departments.saving') : t('departments.save')}
              </button>
            </>
          }
        >
          <form onSubmit={handleSubmit}>
            {formError && <div className="banner banner-danger">{formError}</div>}
            <div className="field">
              <label>{t('departments.name')}</label>
              <input
                className="input"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="field">
              <label>{t('departments.description')}</label>
              <input
                className="input"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </form>
        </Modal>
      )}

      {confirmTarget && (
        <ConfirmDialog
          title={t('departments.deleteDepartment')}
          message={t('departments.deleteConfirm', { name: confirmTarget.name })}
          confirmLabel={t('departments.delete')}
          danger
          loading={confirmLoading}
          onConfirm={handleDelete}
          onCancel={() => setConfirmTarget(null)}
        />
      )}
    </div>
  );
}

export default function DepartmentsPage() {
  return (
    <RequireAuth allow={[RoleName.Admin]}>
      <DepartmentsBody />
    </RequireAuth>
  );
}