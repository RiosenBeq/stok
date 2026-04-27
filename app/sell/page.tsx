'use client';

import { useEffect, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import { api } from '@/lib/api';
import { toast } from '@/store/toast';
import type { MenuItem, Warehouse } from '@/types/api';

export default function SellPage() {
  const [items, setItems] = useState<MenuItem[] | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseId, setWarehouseId] = useState<string>('');
  const [busy, setBusy] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<MenuItem[]>('/menu-items/'),
      api.get<Warehouse[]>('/warehouses/'),
    ])
      .then(([m, w]) => {
        setItems(m.filter((mi) => mi.is_active));
        setWarehouses(w.filter((wh) => wh.is_active));
        if (w[0]) setWarehouseId(String(w[0].id));
      })
      .catch((e: Error) => toast.error(e.message));
  }, []);

  async function sell(mi: MenuItem) {
    if (!warehouseId) {
      toast.error('Önce şube seçin');
      return;
    }
    setBusy(mi.id);
    try {
      await api.post(`/menu-items/${mi.id}/sell`, {
        warehouse_id: Number(warehouseId),
        quantity: 1,
      });
      toast.success(`${mi.name} satıldı`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Satış başarısız');
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Hızlı Satış"
        subtitle="Menü kalemine bir kez dokunun, reçetedeki tüm malzemeler stoktan otomatik düşülür"
      />

      <div className="card mb-4 flex items-center gap-3">
        <label className="text-sm font-medium text-slate-700">Şube:</label>
        <select
          className="input flex-1 max-w-xs"
          value={warehouseId}
          onChange={(e) => setWarehouseId(e.target.value)}
        >
          {warehouses.length === 0 && <option value="">Aktif şube yok</option>}
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>
              {w.code} — {w.name}
            </option>
          ))}
        </select>
      </div>

      {items === null ? (
        <div className="text-center text-slate-400 py-10">Yükleniyor…</div>
      ) : items.length === 0 ? (
        <div className="card text-center text-slate-500 py-10">
          Aktif menü kalemi yok.{' '}
          <a href="/menu" className="text-brand-700 hover:underline">
            Menü &amp; Reçete sayfasından
          </a>{' '}
          ekleyin.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map((mi) => (
            <button
              key={mi.id}
              type="button"
              disabled={busy === mi.id}
              onClick={() => sell(mi)}
              className="card text-left hover:ring-2 hover:ring-brand-500 active:scale-95 transition disabled:opacity-50"
            >
              <div className="text-3xl mb-2">🍔</div>
              <div className="font-semibold text-slate-900 leading-tight">{mi.name}</div>
              <div className="text-xs text-slate-500 mt-0.5">{mi.sku}</div>
              <div className="mt-3 text-lg font-bold text-brand-700">
                {Number(mi.price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
              </div>
              <div className="mt-2 text-xs text-slate-500">
                {mi.recipe.length} malzeme · {busy === mi.id ? 'Satılıyor…' : 'Sat'}
              </div>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
