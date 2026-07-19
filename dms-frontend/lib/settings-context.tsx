'use client';

import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { settingsApi } from './endpoints';
import { Setting } from './types';
import { API_URL } from './api';
import i18n from './i18n/config';

const ASSET_BASE_URL = API_URL.replace(/\/api\/?$/, '');

interface SettingsContextValue {
  settings: Setting | null;
  loading: boolean;
  logoUrl: string | null;
  faviconUrl: string | null;
  maxUploadSizeMb: number;
  maxUploadSizeBytes: number;
  refresh: () => Promise<void>;
}

const DEFAULT_MAX_UPLOAD_MB = 10;

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

function assetUrl(
  kind: 'logo' | 'favicon',
  mime: string | null,
  updatedAt?: string,
): string | null {
  if (!mime) return null;
  // The bytes are served straight from Postgres via GET /settings/logo and
  // GET /settings/favicon. The version query string busts the browser
  // cache so a re-uploaded asset shows up immediately.
  const version = updatedAt ? `?v=${encodeURIComponent(updatedAt)}` : '';
  return `${ASSET_BASE_URL}/api/settings/${kind}${version}`;
}

function applyThemeColors(settings: Setting) {
  let styleTag = document.getElementById('dynamic-theme-vars') as HTMLStyleElement | null;
  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = 'dynamic-theme-vars';
    document.head.appendChild(styleTag);
  }
  // Only ever sets vars the admin actually has a value for -- falling back
  // to the built-in "Ledger" theme values in globals.css for anything
  // missing, so a partially-filled record (or an old DB row from before
  // these columns existed) never renders with blank/invalid CSS vars.
  const vars: Record<string, string | undefined> = {
    '--color-accent': settings.themeColor,
    '--color-accent-ink': settings.themeAccentInkColor,
    '--color-brass': settings.themeSecondaryColor,
    '--color-bg': settings.themeBackgroundColor,
    '--color-surface': settings.themeSurfaceColor,
    '--color-ink': settings.themeTextColor,
  };
  const declarations = Object.entries(vars)
    .filter(([, value]) => !!value)
    .map(([name, value]) => `${name}: ${value};`)
    .join(' ');
  styleTag.textContent = `:root { ${declarations} }`;
}

function applyFavicon(url: string | null) {
  if (!url) return;
  let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = url;
}

function applyMeta(settings: Setting) {
  if (settings.metaTitle) document.title = settings.metaTitle;

  const setMeta = (name: string, content: string) => {
    if (!content) return;
    let tag = document.querySelector<HTMLMetaElement>(`meta[name='${name}']`);
    if (!tag) {
      tag = document.createElement('meta');
      tag.name = name;
      document.head.appendChild(tag);
    }
    tag.content = content;
  };
  setMeta('description', settings.metaDescription);
  setMeta('keywords', settings.metaKeywords);
}

async function applyDictionary() {
  try {
    const entries = await settingsApi.getDictionary();
    const enBundle: Record<string, string> = {};
    const arBundle: Record<string, string> = {};
    for (const entry of entries) {
      if (entry.en) enBundle[entry.key] = entry.en;
      if (entry.ar) arBundle[entry.key] = entry.ar;
    }
    // deep=true, overwrite=true: DB values win over the bundled JSON for any
    // key the admin has edited; keys the admin hasn't touched keep falling
    // back to the static translation already loaded in config.ts.
    i18n.addResourceBundle('en', 'translation', unflatten(enBundle), true, true);
    i18n.addResourceBundle('ar', 'translation', unflatten(arBundle), true, true);
    // addResourceBundle only updates i18next's internal store — it doesn't fire
    // any of the events react-i18next listens for by default ('languageChanged'
    // or 'loaded'), so components already mounted with t() never re-render to
    // pick up the new values. Re-emitting 'languageChanged' for the current
    // language forces that re-render without actually switching languages.
    i18n.emit('languageChanged', i18n.language);
  } catch {
    // Dictionary is a progressive enhancement over the static bundle — if it
    // fails to load, the app keeps working with the built-in translations.
  }
}

// Converts { "nav.dashboard": "Dashboard" } into { nav: { dashboard: "Dashboard" } }
// so it merges correctly into i18next's nested resource tree.
function unflatten(flat: Record<string, string>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split('.');
    let node = result;
    for (let i = 0; i < parts.length - 1; i++) {
      node[parts[i]] = node[parts[i]] || {};
      node = node[parts[i]];
    }
    node[parts[parts.length - 1]] = value;
  }
  return result;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Setting | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await settingsApi.get();
      setSettings(data);
      applyThemeColors(data);
      applyMeta(data);
      applyFavicon(assetUrl('favicon', data.faviconMime, data.updatedAt));
      await applyDictionary();
    } catch {
      // Settings are a progressive enhancement over the app's built-in
      // defaults (colors/text from globals.css and the static i18n bundle),
      // so a failed fetch just means those defaults stay in effect.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value: SettingsContextValue = {
    settings,
    loading,
    logoUrl: settings ? assetUrl('logo', settings.logoMime, settings.updatedAt) : null,
    faviconUrl: settings ? assetUrl('favicon', settings.faviconMime, settings.updatedAt) : null,
    maxUploadSizeMb: settings?.maxUploadSizeMb ?? DEFAULT_MAX_UPLOAD_MB,
    maxUploadSizeBytes: (settings?.maxUploadSizeMb ?? DEFAULT_MAX_UPLOAD_MB) * 1024 * 1024,
    refresh,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}