'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

const NAV: Array<{ href: string; label: string }> = [
  { href: '/', label: 'Pano' },
  { href: '/products', label: 'Ürünler' },
  { href: '/movements', label: 'Stok Hareketleri' },
  { href: '/warehouses', label: 'Depolar' },
  { href: '/suppliers', label: 'Tedarikçiler' },
  { href: '/categories', label: 'Kategoriler' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="w-60 bg-slate-900 text-slate-100 flex flex-col">
      <div className="px-6 py-5 text-xl font-bold tracking-tight border-b border-slate-800">
        📦 Stok
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map((n) => {
          const active = n.href === '/' ? pathname === '/' : pathname.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`block rounded px-3 py-2 text-sm transition ${
                active ? 'bg-brand-600 text-white' : 'hover:bg-slate-800'
              }`}
            >
              {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-3 border-t border-slate-800 text-xs">
        <div className="font-medium">{user?.full_name ?? '—'}</div>
        <div className="text-slate-400">{user?.role ?? ''}</div>
        <button onClick={logout} className="mt-2 text-brand-100 hover:text-white">
          Çıkış yap
        </button>
      </div>
    </aside>
  );
}
