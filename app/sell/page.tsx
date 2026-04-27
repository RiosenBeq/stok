'use client';

import { useEffect, useMemo, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Tag from '@/components/ui/Tag';
import { api } from '@/lib/api';
import { toast } from '@/store/toast';
import { cartCount, cartTotal, useCartStore } from '@/store/cart';
import { formatCurrency } from '@/lib/format';
import type { MenuItem, Warehouse } from '@/types/api';

export default function SellPage() {
  const [items, setItems] = useState<MenuItem[] | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showCart, setShowCart] = useState(false);

  const { warehouseId, setWarehouse, lines, add, setQty, remove, clear } = useCartStore();

  useEffect(() => {
    Promise.all([
      api.get<MenuItem[]>('/menu-items/'),
      api.get<Warehouse[]>('/warehouses/'),
    ])
      .then(([m, w]) => {
        setItems(m.filter((mi) => mi.is_active));
        const active = w.filter((wh) => wh.is_active);
        setWarehouses(active);
        if (!warehouseId && active[0]) setWarehouse(active[0].id);
      })
      .catch((e: Error) => toast.error(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = useMemo(() => cartTotal(lines), [lines]);
  const count = useMemo(() => cartCount(lines), [lines]);

  const filtered = useMemo(() => {
    if (!items) return [];
    const s = search.trim().toLowerCase();
    if (!s) return items;
    return items.filter(
      (mi) => mi.name.toLowerCase().includes(s) || mi.sku.toLowerCase().includes(s)
    );
  }, [items, search]);

  async function checkout() {
    if (!warehouseId) return toast.error('Önce şube seçin');
    if (lines.length === 0) return toast.error('Sepet boş');
    setSubmitting(true);
    try {
      await api.post('/sales/checkout', {
        warehouse_id: warehouseId,
        items: lines.map((l) => ({ menu_item_id: l.menu_item_id, quantity: l.quantity })),
      });
      toast.success(`Sipariş onaylandı — ${formatCurrency(total)}`);
      clear();
      setShowCart(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Satış başarısız');
    } finally {
      setSubmitting(false);
    }
  }

  const cartPanel = (
    <div className="card sticky top-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🧺</span>
          <h2 className="font-semibold">Sepet</h2>
          {lines.length > 0 && <Tag tone="brand">{count} adet</Tag>}
        </div>
        {lines.length > 0 && (
          <button
            onClick={clear}
            className="text-xs text-red-600 hover:underline"
          >
            Temizle
          </button>
        )}
      </div>

      {lines.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-2 opacity-50">🛒</div>
          <p className="text-sm text-ink-500">Sepet boş.<br />Soldan menü kaleminize tıklayın.</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[50vh] overflow-y-auto -mx-1 px-1">
          {lines.map((l) => (
            <div
              key={l.menu_item_id}
              className="flex items-center gap-2 py-2 border-b border-ink-100 last:border-0 animate-slide-up"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate text-ink-900">{l.name}</div>
                <div className="text-xs text-ink-500 tabular-nums">
                  {formatCurrency(l.unit_price)} × {l.quantity}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setQty(l.menu_item_id, l.quantity - 1)}
                  className="w-8 h-8 rounded-md border border-ink-200 hover:bg-ink-50 active:scale-95 transition"
                  aria-label="Azalt"
                >
                  −
                </button>
                <span className="w-7 text-center text-sm font-semibold tabular-nums">{l.quantity}</span>
                <button
                  onClick={() => setQty(l.menu_item_id, l.quantity + 1)}
                  className="w-8 h-8 rounded-md border border-ink-200 hover:bg-ink-50 active:scale-95 transition"
                  aria-label="Artır"
                >
                  +
                </button>
                <button
                  onClick={() => remove(l.menu_item_id)}
                  className="ml-1 text-ink-400 hover:text-red-600 text-lg w-6"
                  aria-label="Sil"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-ink-100 mt-3 pt-3 space-y-2">
        <div className="flex items-center justify-between text-xs text-ink-500">
          <span>Kalem</span>
          <span className="tabular-nums">{lines.length}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-ink-500">
          <span>Adet</span>
          <span className="tabular-nums">{count}</span>
        </div>
        <div className="flex items-center justify-between border-t border-ink-100 pt-2">
          <span className="text-sm text-ink-700 font-medium">Toplam</span>
          <span className="text-2xl font-bold text-brand-700 tabular-nums">{formatCurrency(total)}</span>
        </div>
      </div>

      <Button
        size="lg"
        fullWidth
        loading={submitting}
        onClick={checkout}
        disabled={lines.length === 0 || !warehouseId}
        className="mt-3"
      >
        Siparişi Onayla
      </Button>
    </div>
  );

  return (
    <>
      <PageHeader
        title="Hızlı Satış"
        subtitle="Sepete ekleyin, tek dokunuşla bitirin"
        actions={
          <select
            className="input max-w-[200px]"
            value={warehouseId ?? ''}
            onChange={(e) => setWarehouse(Number(e.target.value) || null)}
          >
            {warehouses.length === 0 && <option value="">Şube yok</option>}
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                🏪 {w.code} — {w.name}
              </option>
            ))}
          </select>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
        <div>
          <div className="card mb-4">
            <Input
              iconLeft={<span>🔍</span>}
              placeholder="Menüde ara…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {items === null ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card">
                  <div className="skeleton h-8 w-8 mb-2 rounded-full" />
                  <div className="skeleton h-4 w-2/3 mb-2" />
                  <div className="skeleton h-3 w-1/3 mb-3" />
                  <div className="skeleton h-6 w-1/2" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={search ? '🔍' : '📖'}
              title={search ? 'Sonuç yok' : 'Menü kalemi yok'}
              description={
                search
                  ? `"${search}" araması için eşleşme bulunamadı.`
                  : 'Menü & Reçete sayfasından ilk kaleminizi ekleyin.'
              }
              action={
                !search && (
                  <a href="/menu" className="btn-primary">
                    Menü kaleminizi oluşturun →
                  </a>
                )
              }
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filtered.map((mi) => {
                const inCart = lines.find((l) => l.menu_item_id === mi.id);
                return (
                  <button
                    key={mi.id}
                    type="button"
                    onClick={() =>
                      add({
                        menu_item_id: mi.id,
                        sku: mi.sku,
                        name: mi.name,
                        unit_price: Number(mi.price),
                      })
                    }
                    className="card-interactive text-left relative animate-slide-up"
                  >
                    {inCart && (
                      <span className="absolute top-2 right-2 bg-brand-600 text-white text-xs rounded-full w-6 h-6 inline-flex items-center justify-center font-bold animate-pop-in">
                        {inCart.quantity}
                      </span>
                    )}
                    <div className="text-3xl mb-2">🍔</div>
                    <div className="font-semibold leading-tight text-ink-900">{mi.name}</div>
                    <div className="text-xs text-ink-500 mt-0.5 font-mono">{mi.sku}</div>
                    <div className="mt-3 text-lg font-bold text-brand-700 tabular-nums">
                      {formatCurrency(Number(mi.price))}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="hidden lg:block">{cartPanel}</div>
      </div>

      {/* Mobile floating cart button */}
      {!showCart && lines.length > 0 && (
        <button
          onClick={() => setShowCart(true)}
          className="lg:hidden fixed bottom-20 right-4 z-30 bg-brand-600 text-white rounded-full px-5 py-3 shadow-glow flex items-center gap-2 active:scale-95 animate-pop-in"
        >
          <span className="text-lg">🧺</span>
          <span className="font-semibold tabular-nums">{count}</span>
          <span className="opacity-70">·</span>
          <span className="font-semibold tabular-nums">{formatCurrency(total)}</span>
        </button>
      )}

      {/* Mobile cart sheet */}
      {showCart && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-slate-900/40 flex items-end animate-fade-in"
          onClick={() => setShowCart(false)}
        >
          <div
            className="w-full bg-white rounded-t-2xl p-4 max-h-[88vh] overflow-y-auto animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end -mt-1 mb-1">
              <button onClick={() => setShowCart(false)} className="text-2xl text-ink-400">
                ×
              </button>
            </div>
            {cartPanel}
          </div>
        </div>
      )}
    </>
  );
}
