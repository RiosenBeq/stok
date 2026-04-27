'use client';

import { FormEvent, useEffect, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import Modal from '@/components/Modal';
import { RowCard } from '@/components/ResponsiveCard';
import { api } from '@/lib/api';
import { toast } from '@/store/toast';
import type { Product, StockMovement, Warehouse } from '@/types/api';

const TYPE_BADGE: Record<string, string> = {
  in: 'badge-green',
  out: 'badge-red',
  transfer: 'badge-slate',
  adjustment: 'badge-amber',
};

const TYPE_LABEL: Record<string, string> = {
  in: 'Giriş',
  out: 'Çıkış',
  transfer: 'Transfer',
  adjustment: 'Düzeltme',
};

export default function MovementsPage() {
  const [movements, setMovements] = useState<StockMovement[] | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
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
        subtitle="Giriş, çıkış, transfer ve düzeltme kayıtları"
        actions={
          <button className="btn-primary" onClick={() => setOpen(true)}>
            + Yeni Hareket
          </button>
        }
      />

      {/* Mobile: card list */}
      <div className="md:hidden space-y-2">
        {movements === null ? (
          <div className="text-center text-slate-400 py-6">Yükleniyor…</div>
        ) : movements.length === 0 ? (
          <div className="text-center text-slate-400 py-10">Hareket yok.</div>
        ) : (
          movements.map((m) => (
            <RowCard
              key={m.id}
              title={
                <span className="flex items-center gap-2">
                  <span className={TYPE_BADGE[m.type]}>{TYPE_LABEL[m.type]}</span>
                  <span>{productMap.get(m.product_id)?.name ?? `#${m.product_id}`}</span>
                </span>
              }
              subtitle={
                <>
                  {warehouseMap.get(m.warehouse_id)?.code ?? `#${m.warehouse_id}`} ·{' '}
                  {new Date(m.created_at).toLocaleString('tr-TR')}
                </>
              }
              meta={
                <span
                  className={`text-base font-semibold ${
                    m.quantity < 0 ? 'text-red-600' : 'text-green-700'
                  }`}
                >
                  {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                </span>
              }
              badges={
                m.reference ? (
                  <span className="text-xs text-slate-500">{m.reference}</span>
                ) : null
              }
            />
          ))
        )}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block card overflow-x-auto">
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
          <tbody className="divide-y">
            {movements === null ? (
              <tr><td colSpan={7} className="text-center text-slate-400 py-6">Yükleniyor…</td></tr>
            ) : movements.length === 0 ? (
              <tr><td colSpan={7} className="text-center text-slate-400 py-6">Hareket yok.</td></tr>
            ) : (
              movements.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="text-slate-500 whitespace-nowrap">
                    {new Date(m.created_at).toLocaleString('tr-TR')}
                  </td>
                  <td><span className={TYPE_BADGE[m.type]}>{TYPE_LABEL[m.type]}</span></td>
                  <td>{productMap.get(m.product_id)?.name ?? `#${m.product_id}`}</td>
                  <td>{warehouseMap.get(m.warehouse_id)?.code ?? `#${m.warehouse_id}`}</td>
                  <td className={`text-right font-medium ${
                    m.quantity < 0 ? 'text-red-600' : 'text-green-700'
                  }`}>
                    {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                  </td>
                  <td className="text-slate-500">{m.reference ?? '—'}</td>
                  <td className="text-slate-500">{m.note ?? '—'}</td>
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
            <select className="input" value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as 'in' | 'out' })}>
              <option value="in">Giriş (IN)</option>
              <option value="out">Çıkış (OUT)</option>
            </select>
          </div>
          <div>
            <label className="label">Malzeme</label>
            <select className="input" required value={form.product_id}
              onChange={(e) => setForm({ ...form, product_id: e.target.value })}>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Şube</label>
            <select className="input" required value={form.warehouse_id}
              onChange={(e) => setForm({ ...form, warehouse_id: e.target.value })}>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>{w.code} — {w.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Miktar</label>
            <input type="number" inputMode="numeric" min="1" required className="input"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">Referans</label>
            <input className="input" value={form.reference}
              onChange={(e) => setForm({ ...form, reference: e.target.value })} />
          </div>
          <div>
            <label className="label">Not</label>
            <input className="input" value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
              Vazgeç
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Kaydediliyor…' : 'Kaydet'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
