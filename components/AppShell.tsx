'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === '/login') return <>{children}</>;
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 p-4 md:p-6 max-w-7xl pt-16 md:pt-6">{children}</main>
    </div>
  );
}
