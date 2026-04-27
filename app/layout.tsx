import './globals.css';
import type { Metadata, Viewport } from 'next';
import { ReactNode } from 'react';
import AuthGate from '@/components/AuthGate';
import AppShell from '@/components/AppShell';
import Toaster from '@/components/Toaster';

export const metadata: Metadata = {
  title: {
    default: 'Stok — Burger Franchise',
    template: '%s · Stok',
  },
  description: 'Çoklu şubeli burger franchise envanter ve satış sistemi',
  applicationName: 'Stok',
  authors: [{ name: 'Stok' }],
  keywords: ['stok', 'envanter', 'şube', 'burger', 'franchise', 'POS'],
  robots: { index: false, follow: false },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Stok',
  },
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
