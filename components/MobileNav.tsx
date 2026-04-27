'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { NAV } from './Sidebar';

const PRIMARY = NAV.filter((n) => n.primary);

export default function MobileNav() {
  const pathname = usePathname();
  const [drawer, setDrawer] = useState(false);
  const { user, logout } = useAuth();

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <>
      {/* Top bar (mobile only) */}
      <header className="md:hidden fixed top-0 inset-x-0 z-30 h-12 bg-slate-900 text-white px-3 flex items-center justify-between shadow">
        <span className="text-lg font-semibold flex items-center gap-1">
          <span>🍔</span>
          <span>Stok</span>
        </span>
        <button
          type="button"
          onClick={() => setDrawer(true)}
          aria-label="Menü"
          className="w-10 h-10 inline-flex items-center justify-center text-xl"
        >
          ☰
        </button>
      </header>

      {/* Drawer (full menu, mobile only) */}
      {drawer && (
        <div className="md:hidden fixed inset-0 z-40 bg-slate-900/60" onClick={() => setDrawer(false)}>
          <div
            className="absolute right-0 top-0 h-full w-64 bg-slate-900 text-slate-100 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
              <span className="font-semibold">Menü</span>
              <button
                onClick={() => setDrawer(false)}
                aria-label="Kapat"
                className="text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setDrawer(false)}
                  className={`flex items-center gap-2 rounded px-3 py-3 text-sm transition ${
                    isActive(n.href) ? 'bg-brand-600 text-white' : 'hover:bg-slate-800'
                  }`}
                >
                  <span className="text-lg">{n.icon}</span>
                  <span>{n.label}</span>
                </Link>
              ))}
            </nav>
            <div className="px-4 py-3 border-t border-slate-800 text-xs">
              <div className="font-medium truncate" title={user?.email}>
                {user?.full_name ?? '—'}
              </div>
              <div className="text-slate-400 capitalize">{user?.role ?? ''}</div>
              <button onClick={logout} className="mt-2 text-brand-100 hover:text-white">
                Çıkış yap
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom tab bar (mobile only) — primary destinations only */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 grid grid-cols-5 pb-safe">
        {PRIMARY.slice(0, 5).map((n) => {
          const active = isActive(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`flex flex-col items-center justify-center py-1.5 text-[10px] transition ${
                active ? 'text-brand-700' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span className={`text-xl ${active ? 'scale-110' : ''}`}>{n.icon}</span>
              <span className="mt-0.5">{n.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
