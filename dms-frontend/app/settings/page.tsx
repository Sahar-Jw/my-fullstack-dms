'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import RequireAuth from '@/components/RequireAuth';
import { settingsApi } from '@/lib/endpoints';
import { DictionaryEntry, RoleName, Setting } from '@/lib/types';
import { errorMessage } from '@/lib/api';
import { useToast } from '@/lib/toast-context';
import { useLocale } from '@/lib/i18n/locale-provider';
import { useSettings } from '@/lib/settings-context';

const MAX_ASSET_MB = 2;

// Mirrors the built-in "Ledger" theme defaults in globals.css / the Setting
// entity's column defaults, so "Reset to defaults" doesn't need a round trip
// to the server.
const DEFAULT_THEME = {
  themeColor: '#2f5d50',
  themeAccentInkColor: '#ffffff',
  themeSecondaryColor: '#b8912f',
  themeBackgroundColor: '#f6f5f1',
  themeSurfaceColor: '#ffffff',
  themeTextColor: '#1b211d',
};

type EditedEntry = { en: string; ar: string };

function SettingsBody() {
  const { notify } = useToast();
  const { t } = useLocale();
  const { logoUrl, faviconUrl, refresh: refreshSiteSettings } = useSettings();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    siteName: '',
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    themeColor: '#2f5d50',
    themeAccentInkColor: '#ffffff',
    themeSecondaryColor: '#b8912f',
    themeBackgroundColor: '#f6f5f1',
    themeSurfaceColor: '#ffffff',
    themeTextColor: '#1b211d',
    maxUploadSizeMb: 10,
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
  const [assetError, setAssetError] = useState('');

  const [dictionary, setDictionary] = useState<DictionaryEntry[]>([]);
  const [edited, setEdited] = useState<Record<string, EditedEntry>>({});
  const [dictSearch, setDictSearch] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [settings, dict] = await Promise.all([settingsApi.get(), settingsApi.getDictionary()]);
      applySettingsToForm(settings);
      setDictionary(dict);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  function applySettingsToForm(settings: Setting) {
    setForm({
      siteName: settings.siteName || '',
      metaTitle: settings.metaTitle || '',
      metaDescription: settings.metaDescription || '',
      metaKeywords: settings.metaKeywords || '',
      themeColor: settings.themeColor || '#2f5d50',
      themeAccentInkColor: settings.themeAccentInkColor || '#ffffff',
      themeSecondaryColor: settings.themeSecondaryColor || '#b8912f',
      themeBackgroundColor: settings.themeBackgroundColor || '#f6f5f1',
      themeSurfaceColor: settings.themeSurfaceColor || '#ffffff',
      themeTextColor: settings.themeTextColor || '#1b211d',
      maxUploadSizeMb: settings.maxUploadSizeMb || 10,
    });
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleAssetChange(kind: 'logo' | 'favicon', e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAssetError('');
    if (file.size > MAX_ASSET_MB * 1024 * 1024) {
      setAssetError(t('settings.fileTooLarge', { max: MAX_ASSET_MB }));
      e.target.value = '';
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    if (kind === 'logo') {
      setLogoFile(file);
      setLogoPreview(previewUrl);
    } else {
      setFaviconFile(file);
      setFaviconPreview(previewUrl);
    }
  }

  function updateDictField(key: string, lang: 'en' | 'ar', value: string) {
    setEdited((prev) => {
      const base = dictionary.find((d) => d.key === key);
      const current = prev[key] || { en: base?.en ?? '', ar: base?.ar ?? '' };
      return { ...prev, [key]: { ...current, [lang]: value } };
    });
  }

  const filteredDictionary = useMemo(() => {
    const query = dictSearch.trim().toLowerCase();
    if (!query) return dictionary;
    return dictionary.filter((entry) => {
      const merged = edited[entry.key];
      const en = merged?.en ?? entry.en;
      const ar = merged?.ar ?? entry.ar;
      return (
        entry.key.toLowerCase().includes(query) ||
        en.toLowerCase().includes(query) ||
        ar.includes(query)
      );
    });
  }, [dictionary, dictSearch, edited]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const dictionaryPayload = Object.entries(edited).map(([key, value]) => ({
        key,
        en: value.en,
        ar: value.ar,
      }));

      const updated = await settingsApi.update({
        siteName: form.siteName,
        metaTitle: form.metaTitle,
        metaDescription: form.metaDescription,
        metaKeywords: form.metaKeywords,
        themeColor: form.themeColor,
        themeAccentInkColor: form.themeAccentInkColor,
        themeSecondaryColor: form.themeSecondaryColor,
        themeBackgroundColor: form.themeBackgroundColor,
        themeSurfaceColor: form.themeSurfaceColor,
        themeTextColor: form.themeTextColor,
        maxUploadSizeMb: Number(form.maxUploadSizeMb),
        logo: logoFile,
        favicon: faviconFile,
        dictionary: dictionaryPayload.length > 0 ? dictionaryPayload : undefined,
      });

      applySettingsToForm(updated);
      setLogoFile(null);
      setFaviconFile(null);
      setLogoPreview(null);
      setFaviconPreview(null);
      setEdited({});
      await load();
      await refreshSiteSettings(); // instantly refreshes logo/favicon/theme/meta site-wide
      notify(t('settings.saved'), 'success');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="center-loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <span className="page-eyebrow">{t('settings.eyebrow')}</span>
          <h1 className="page-title">{t('settings.title')}</h1>
          <p className="page-subtitle">{t('settings.subtitle')}</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? t('settings.saving') : t('settings.saveAll')}
          </button>
        </div>
      </div>

      {error && <div className="banner banner-danger">{error}</div>}
      {assetError && <div className="banner banner-danger">{assetError}</div>}

      <form onSubmit={handleSubmit}>
        <section className="card" style={{ marginBottom: 20, padding: 20 }}>
          <h2 style={{ marginTop: 0 }}>{t('settings.generalSection')}</h2>
          <div className="field">
            <label>{t('settings.siteName')}</label>
            <input
              className="input"
              value={form.siteName}
              onChange={(e) => setForm({ ...form, siteName: e.target.value })}
            />
          </div>
        </section>

        <section className="card" style={{ marginBottom: 20, padding: 20 }}>
          <h2 style={{ marginTop: 0 }}>{t('settings.brandingSection')}</h2>
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
            <div className="field" style={{ minWidth: 220 }}>
              <label>{t('settings.logo')}</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 4,
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    background: 'var(--color-surface-sunken)',
                  }}
                >
                  {logoPreview || logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logoPreview || logoUrl || ''}
                      alt="Logo preview"
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>—</span>
                  )}
                </div>
                <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                  {t('settings.uploadLogo')}
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,.svg,.webp,.gif"
                    style={{ display: 'none' }}
                    onChange={(e) => handleAssetChange('logo', e)}
                  />
                </label>
              </div>
              <div className="field-hint">{t('settings.logoHint')}</div>
            </div>

            <div className="field" style={{ minWidth: 220 }}>
              <label>{t('settings.favicon')}</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 4,
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    background: 'var(--color-surface-sunken)',
                  }}
                >
                  {faviconPreview || faviconUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={faviconPreview || faviconUrl || ''}
                      alt="Favicon preview"
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <span style={{ fontSize: 11, color: 'var(--color-muted)' }}>—</span>
                  )}
                </div>
                <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                  {t('settings.uploadFavicon')}
                  <input
                    type="file"
                    accept=".ico,.png,.svg"
                    style={{ display: 'none' }}
                    onChange={(e) => handleAssetChange('favicon', e)}
                  />
                </label>
              </div>
              <div className="field-hint">{t('settings.faviconHint')}</div>
            </div>

            {/* <div className="field" style={{ minWidth: 160 }}>
              <label>{t('settings.themeColor')}</label>
              <input
                type="color"
                value={form.themeColor}
                onChange={(e) => setForm({ ...form, themeColor: e.target.value })}
                style={{ width: 64, height: 36, padding: 2, border: '1px solid var(--color-border)', borderRadius: 4 }}
              />
            </div> */}
          </div>
        </section>

        <section className="card" style={{ marginBottom: 20, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ marginTop: 0, marginBottom: 4 }}>{t('settings.themeSection')}</h2>
              <p className="page-subtitle" style={{ margin: 0 }}>{t('settings.themeSubtitle')}</p>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() =>
                setForm({
                  ...form,
                  themeColor: DEFAULT_THEME.themeColor,
                  themeAccentInkColor: DEFAULT_THEME.themeAccentInkColor,
                  themeSecondaryColor: DEFAULT_THEME.themeSecondaryColor,
                  themeBackgroundColor: DEFAULT_THEME.themeBackgroundColor,
                  themeSurfaceColor: DEFAULT_THEME.themeSurfaceColor,
                  themeTextColor: DEFAULT_THEME.themeTextColor,
                })
              }
            >
              {t('settings.themeReset')}
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 20,
              marginTop: 16,
            }}
          >
            {(
              [
                ['themeColor', 'themePrimary', 'themePrimaryHint'],
                ['themeAccentInkColor', 'themePrimaryText', 'themePrimaryTextHint'],
                ['themeSecondaryColor', 'themeSecondary', 'themeSecondaryHint'],
                ['themeBackgroundColor', 'themeBackground', 'themeBackgroundHint'],
                ['themeSurfaceColor', 'themeSurface', 'themeSurfaceHint'],
                ['themeTextColor', 'themeText', 'themeTextHint'],
              ] as const
            ).map(([field, labelKey, hintKey]) => (
              <div className="field" key={field}>
                <label>{t(`settings.${labelKey}`)}</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="color"
                    value={form[field]}
                    onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                    style={{ width: 44, height: 36, padding: 2, border: '1px solid var(--color-border)', borderRadius: 4, flexShrink: 0 }}
                  />
                  <input
                    className="input"
                    value={form[field]}
                    onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                    maxLength={7}
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}
                  />
                </div>
                <div className="field-hint">{t(`settings.${hintKey}`)}</div>
              </div>
            ))}
          </div>

          <div
            className="table-wrap"
            style={{
              marginTop: 20,
              padding: 20,
              borderRadius: 'var(--radius-md)',
              background: form.themeBackgroundColor,
              border: '1px solid var(--color-border)',
            }}
          >
            <div
              style={{
                background: form.themeSurfaceColor,
                borderRadius: 'var(--radius-sm)',
                padding: 16,
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <p style={{ margin: '0 0 12px', color: form.themeTextColor, fontWeight: 600 }}>
                {t('settings.themePreviewTitle')}
              </p>
              <p style={{ margin: '0 0 16px', color: form.themeTextColor, fontSize: 13 }}>
                {t('settings.themePreviewBody')}
              </p>
              <button
                type="button"
                className="btn"
                style={{
                  background: form.themeColor,
                  color: form.themeAccentInkColor,
                  border: 'none',
                }}
              >
                {t('settings.themePreviewButton')}
              </button>
              <span style={{ marginInlineStart: 10, color: form.themeSecondaryColor, fontWeight: 600, fontSize: 13 }}>
                {t('settings.themePreviewAccent')}
              </span>
            </div>
          </div>
        </section>

        <section className="card" style={{ marginBottom: 20, padding: 20 }}>
          <h2 style={{ marginTop: 0 }}>{t('settings.seoSection')}</h2>
          <div className="field">
            <label>{t('settings.metaTitle')}</label>
            <input
              className="input"
              value={form.metaTitle}
              onChange={(e) => setForm({ ...form, metaTitle: e.target.value })}
            />
          </div>
          <div className="field">
            <label>{t('settings.metaDescription')}</label>
            <textarea
              className="input"
              rows={2}
              value={form.metaDescription}
              onChange={(e) => setForm({ ...form, metaDescription: e.target.value })}
            />
          </div>
          <div className="field">
            <label>{t('settings.metaKeywords')}</label>
            <input
              className="input"
              value={form.metaKeywords}
              onChange={(e) => setForm({ ...form, metaKeywords: e.target.value })}
            />
            <div className="field-hint">{t('settings.metaKeywordsHint')}</div>
          </div>
        </section>

        <section className="card" style={{ marginBottom: 20, padding: 20 }}>
          <h2 style={{ marginTop: 0 }}>{t('settings.uploadsSection')}</h2>
          <div className="field" style={{ maxWidth: 240 }}>
            <label>{t('settings.maxUploadSize')}</label>
            <input
              type="number"
              className="input"
              min={1}
              max={200}
              value={form.maxUploadSizeMb}
              onChange={(e) => setForm({ ...form, maxUploadSizeMb: Number(e.target.value) })}
            />
            <div className="field-hint">{t('settings.maxUploadSizeHint')}</div>
          </div>
        </section>

        <section className="card" style={{ padding: 20 }}>
          <h2 style={{ marginTop: 0 }}>{t('settings.dictionarySection')}</h2>
          <p className="page-subtitle" style={{ margin: '0 0 12px' }}>
            {t('settings.dictionarySubtitle')}
          </p>
          <input
            className="input"
            style={{ marginBottom: 12, maxWidth: 320 }}
            placeholder={t('settings.dictionarySearch')}
            value={dictSearch}
            onChange={(e) => setDictSearch(e.target.value)}
          />
          <div className="table-wrap" style={{ maxHeight: 480, overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>{t('settings.dictionaryKey')}</th>
                  <th>{t('settings.dictionaryEn')}</th>
                  <th>{t('settings.dictionaryAr')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredDictionary.length === 0 ? (
                  <tr>
                    <td colSpan={3}>{t('settings.noResults')}</td>
                  </tr>
                ) : (
                  filteredDictionary.map((entry) => {
                    const en = edited[entry.key]?.en ?? entry.en;
                    const ar = edited[entry.key]?.ar ?? entry.ar;
                    return (
                      <tr key={entry.key}>
                        <td>
                          <code style={{ fontSize: 12 }}>{entry.key}</code>
                        </td>
                        <td>
                          <input
                            className="input"
                            value={en}
                            onChange={(ev) => updateDictField(entry.key, 'en', ev.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            className="input"
                            dir="rtl"
                            value={ar}
                            onChange={(ev) => updateDictField(entry.key, 'ar', ev.target.value)}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </form>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <RequireAuth allow={[RoleName.Admin]}>
      <SettingsBody />
    </RequireAuth>
  );
}