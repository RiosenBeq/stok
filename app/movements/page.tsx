'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import Modal from '@/components/Modal';
import EmptyState from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import FilterChip from '@/components/ui/FilterChip';
import Tag from '@/components/ui/Tag';
import { api } from '@/lib/api';
import { toast } from '@/store/toast';
import { formatDateTime, formatRelativeTime } from '@/lib/format';
import type { MovementType, Product, StockMovement, Warehouse } from '@/types/api';

const TYPE_TONE: Record<string, 'green' | 'red' | 'slate' | 'amber'> = {
  in: 'green',
  out: 'red',
  transfer: 'slate',
  adjustment: 'amber',
};

const TYPE_LABEL: Record<string, string> = {
  in: 'Giriş',
  out: 'Çıkış',
  transfer: 'Transfer',
  adjustment: 'Düzeltme',
};

type Filter = 'all' | MovementType;

export default function MovementsPage() {
  const [movements, setMovements] = useState<StockMovement[] | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    product_id: '',
    warehouse_id: '',
    type: 'in' as 'in' | 'out',
    quantity: 1,
    reference: '',
    note: '',
  });

  async function reload() {
    try {
      setMovements(await api.get<StockMovement[]>('/inventory/movements?limit=200'));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Yüklenemedi');
    }
  }

  useEffect(() => {
    Promise.all([
      api.get<Product[]>('/products/?limit=200'),
      api.get<Warehouse[]>('/warehouses/'),
    ]).then(([p, w]) => {
      setProducts(p);
      setWarehouses(w);
      if (p[0]) setForm((f) => ({ ...f, product_id: String(p[0].id) }));
      if (w[0]) setForm((f) => ({ ...f, warehouse_id: String(w[0].id) }));
    });
    reload();
  }, []);

  const filtered = useMemo(() => {
    if (!movements) return null;
    if (filter === 'all') return movements;
    return movements.filter((m) => m.type === filter);
  }, [movements, filter]);

  const counts = useMemo(() => {
    const list = movements ?? [];
    return {
      all: list.length,
      in: list.filter((m) => m.type === 'in').length,
      out: list.filter((m) => m.type === 'out').length,
      transfer: list.filter((m) => m.type === 'transfer').length,
      adjustment: list.filter((m) => m.type === 'adjustment').length,
    };
  }, [movements]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/inventory/movements', {
        product_id: Number(form.product_id),
        warehouse_id: Number(form.warehouse_id),
        type: form.type,
        quantity: Number(form.quantity),
        reference: form.reference || null,
        note: form.note || null,
      });
      toast.success(form.type === 'in' ? 'Stok girişi kaydedildi' : 'Stok çıkışı kaydedildi');
      setOpen(false);
      reload();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Hata');
    } finally {
      setSaving(false);
    }
  }

  const productMap = new Map(products.map((p) => [p.id, p]));
  const warehouseMap = new Map(warehouses.map((w) => [w.id, w]));

  return (
    <>
      <PageHeader
        title="Stok Hareketleri"
        subtitle="Giriş, çıkış, transfer ve düzeltme defteri"
        actions={<Button onClick={() => setOpen(true)} iconLeft={<span>+</span>}>Yeni Hareket</Button>}
      />

      <div className="card mb-4">
        <div className="flex flex-wrap gap-2">
          <FilterChip active={filter === 'all'} onClick={() => setFilter('all')} count={counts.all}>Tümü</FilterChip>
          <FilterChip active={filter === 'in'} onClick={() => setFilter('in')} count={counts.in}>📥 Giriş</FilterChip>
          <FilterChip active={filter === 'out'} onClick={() => setFilter('out')} count={counts.out}>📤 Çıkış</FilterChip>
          <FilterChip active={filter === 'transfer'} onClick={() => setFilter('transfer')} count={counts.transfer}>🔄 Transfer</FilterChip>
          <FilterChip active={filter === 'adjustment'} onClick={() => setFilter('adjustment')} count={counts.adjustment}>⚙️ Düzeltme</FilterChip>
        </div>
      </div>

      {/* Mobile timeline */}
      <div className="md:hidden space-y-2">
        {filtered === null ? (
          Array.from({ length: 5 }).map((_, i) => <div key={i} className="card skeleton h-16" />)
        ) : filtered.length === 0 ? (
          <EmptyState icon="🔄" title="Hareket yok" description="İlk hareketi ekleyerek başlayın." action={<Button onClick={() => setOpen(true)}>+ Yeni Hareket</Button>} />
        ) : (
          filtered.map((m) => {
            const product = productMap.get(m.product_id);
            const wh = warehouseMap.get(m.warehouse_id);
            return (
              <div key={m.id} className="card animate-slide-up">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0
                    ${m.quantity < 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                    {m.quantity < 0 ? '📤' : '📥'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <Tag tone={TYPE_TONE[m.type]}>{TYPE_LABEL[m.type]}</Tag>
                      <span className={`text-base font-bold tabular-nums ${m.quantity < 0 ? 'text-red-600' : 'text-green-700'}`}>
                        {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                      </span>
                    </div>
                    <div className="font-medium text-ink-900 truncate">{product?.name ?? `#${m.product_id}`}</div>
                    <div className="text-xs text-ink-500 mt-0.5">
                      🏪 {wh?.code ?? `#${m.warehouse_id}`} · {formatRelativeTime(m.created_at)}
                    </div>
                    {(m.reference || m.note) && (
                      <div className="mt-1.5 text-xs text-ink-600 truncate">
                        {m.reference && <span className="font-mono mr-2">{m.reference}</span>}
                        {m.note}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block card overflow-x-auto p-0">
        <table className="table">
          <thead>
            <tr>
              <th>Tarih</th>
              <th>Tür</th>
              <th>Malzeme</th>
              <th>Şube</th>
              <th className="text-right">Miktar</th>
              <th>Referans</th>
              <th>Not</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {filtered === null ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={7}><div className="skeleton h-6 w-full" /></td></tr>
              ))
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="py-12">
                <EmptyState icon="🔄" title="Hareket yok" description="İlk hareketi ekleyerek başlayın." />
              </td></tr>
            ) : (
              filtered.map((m) => (
                <tr key={m.id}>
                  <td className="text-ink-500 whitespace-nowrap text-xs">
                    <div>{formatDateTime(m.created_at)}</div>
                    <div className="text-[10px]">{formatRelativeTime(m.created_at)}</div>
                  </td>
                  <td><Tag tone={TYPE_TONE[m.type]}>{TYPE_LABEL[m.type]}</Tag></td>
                  <td className="font-medium text-ink-900">{productMap.get(m.product_id)?.name ?? `#${m.product_id}`}</td>
                  <td className="text-ink-600">{warehouseMap.get(m.warehouse_id)?.code ?? `#${m.warehouse_id}`}</td>
                  <td className={`text-right font-semibold tabular-nums ${m.quantity < 0 ? 'text-red-600' : 'text-green-700'}`}>
                    {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                  </td>
                  <td className="text-ink-500 font-mono text-xs">{m.reference ?? '—'}</td>
                  <td className="text-ink-500">{m.note ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal open={open} title="Yeni Stok Hareketi" onClose={() => setOpen(false)}>
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="label">Tür</label>
            <div className="grid grid-cols-2 gap-2">
              {(['in', 'out'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm({ ...form, type: t })}
                  className={`py-3 rounded-lg border-2 text-sm font-medium transition-all
                    ${form.type === t
                      ? t === 'in' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-red-50 border-red-500 text-red-700'
                      : 'bg-white border-ink-200 text-ink-600 hover:border-ink-300'}`}
                >
                  {t === 'in' ? '📥 Giriş (IN)' : '📤 Çıkış (OUT)'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Malzeme</label>
            <select className="input" required value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })}>
              {products.map((p) => <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Şube</label>
            <select className="input" required value={form.warehouse_id} onChange={(e) => setForm({ ...form, warehouse_id: e.target.value })}>
              {warehouses.map((w) => <option key={w.id} value={w.id}>{w.code} — {w.name}</option>)}
            </select>
          </div>
          <Input label="Miktar" type="number" inputMode="numeric" min={1} required
            value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
          <Input label="Referans" placeholder="Sipariş kodu, vb." value={form.reference}
            onChange={(e) => setForm({ ...form, reference: e.target.value })} />
          <Input label="Not" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setOpen(false)}>Vazgeç</Button>
            <Button type="submit" loading={saving}>Kaydet</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
