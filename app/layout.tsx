import './globals.css';
import type { Metadata, Viewport } from 'next';
import { ReactNode } from 'react';
import AuthGate from '@/components/AuthGate';
import AppShell from '@/components/AppShell';
import Toaster from '@/components/Toaster';

export const metadata: Metadata = {
  title: {
    default: 'Stok Yönetim Sistemi',
    template: '%s · Stok',
  },
  description: 'Çoklu depolu, rol tabanlı stok ve envanter yönetimi',
  applicationName: 'Stok',
  authors: [{ name: 'Stok' }],
  keywords: ['stok', 'envanter', 'depo', 'yönetim'],
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: '#1e3a8a',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr">
      <body className="bg-slate-50 antialiased">
        <AuthGate>
          <AppShell>{children}</AppShell>
        </AuthGate>
        <Toaster />
      </body>
    </html>
  );
}
