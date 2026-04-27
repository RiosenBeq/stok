'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export const NAV: Array<{ href: string; label: string; icon: string; primary?: boolean; group?: string }> = [
  { href: '/',            label: 'Pano',           icon: '📊', primary: true,  group: 'Genel' },
  { href: '/sell',        label: 'Hızlı Satış',    icon: '🍔', primary: true,  group: 'Operasyon' },
  { href: '/sales',       label: 'Satış Geçmişi',  icon: '🧾',                 group: 'Operasyon' },
  { href: '/menu',        label: 'Menü & Reçete',  icon: '📖',                 group: 'Operasyon' },
  { href: '/products',    label: 'Stok / Malzeme', icon: '📦', primary: true,  group: 'Stok' },
  { href: '/movements',   label: 'Hareketler',     icon: '🔄', primary: true,  group: 'Stok' },
  { href: '/waste',       label: 'Zayiat',         icon: '🗑️',                 group: 'Stok' },
  { href: '/warehouses',  label: 'Şubeler',        icon: '🏪', primary: true,  group: 'Yönetim' },
  { href: '/suppliers',   label: 'Tedarikçi',      icon: '🤝',                 group: 'Yönetim' },
  { href: '/categories',  label: 'Kategori',       icon: '🗂️',                 group: 'Yönetim' },
  { href: '/profile',     label: 'Profil',         icon: '👤',                 group: 'Hesap' },
];

const GROUPS = ['Genel', 'Operasyon', 'Stok', 'Yönetim', 'Hesap'];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const initials = (user?.full_name ?? '')
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <aside className="hidden md:flex w-64 flex-col flex-shrink-0 bg-ink-900 text-ink-100">
      <div className="px-5 py-5 border-b border-ink-800/80">
        <div className="text-xl font-semibold tracking-tight flex items-center gap-2">
          <span className="text-2xl">🍔</span>
          <span>Stok</span>
          <span className="ml-auto kbd !bg-ink-800 !border-ink-700 !text-ink-300">v2</span>
        </div>
        <p className="mt-1 text-[11px] text-ink-400">Burger Franchise Konsolu</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {GROUPS.map((g) => (
          <div key={g}>
            <div className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-500">
              {g}
            </div>
            <div className="space-y-0.5">
              {NAV.filter((n) => n.group === g).map((n) => {
                const active = n.href === '/' ? pathname === '/' : pathname.startsWith(n.href);
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    className={`group flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-all
                                ${active
                                  ? 'bg-brand-600 text-white shadow-glow'
                                  : 'text-ink-300 hover:bg-ink-800 hover:text-white'}`}
                  >
                    <span className="text-base">{n.icon}</span>
                    <span className="flex-1">{n.label}</span>
                    {active && <span className="text-[10px] opacity-70">●</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-3 py-3 border-t border-ink-800/80">
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="w-9 h-9 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
            {initials || '?'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium truncate">{user?.full_name ?? '—'}</div>
            <div className="text-[11px] text-ink-400 capitalize truncate">{user?.role ?? ''}</div>
          </div>
        </div>
        <button
          onClick={logout}
          className="mt-2 w-full text-left px-3 py-2 text-xs text-ink-300 hover:bg-ink-800 hover:text-white rounded-md transition-colors"
        >
          → Çıkış yap
        </button>
      </div>
    </aside>
  );
}
