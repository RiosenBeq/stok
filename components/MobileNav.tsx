'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { NAV } from './Sidebar';

const PRIMARY = NAV.filter((n) => n.primary);
const GROUPS = ['Genel', 'Operasyon', 'Stok', 'Yönetim', 'Hesap'];

export default function MobileNav() {
  const pathname = usePathname();
  const [drawer, setDrawer] = useState(false);
  const { user, logout } = useAuth();

  const initials = (user?.full_name ?? '')
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <>
      {/* Top bar */}
      <header className="md:hidden fixed top-0 inset-x-0 z-30 h-12 bg-ink-900 text-white px-3 flex items-center justify-between shadow">
        <span className="text-base font-semibold flex items-center gap-1.5">
          <span className="text-xl">🍔</span>
          <span>Stok</span>
        </span>
        <button
          type="button"
          onClick={() => setDrawer(true)}
          aria-label="Menü"
          className="w-10 h-10 inline-flex items-center justify-center text-xl active:scale-95 transition"
        >
          ☰
        </button>
      </header>

      {/* Drawer */}
      {drawer && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-slate-900/60 animate-fade-in"
          onClick={() => setDrawer(false)}
        >
          <div
            className="absolute right-0 top-0 h-full w-72 bg-ink-900 text-ink-100 flex flex-col animate-slide-in-right"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-4 border-b border-ink-800/80 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold">
                {initials || '?'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{user?.full_name ?? '—'}</div>
                <div className="text-[11px] text-ink-400 capitalize">{user?.role ?? ''}</div>
              </div>
              <button
                onClick={() => setDrawer(false)}
                aria-label="Kapat"
                className="text-2xl leading-none text-ink-400"
              >
                ×
              </button>
            </div>
            <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
              {GROUPS.map((g) => (
                <div key={g}>
                  <div className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-wider text-ink-500">
                    {g}
                  </div>
                  {NAV.filter((n) => n.group === g).map((n) => (
                    <Link
                      key={n.href}
                      href={n.href}
                      onClick={() => setDrawer(false)}
                      className={`flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm transition-colors
                                  ${isActive(n.href)
                                    ? 'bg-brand-600 text-white'
                                    : 'text-ink-300 hover:bg-ink-800'}`}
                    >
                      <span>{n.icon}</span>
                      <span>{n.label}</span>
                    </Link>
                  ))}
                </div>
              ))}
            </nav>
            <div className="px-4 py-3 border-t border-ink-800/80">
              <button
                onClick={logout}
                className="w-full text-left px-3 py-2 text-xs text-ink-300 hover:bg-ink-800 hover:text-white rounded-md transition-colors"
              >
                → Çıkış yap
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-ink-200 grid grid-cols-5 pb-safe shadow-pop">
        {PRIMARY.slice(0, 5).map((n) => {
          const active = isActive(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`flex flex-col items-center justify-center py-1.5 text-[10px] transition-all relative
                          ${active ? 'text-brand-700' : 'text-ink-500 hover:text-ink-800'}`}
            >
              {active && (
                <span className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-brand-600 rounded-full" />
              )}
              <span className={`text-xl transition-transform ${active ? 'scale-110' : ''}`}>{n.icon}</span>
              <span className="mt-0.5 truncate max-w-[60px]">{n.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
