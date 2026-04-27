import './globals.css';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import AuthGate from '@/components/AuthGate';
import AppShell from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'Stok Yönetim Sistemi',
  description: 'Çoklu depolu, rol tabanlı stok ve envanter yönetimi',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr">
      <body className="bg-slate-50">
        <AuthGate>
          <AppShell>{children}</AppShell>
        </AuthGate>
      </body>
    </html>
  );
}
