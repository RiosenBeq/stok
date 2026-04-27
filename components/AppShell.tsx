'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === '/login') return <>{children}</>;
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <MobileNav />
      <main className="flex-1 min-w-0 p-4 md:p-6 max-w-7xl pt-16 md:pt-6 pb-24 md:pb-6">
        {children}
      </main>
    </div>
  );
}
