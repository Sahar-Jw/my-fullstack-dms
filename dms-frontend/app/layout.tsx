import type { Metadata } from 'next';
// @ts-ignore: side-effect CSS import declaration missing
import './globals.css';
import { LocaleProvider } from '@/lib/i18n/locale-provider';
import { AuthProvider } from '@/lib/auth-context';
import { ToastProvider } from '@/lib/toast-context';
import { SettingsProvider } from '@/lib/settings-context';

export const metadata: Metadata = {
  title: 'Ledger — Document Management',
  description: 'Document management system',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&family=Cairo:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <LocaleProvider>
          <SettingsProvider>
            <AuthProvider>
              <ToastProvider>{children}</ToastProvider>
            </AuthProvider>
          </SettingsProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}