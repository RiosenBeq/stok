'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export const NAV: Array<{ href: string; label: string; icon: string; primary?: boolean }> = [
  { href: '/', label: 'Pano', icon: '📊', primary: true },
  { href: '/sell', label: 'Hızlı Satış', icon: '🍔', primary: true },
  { href: '/menu', label: 'Menü & Reçete', icon: '📖' },
  { href: '/products', label: 'Stok / Malzeme', icon: '📦', primary: true },
  { href: '/movements', label: 'Hareketler', icon: '🔄', primary: true },
  { href: '/waste', label: 'Zayiat', icon: '🗑️' },
  { href: '/warehouses', label: 'Şubeler', icon: '🏪', primary: true },
  { href: '/suppliers', label: 'Tedarikçi', icon: '🤝' },
  { href: '/categories', label: 'Kategori', icon: '🗂️' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="hidden md:flex w-60 bg-slate-900 text-slate-100 flex-col flex-shrink-0">
      <div className="px-6 py-5 text-xl font-bold tracking-tight border-b border-slate-800">
        🍔 Stok
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map((n) => {
          const active = n.href === '/' ? pathname === '/' : pathname.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
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
        <button onClick={logout} className="mt-2 text-brand-100 hover:text-white">
          Çıkış yap
        </button>
      </div>
    </aside>
  );
}
