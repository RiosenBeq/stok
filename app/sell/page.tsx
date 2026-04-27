'use client';

import { useEffect, useMemo, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import { api } from '@/lib/api';
import { toast } from '@/store/toast';
import { cartCount, cartTotal, useCartStore } from '@/store/cart';
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
    if (!search.trim()) return items;
    const s = search.toLowerCase();
    return items.filter(
      (mi) => mi.name.toLowerCase().includes(s) || mi.sku.toLowerCase().includes(s)
    );
  }, [items, search]);

  async function checkout() {
    if (!warehouseId) {
      toast.error('Önce şube seçin');
      return;
    }
    if (lines.length === 0) {
      toast.error('Sepet boş');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/sales/checkout', {
        warehouse_id: warehouseId,
        items: lines.map((l) => ({ menu_item_id: l.menu_item_id, quantity: l.quantity })),
      });
      toast.success(`Sipariş onaylandı: ${total.toFixed(2)} ₺`);
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
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold">🧺 Sepet</h2>
        {lines.length > 0 && (
          <button onClick={clear} className="text-xs text-red-600 hover:underline">
            Temizle
          </button>
        )}
      </div>
      {lines.length === 0 ? (
        <p className="text-sm text-slate-500">Sepet boş. Soldan menü kaleminize tıklayın.</p>
      ) : (
        <div className="space-y-2 max-h-[55vh] overflow-y-auto">
          {lines.map((l) => (
            <div key={l.menu_item_id} className="flex items-center gap-2 py-1">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{l.name}</div>
                <div className="text-xs text-slate-500">
                  {l.unit_price.toFixed(2)} ₺ × {l.quantity}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setQty(l.menu_item_id, l.quantity - 1)}
                  className="w-8 h-8 rounded border border-slate-300 hover:bg-slate-50"
                  aria-label="Azalt"
                >
                  −
                </button>
                <span className="w-7 text-center text-sm font-semibold">{l.quantity}</span>
                <button
                  onClick={() => setQty(l.menu_item_id, l.quantity + 1)}
                  className="w-8 h-8 rounded border border-slate-300 hover:bg-slate-50"
                  aria-label="Artır"
                >
                  +
                </button>
                <button
                  onClick={() => remove(l.menu_item_id)}
                  className="ml-1 text-red-600 text-lg w-6"
                  aria-label="Sil"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="border-t mt-3 pt-3 flex items-center justify-between">
        <span className="text-sm text-slate-600">Toplam</span>
        <span className="text-2xl font-bold text-brand-700">{total.toFixed(2)} ₺</span>
      </div>
      <button
        className="btn-primary w-full mt-3 py-3 text-base"
        disabled={submitting || lines.length === 0 || !warehouseId}
        onClick={checkout}
      >
        {submitting ? 'Onaylanıyor…' : 'Siparişi Onayla'}
      </button>
    </div>
  );

  return (
    <>
      <PageHeader
        title="Hızlı Satış"
        subtitle="Sepete ekleyin, tek dokunuşla bitirin — reçete malzemeleri otomatik düşer"
        actions={
          <select
            className="input max-w-[180px]"
            value={warehouseId ?? ''}
            onChange={(e) => setWarehouse(Number(e.target.value) || null)}
          >
            {warehouses.length === 0 && <option value="">Şube yok</option>}
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.code}
              </option>
            ))}
          </select>
        }
      />

      <div className="card mb-3 flex items-center gap-2">
        <span className="text-slate-400">🔍</span>
        <input
          className="flex-1 outline-none bg-transparent text-sm"
          placeholder="Menüde ara…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <div>
          {items === null ? (
            <div className="text-center text-slate-400 py-10">Yükleniyor…</div>
          ) : filtered.length === 0 ? (
            <div className="card text-center text-slate-500 py-10">
              {search ? 'Eşleşen menü kalemi yok.' : (
                <>
                  Aktif menü kalemi yok.{' '}
                  <a href="/menu" className="text-brand-700 hover:underline">
                    Menü &amp; Reçete sayfasından
                  </a>{' '}
                  ekleyin.
                </>
              )}
            </div>
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
                    className="card text-left hover:ring-2 hover:ring-brand-500 active:scale-[0.98] transition relative"
                  >
                    {inCart && (
                      <span className="absolute top-2 right-2 bg-brand-600 text-white text-xs rounded-full w-6 h-6 inline-flex items-center justify-center font-bold">
                        {inCart.quantity}
                      </span>
                    )}
                    <div className="text-3xl mb-1">🍔</div>
                    <div className="font-semibold leading-tight">{mi.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{mi.sku}</div>
                    <div className="mt-2 text-lg font-bold text-brand-700">
                      {Number(mi.price).toFixed(2)} ₺
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Desktop cart side panel */}
        <div className="hidden lg:block">{cartPanel}</div>
      </div>

      {/* Mobile floating cart button */}
      {!showCart && lines.length > 0 && (
        <button
          onClick={() => setShowCart(true)}
          className="lg:hidden fixed bottom-20 right-4 z-30 bg-brand-600 text-white rounded-full px-5 py-3 shadow-lg flex items-center gap-2 active:scale-95"
        >
          <span className="text-lg">🧺</span>
          <span className="font-semibold">{count}</span>
          <span className="text-sm">·</span>
          <span className="font-semibold">{total.toFixed(2)} ₺</span>
        </button>
      )}

      {/* Mobile cart sheet */}
      {showCart && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-slate-900/40 flex items-end"
          onClick={() => setShowCart(false)}
        >
          <div
            className="w-full bg-white rounded-t-2xl p-4 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end -mt-2 mb-2">
              <button onClick={() => setShowCart(false)} className="text-2xl text-slate-400">
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
