'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import CommandPalette from './CommandPalette';

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === '/login') return <>{children}</>;
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <MobileNav />
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="hidden md:flex sticky top-0 z-20 h-14 bg-white/80 backdrop-blur-md border-b border-ink-200/80 px-6 items-center justify-end gap-3">
          <CommandPalette />
        </header>
        <main className="flex-1 p-4 md:p-8 max-w-7xl pt-16 md:pt-8 pb-24 md:pb-8 page-fade">
          {children}
        </main>
      </div>
    </div>
  );
}
