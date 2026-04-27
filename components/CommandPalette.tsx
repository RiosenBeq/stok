'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import type { MenuItem, ProductWithStock, Warehouse } from '@/types/api';
import { NAV } from './Sidebar';

interface Hit {
  id: string;
  label: string;
  hint?: string;
  href: string;
  icon: string;
}

interface CacheData {
  products: ProductWithStock[];
  menuItems: MenuItem[];
  warehouses: Warehouse[];
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [data, setData] = useState<CacheData | null>(null);
  const [active, setActive] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const accessToken = useAuthStore((s) => s.accessToken);

  // Global Cmd+K / Ctrl+K hotkey
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Lazy-load data on first open (and only when authed)
  useEffect(() => {
    if (!open || data || !accessToken) return;
    Promise.all([
      api.get<ProductWithStock[]>('/products/?limit=200').catch(() => [] as ProductWithStock[]),
      api.get<MenuItem[]>('/menu-items/').catch(() => [] as MenuItem[]),
      api.get<Warehouse[]>('/warehouses/').catch(() => [] as Warehouse[]),
    ]).then(([p, m, w]) => setData({ products: p, menuItems: m, warehouses: w }));
  }, [open, data, accessToken]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
    else setQ('');
  }, [open]);

  const hits: Hit[] = useMemo(() => {
    const term = q.trim().toLowerCase();
    const out: Hit[] = [];
    // Pages first — always visible
    NAV.forEach((n) => {
      if (!term || n.label.toLowerCase().includes(term)) {
        out.push({ id: `nav-${n.href}`, label: n.label, href: n.href, icon: n.icon });
      }
    });
    if (!data) return out.slice(0, 12);
    if (term) {
      data.products
        .filter((p) => p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term))
        .slice(0, 6)
        .forEach((p) => {
          out.push({
            id: `p-${p.id}`,
            label: p.name,
            hint: `Malzeme · ${p.sku} · ${p.on_hand} adet`,
            href: '/products',
            icon: '📦',
          });
        });
      data.menuItems
        .filter((m) => m.name.toLowerCase().includes(term) || m.sku.toLowerCase().includes(term))
        .slice(0, 6)
        .forEach((m) => {
          out.push({
            id: `m-${m.id}`,
            label: m.name,
            hint: `Menü · ${m.sku} · ${Number(m.price).toFixed(2)} ₺`,
            href: '/menu',
            icon: '🍔',
          });
        });
      data.warehouses
        .filter((w) => w.name.toLowerCase().includes(term) || w.code.toLowerCase().includes(term))
        .slice(0, 4)
        .forEach((w) => {
          out.push({
            id: `w-${w.id}`,
            label: w.name,
            hint: `Şube · ${w.code}`,
            href: '/warehouses',
            icon: '🏪',
          });
        });
    }
    return out.slice(0, 18);
  }, [q, data]);

  useEffect(() => {
    setActive(0);
  }, [q, open]);

  function go(hit: Hit) {
    setOpen(false);
    router.push(hit.href);
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, hits.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const hit = hits[active];
      if (hit) go(hit);
    }
  }

  if (!accessToken) return null;

  return (
    <>
      {/* Trigger button on top bar */}
      <button
        onClick={() => setOpen(true)}
        className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-md
                   bg-slate-100 hover:bg-slate-200 text-sm text-slate-600 transition"
        aria-label="Hızlı arama"
      >
        <span>🔍</span>
        <span>Ara…</span>
        <kbd className="ml-2 text-xs bg-white px-1.5 py-0.5 rounded border">⌘K</kbd>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] bg-slate-900/40 flex items-start justify-center p-4 pt-[12vh]"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-xl bg-white rounded-lg shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b px-4 py-3 flex items-center gap-3">
              <span className="text-slate-400">🔍</span>
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={onKey}
                placeholder="Sayfa, malzeme, menü veya şube ara…"
                className="flex-1 outline-none text-sm bg-transparent"
              />
              <kbd className="text-xs bg-slate-100 px-1.5 py-0.5 rounded border text-slate-500">
                ESC
              </kbd>
            </div>
            <div className="max-h-[60vh] overflow-y-auto py-1">
              {hits.length === 0 ? (
                <div className="text-center text-slate-500 py-6 text-sm">Sonuç yok.</div>
              ) : (
                hits.map((h, i) => (
                  <button
                    key={h.id}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(h)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm ${
                      i === active ? 'bg-brand-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-lg">{h.icon}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block font-medium text-slate-900 truncate">{h.label}</span>
                      {h.hint && <span className="block text-xs text-slate-500 truncate">{h.hint}</span>}
                    </span>
                    <span className="text-slate-300">↵</span>
                  </button>
                ))
              )}
            </div>
            <div className="border-t px-4 py-2 text-xs text-slate-500 flex items-center justify-between bg-slate-50">
              <span>↑↓ ile gez</span>
              <span>↵ ile aç</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
