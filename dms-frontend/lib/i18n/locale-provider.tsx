'use client';

import { ReactNode, useEffect, useState, createContext, useContext, useCallback } from 'react';
import { I18nextProvider, useTranslation } from 'react-i18next';
import i18n, { Locale } from './config';

interface LocaleExtras {
  locale: Locale;
  dir: 'ltr' | 'rtl';
  setLocale: (locale: Locale) => void;
}

const LocaleExtrasContext = createContext<LocaleExtras | undefined>(undefined);

function LocaleSync({ children }: { children: ReactNode }) {
  const { i18n: i18nInstance } = useTranslation();
  const [locale, setLocaleState] = useState<Locale>('en');

  // Sync stored preference after mount (avoids SSR/client hydration mismatch,
  // since the server always renders the 'en' default).
  useEffect(() => {
    const stored = window.localStorage.getItem('dms_locale') as Locale | null;
    if (stored === 'en' || stored === 'ar') {
      setLocaleState(stored);
      i18nInstance.changeLanguage(stored);
    }
  }, [i18nInstance]);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  }, [locale]);

  const setLocale = useCallback(
    (next: Locale) => {
      window.localStorage.setItem('dms_locale', next);
      i18nInstance.changeLanguage(next);
      setLocaleState(next);
    },
    [i18nInstance],
  );

  return (
    <LocaleExtrasContext.Provider value={{ locale, dir: locale === 'ar' ? 'rtl' : 'ltr', setLocale }}>
      {children}
    </LocaleExtrasContext.Provider>
  );
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <LocaleSync>{children}</LocaleSync>
    </I18nextProvider>
  );
}

// Combines react-i18next's own hook with our extra dir/setLocale state,
// so components only need one import instead of two.
export function useLocale() {
  const extras = useContext(LocaleExtrasContext);
  const { t } = useTranslation();
  if (!extras) throw new Error('useLocale must be used within LocaleProvider');
  return { ...extras, t };
}