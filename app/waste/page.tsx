'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import Section from '@/components/ui/Section';
import EmptyState from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Tag from '@/components/ui/Tag';
import { api } from '@/lib/api';
import { toast } from '@/store/toast';
import { formatCurrency, formatRelativeTime } from '@/lib/format';
import type { Product, StockMovement, Warehouse } from '@/types/api';

const COMMON_REASONS = ['SKT geçti', 'Bozuldu', 'Düştü', 'Hazırlık fire', 'Müşteri iadesi'];

export default function WastePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [recent, setRecent] = useState<StockMovement[] | null>(null);
  const [form, setForm] = useState({ product_id: '', warehouse_id: '', quantity: 1, note: '' });
  const [saving, setSaving] = useState(false);

  async function reloadRecent() {
    try {
      const list = await api.get<StockMovement[]>('/inventory/movements?limit=200');
      setRecent(list.filter((m) => m.reference === 'WASTE').slice(0, 30));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Yüklenemedi');
    }
  }

  useEffect(() => {
    Promise.all([
      api.get<Product[]>('/products/?limit=200'),
      api.get<Warehouse[]>('/warehouses/'),
    ])
      .then(([p, w]) => {
        setProducts(p);
        setWarehouses(w);
        if (p[0]) setForm((f) => ({ ...f, product_id: String(p[0].id) }));
        if (w[0]) setForm((f) => ({ ...f, warehouse_id: String(w[0].id) }));
      })
      .catch((e: Error) => toast.error(e.message));
    reloadRecent();
  }, []);

  const productMap = new Map(products.map((p) => [p.id, p]));
  const warehouseMap = new Map(warehouses.map((w) => [w.id, w]));

  const todayValue = useMemo(() => {
    if (!recent) return 0;
    const today = new Date().toDateString();
    return recent
      .filter((m) => new Date(m.created_at).toDateString() === today)
      .reduce((sum, m) => {
        const p = productMap.get(m.product_id);
        return sum + (p ? Math.abs(m.quantity) * Number(p.cost_price) : 0);
      }, 0);
  }, [recent, productMap]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/inventory/waste', {
        product_id: Number(form.product_id),
        warehouse_id: Number(form.warehouse_id),
        type: 'out',
        quantity: Number(form.quantity),
        note: form.note || 'Zayiat',
      });
      toast.success('Zayiat kaydedildi');
      setForm((f) => ({ ...f, quantity: 1, note: '' }));
      reloadRecent();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Kayıt başarısız');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Zayiat / Fire"
        subtitle="Bozulan, dökülen, SKT geçen malzemeleri stoktan düş"
        meta={
          todayValue > 0 ? (
            <Tag tone="amber">Bugünkü zayiat değeri: {formatCurrency(todayValue)}</Tag>
          ) : (
            <Tag tone="green">Bugün zayiat yok 👌</Tag>
          )
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Section title="Yeni Zayiat" description="Hızlı kayıt formu">
          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <label className="label">Malzeme</label>
              <select className="input" required value={form.product_id}
                onChange={(e) => setForm({ ...form, product_id: e.target.value })}>
                {products.map((p) => <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Şube</label>
              <select className="input" required value={form.warehouse_id}
                onChange={(e) => setForm({ ...form, warehouse_id: e.target.value })}>
                {warehouses.map((w) => <option key={w.id} value={w.id}>{w.code} — {w.name}</option>)}
              </select>
            </div>
            <Input label="Miktar" type="number" inputMode="numeric" min={1} required
              value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
            <div>
              <label className="label">Sebep / Not</label>
              <input
                className="input"
                placeholder="Örn: SKT geçti, müşteri iadesi…"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {COMMON_REASONS.map((r) => (
                  <button
                    key={r} type="button"
                    onClick={() => setForm({ ...form, note: r })}
                    className="text-[11px] px-2 py-1 rounded-full bg-ink-50 hover:bg-ink-100 text-ink-700 transition"
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <Button type="submit" variant="danger" fullWidth loading={saving}>
              Zayiat olarak düş
            </Button>
          </form>
        </Section>

        <Section title="Son Zayiat Kayıtları" description="En son 30 kayıt">
          {recent === null ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-12" />)}
            </div>
          ) : recent.length === 0 ? (
            <EmptyState icon="✨" title="Zayiat kaydı yok" description="Harika — hiç fire vermemişsiniz!" />
          ) : (
            <div className="space-y-2">
              {recent.map((m) => {
                const p = productMap.get(m.product_id);
                const wh = warehouseMap.get(m.warehouse_id);
                const value = p ? Math.abs(m.quantity) * Number(p.cost_price) : 0;
                return (
                  <div key={m.id} className="flex items-center gap-3 py-2 border-b border-ink-100 last:border-0">
                    <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">🗑️</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-ink-900 truncate">{p?.name ?? `#${m.product_id}`}</div>
                      <div className="text-xs text-ink-500 truncate">
                        {wh?.code ?? '?'} · {formatRelativeTime(m.created_at)}
                        {m.note && ` · ${m.note}`}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-semibold text-red-600 tabular-nums">{m.quantity}</div>
                      <div className="text-[11px] text-ink-500 tabular-nums">{formatCurrency(value)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Section>
      </div>
    </>
  );
}
