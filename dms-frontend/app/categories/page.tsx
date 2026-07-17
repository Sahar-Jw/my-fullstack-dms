'use client';

import { FormEvent, useEffect, useState } from 'react';
import RequireAuth from '@/components/RequireAuth';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import EmptyState from '@/components/EmptyState';
import { categoriesApi } from '@/lib/endpoints';
import { Category } from '@/lib/types';
import { errorMessage } from '@/lib/api';
import { useToast } from '@/lib/toast-context';
import { useAuth } from '@/lib/auth-context';
import { useLocale } from '@/lib/i18n/locale-provider';

function CategoriesBody() {
  const { user } = useAuth();
  const { notify } = useToast();
  const { t } = useLocale();
  const isAdmin = user?.role === 'Admin';

  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<{ id?: number; name: string; description: string }>({
    name: '',
    description: '',
  });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<Category | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      setItems(await categoriesApi.list());
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

  function openEdit(c: Category) {
    setForm({ id: c.id, name: c.name, description: c.description || '' });
    setFormError('');
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      if (form.id) {
        await categoriesApi.update(form.id, { name: form.name, description: form.description });
        notify(t('categories.updated'), 'success');
      } else {
        await categoriesApi.create({ name: form.name, description: form.description });
        notify(t('categories.created'), 'success');
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
      await categoriesApi.remove(confirmTarget.id);
      notify(t('categories.deleted'), 'success');
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
          <span className="page-eyebrow">{t('categories.eyebrow')}</span>
          <h1 className="page-title">{t('categories.title')}</h1>
          <p className="page-subtitle">{t('categories.subtitle')}</p>
        </div>
        {isAdmin && (
          <div className="page-actions">
            <button className="btn btn-primary" onClick={openCreate}>
              {t('categories.newCategory')}
            </button>
          </div>
        )}
      </div>

      {error && <div className="banner banner-danger">{error}</div>}

      {loading ? (
        <div className="center-loading">
          <div className="spinner" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState title={t('categories.noCategoriesYet')} />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('categories.name')}</th>
                <th>{t('categories.description')}</th>
                {isAdmin && <th></th>}
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.description || '—'}</td>
                  {isAdmin && (
                    <td>
                      <div className="row-actions">
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(c)}>
                          {t('categories.edit')}
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => setConfirmTarget(c)}
                        >
                          {t('categories.delete')}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <Modal
          title={form.id ? t('categories.editCategory') : t('categories.newCategoryTitle')}
          onClose={() => setModalOpen(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                {t('categories.cancel')}
              </button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
                {saving ? t('categories.saving') : t('categories.save')}
              </button>
            </>
          }
        >
          <form onSubmit={handleSubmit}>
            {formError && <div className="banner banner-danger">{formError}</div>}
            <div className="field">
              <label>{t('categories.name')}</label>
              <input
                className="input"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="field">
              <label>{t('categories.description')}</label>
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
          title={t('categories.deleteCategory')}
          message={t('categories.deleteConfirm', { name: confirmTarget.name })}
          confirmLabel={t('categories.delete')}
          danger
          loading={confirmLoading}
          onConfirm={handleDelete}
          onCancel={() => setConfirmTarget(null)}
        />
      )}
    </div>
  );
}

export default function CategoriesPage() {
  return (
    <RequireAuth>
      <CategoriesBody />
    </RequireAuth>
  );
}