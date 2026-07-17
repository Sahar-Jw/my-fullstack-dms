'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ar from './locales/ar.json';

export type Locale = 'en' | 'ar';

// Guard against re-initializing on every hot reload / re-render.
if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
    },
    lng: 'en', // default; overridden client-side after mount, see provider below
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes; avoid double-escaping
    },
    react: {
      useSuspense: false, // avoids Suspense boundary requirements in App Router
    },
  });
}

export default i18n;