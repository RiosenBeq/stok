'use client';

import { FormEvent, useEffect, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import { api } from '@/lib/api';
import { toast } from '@/store/toast';
import type { Product, Warehouse } from '@/types/api';

export default function WastePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [form, setForm] = useState({
    product_id: '',
    warehouse_id: '',
    quantity: 1,
    note: '',
  });
  const [saving, setSaving] = useState(false);

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
  }, []);

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
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Kayıt başarısız');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Zayiat / Fire Kaydı"
        subtitle="Bozulan, dökülen veya tarihi geçen malzemeleri stoktan düşün"
      />
      <form onSubmit={onSubmit} className="card max-w-lg space-y-3">
        <div>
          <label className="label">Malzeme</label>
          <select
            className="input"
            required
            value={form.product_id}
            onChange={(e) => setForm({ ...form, product_id: e.target.value })}
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.sku} — {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Şube</label>
          <select
            className="input"
            required
            value={form.warehouse_id}
            onChange={(e) => setForm({ ...form, warehouse_id: e.target.value })}
          >
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.code} — {w.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Miktar</label>
          <input
            type="number"
            inputMode="numeric"
            min="1"
            required
            className="input"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
          />
        </div>
        <div>
          <label className="label">Sebep / Not</label>
          <input
            className="input"
            placeholder="Örn: SKT geçti, müşteri iadesi, hazırlık fire"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />
        </div>
        <button type="submit" className="btn-danger w-full" disabled={saving}>
          {saving ? 'Kaydediliyor…' : 'Zayiat olarak düş'}
        </button>
      </form>
    </>
  );
}
