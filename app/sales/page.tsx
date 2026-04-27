'use client';

import { useEffect, useMemo, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import { RowCard } from '@/components/ResponsiveCard';
import { api } from '@/lib/api';
import { toast } from '@/store/toast';
import type { Sale, Warehouse } from '@/types/api';

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[] | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseId, setWarehouseId] = useState<string>('');

  useEffect(() => {
    api.get<Warehouse[]>('/warehouses/').then(setWarehouses).catch(() => {});
    reload('');
  }, []);

  async function reload(wid: string) {
    try {
      const params = new URLSearchParams();
      if (wid) params.set('warehouse_id', wid);
      params.set('limit', '100');
      setSales(await api.get<Sale[]>(`/sales/?${params.toString()}`));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Yüklenemedi');
    }
  }

  function onWarehouseChange(value: string) {
    setWarehouseId(value);
    reload(value);
  }

  const totals = useMemo(() => {
    const list = sales ?? [];
    return {
      count: list.length,
      revenue: list.reduce((s, x) => s + Number(x.total), 0),
      cost: list.reduce((s, x) => s + Number(x.cost), 0),
    };
  }, [sales]);

  return (
    <>
      <PageHeader
        title="Satış Geçmişi"
        subtitle="Tüm POS işlemlerinin defteri"
        actions={
          <select
            className="input max-w-[200px]"
            value={warehouseId}
            onChange={(e) => onWarehouseChange(e.target.value)}
          >
            <option value="">Tüm şubeler</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.code} — {w.name}
              </option>
            ))}
          </select>
        }
      />

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="card text-center">
          <div className="text-xs text-slate-500">Sipariş</div>
          <div className="text-2xl font-bold mt-1">{totals.count}</div>
        </div>
        <div className="card text-center">
          <div className="text-xs text-slate-500">Ciro</div>
          <div className="text-2xl font-bold mt-1 text-brand-700">
            {totals.revenue.toFixed(2)} ₺
          </div>
        </div>
        <div className="card text-center">
          <div className="text-xs text-slate-500">Marj</div>
          <div className="text-2xl font-bold mt-1 text-green-700">
            {(totals.revenue - totals.cost).toFixed(2)} ₺
          </div>
        </div>
      </div>

      {sales === null ? (
        <div className="text-center text-slate-400 py-10">Yükleniyor…</div>
      ) : sales.length === 0 ? (
        <div className="card text-center text-slate-500 py-10">
          Henüz satış yok. <a href="/sell" className="text-brand-700 hover:underline">İlk satışınızı /sell'den yapın →</a>
        </div>
      ) : (
        <div className="space-y-2">
          {sales.map((s) => (
            <RowCard
              key={s.id}
              title={
                <span className="flex items-center gap-2">
                  <span className="font-mono text-xs text-slate-500">{s.code}</span>
                  <span>{s.warehouse_code ?? `#${s.warehouse_id}`}</span>
                </span>
              }
              subtitle={
                <>
                  {new Date(s.created_at).toLocaleString('tr-TR')} ·{' '}
                  {s.items.length} kalem ·{' '}
                  {s.items.reduce((sum, it) => sum + it.quantity, 0)} adet
                </>
              }
              meta={
                <div className="flex flex-wrap gap-1 mt-1">
                  {s.items.map((it) => (
                    <span
                      key={it.id}
                      className="badge-slate text-[11px]"
                      title={`${it.unit_price} × ${it.quantity}`}
                    >
                      {it.menu_item_name ?? `#${it.menu_item_id}`} ×{it.quantity}
                    </span>
                  ))}
                </div>
              }
              badges={
                <div className="text-right">
                  <div className="text-lg font-bold text-brand-700">
                    {Number(s.total).toFixed(2)} ₺
                  </div>
                  <div className="text-xs text-green-700">
                    +{(Number(s.total) - Number(s.cost)).toFixed(2)} marj
                  </div>
                </div>
              }
            />
          ))}
        </div>
      )}
    </>
  );
}
