'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

const NAV: Array<{ href: string; label: string; icon: string }> = [
  { href: '/', label: 'Pano', icon: '📊' },
  { href: '/products', label: 'Ürünler', icon: '📦' },
  { href: '/movements', label: 'Stok Hareketleri', icon: '🔄' },
  { href: '/warehouses', label: 'Depolar', icon: '🏭' },
  { href: '/suppliers', label: 'Tedarikçiler', icon: '🤝' },
  { href: '/categories', label: 'Kategoriler', icon: '🗂️' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="md:hidden fixed top-3 left-3 z-30 inline-flex items-center justify-center w-10 h-10 rounded-md bg-slate-900 text-white shadow"
        onClick={() => setOpen(true)}
        aria-label="Menüyü aç"
      >
        ☰
      </button>

      {open && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-slate-900/50"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-60 bg-slate-900 text-slate-100 flex flex-col transition-transform md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-6 py-5 text-xl font-bold tracking-tight border-b border-slate-800 flex items-center justify-between">
          <span>📦 Stok</span>
          <button
            type="button"
            className="md:hidden text-slate-400 hover:text-white text-2xl leading-none"
            onClick={() => setOpen(false)}
            aria-label="Menüyü kapat"
          >
            ×
          </button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map((n) => {
            const active = n.href === '/' ? pathname === '/' : pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2 rounded px-3 py-2 text-sm transition ${
                  active ? 'bg-brand-600 text-white' : 'hover:bg-slate-800'
                }`}
              >
                <span>{n.icon}</span>
                <span>{n.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="px-4 py-3 border-t border-slate-800 text-xs">
          <div className="font-medium truncate" title={user?.email}>
            {user?.full_name ?? '—'}
          </div>
          <div className="text-slate-400 capitalize">{user?.role ?? ''}</div>
          <button
            onClick={logout}
            className="mt-2 text-brand-100 hover:text-white"
          >
            Çıkış yap
          </button>
        </div>
      </aside>
    </>
  );
}
