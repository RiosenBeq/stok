'use client';

import { useEffect, useMemo, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import Section from '@/components/ui/Section';
import StatCard from '@/components/ui/StatCard';
import EmptyState from '@/components/ui/EmptyState';
import Tag from '@/components/ui/Tag';
import { api } from '@/lib/api';
import { toast } from '@/store/toast';
import { formatCurrency, formatDateTime, formatRelativeTime } from '@/lib/format';
import type { Sale, Warehouse } from '@/types/api';

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[] | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseId, setWarehouseId] = useState<string>('');
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  useEffect(() => {
    api.get<Warehouse[]>('/warehouses/').then(setWarehouses).catch(() => {});
    reload('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const totals = useMemo(() => {
    const list = sales ?? [];
    return {
      count: list.length,
      revenue: list.reduce((s, x) => s + Number(x.total), 0),
      cost: list.reduce((s, x) => s + Number(x.cost), 0),
      units: list.reduce((s, x) => s + x.items.reduce((u, i) => u + i.quantity, 0), 0),
    };
  }, [sales]);

  function toggle(id: number) {
    setExpanded((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  return (
    <>
      <PageHeader
        title="Satış Geçmişi"
        subtitle="Tüm POS işlemlerinin defteri"
        actions={
          <select
            className="input max-w-[220px]"
            value={warehouseId}
            onChange={(e) => { setWarehouseId(e.target.value); reload(e.target.value); }}
          >
            <option value="">🏪 Tüm şubeler</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>🏪 {w.code} — {w.name}</option>
            ))}
          </select>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <StatCard label="Sipariş" value={totals.count} icon="🧾" />
        <StatCard label="Birim" value={totals.units} icon="📦" />
        <StatCard label="Ciro" value={formatCurrency(totals.revenue)} icon="💰" tone="brand" />
        <StatCard label="Marj" value={formatCurrency(totals.revenue - totals.cost)} icon="📈" tone="success" />
      </div>

      {sales === null ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="card skeleton h-20" />)}
        </div>
      ) : sales.length === 0 ? (
        <EmptyState
          icon="🧾"
          title="Henüz satış yok"
          description="POS sayfasından ilk siparişinizi alın."
          action={<a href="/sell" className="btn-primary">Hızlı Satışa git →</a>}
        />
      ) : (
        <Section title="İşlemler" description={`${sales.length} kayıt`}>
          <div className="space-y-2 -mx-1">
            {sales.map((s) => {
              const open = expanded.has(s.id);
              const margin = Number(s.total) - Number(s.cost);
              return (
                <div key={s.id} className="rounded-lg ring-1 ring-ink-100 bg-white animate-slide-up">
                  <button
                    onClick={() => toggle(s.id)}
                    className="w-full flex items-center justify-between gap-3 p-3 text-left hover:bg-ink-50/50 transition rounded-lg"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center flex-shrink-0 text-lg">
                        🧾
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs text-ink-500">{s.code}</span>
                          <Tag tone="slate">{s.warehouse_code ?? `#${s.warehouse_id}`}</Tag>
                        </div>
                        <div className="text-xs text-ink-500 mt-0.5">
                          {formatDateTime(s.created_at)} · {formatRelativeTime(s.created_at)} · {s.items.length} kalem
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-lg font-bold text-brand-700 tabular-nums">{formatCurrency(Number(s.total))}</div>
                      <div className="text-xs text-green-700 tabular-nums">+{formatCurrency(margin)}</div>
                    </div>
                    <span className={`text-ink-400 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`}>▾</span>
                  </button>
                  {open && (
                    <div className="border-t border-ink-100 p-3 bg-ink-50/40 animate-fade-in">
                      <div className="space-y-1.5">
                        {s.items.map((it) => (
                          <div key={it.id} className="flex items-center justify-between text-sm gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span>🍔</span>
                              <span className="font-medium text-ink-900 truncate">{it.menu_item_name ?? `#${it.menu_item_id}`}</span>
                              <span className="text-xs text-ink-500 font-mono">{it.menu_item_sku}</span>
                            </div>
                            <div className="text-right tabular-nums text-ink-700 flex-shrink-0">
                              {Number(it.unit_price).toFixed(2)} ₺ × <strong>{it.quantity}</strong>
                              <span className="text-ink-400 mx-1">=</span>
                              <span className="font-semibold">{Number(it.line_total).toFixed(2)} ₺</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      {s.note && <p className="text-xs text-ink-500 mt-3 italic">Not: {s.note}</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Section>
      )}
    </>
  );
}
