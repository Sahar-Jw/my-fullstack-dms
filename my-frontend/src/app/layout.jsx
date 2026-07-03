import './globals.css';
import { AppProvider } from '../context/AppContext';
import Toast from '../components/ui/Toast';

export const metadata = {
  title: 'نُسخة — نظام إدارة الوثائق',
  description: 'نظام إدارة الوثائق الرسمية للمؤسسة',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Markazi+Text:wght@500;600;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AppProvider>
          {children}
          <Toast />
        </AppProvider>
      </body>
    </html>
  );
}
