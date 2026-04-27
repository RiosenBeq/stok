'use client';

import { FormEvent, useEffect, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import Modal from '@/components/Modal';
import { api } from '@/lib/api';
import type { Category, ProductWithStock, Supplier } from '@/types/api';

const EMPTY_FORM = {
  sku: '',
  barcode: '',
  name: '',
  unit: 'adet',
  cost_price: 0,
  sale_price: 0,
  tax_rate: 18,
  low_stock_threshold: 10,
  category_id: '' as string | number,
  supplier_id: '' as string | number,
};

export default function ProductsPage() {
  const [items, setItems] = useState<ProductWithStock[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [lowOnly, setLowOnly] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function reload() {
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (lowOnly) params.set('low_stock_only', 'true');
    const data = await api.get<ProductWithStock[]>(`/products/?${params.toString()}`);
    setItems(data);
  }

  useEffect(() => {
    Promise.all([api.get<Category[]>('/categories/'), api.get<Supplier[]>('/suppliers/')]).then(
      ([c, s]) => {
        setCategories(c);
        setSuppliers(s);
      }
    );
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(reload, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, lowOnly]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload = {
        ...form,
        category_id: form.category_id === '' ? null : Number(form.category_id),
        supplier_id: form.supplier_id === '' ? null : Number(form.supplier_id),
        barcode: form.barcode || null,
      };
      await api.post('/products/', payload);
      setOpen(false);
      setForm(EMPTY_FORM);
      reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Hata');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Ürünler"
        subtitle="Ürün kataloğu ve anlık stok durumu"
        actions={
          <button className="btn-primary" onClick={() => setOpen(true)}>
            + Yeni Ürün
          </button>
        }
      />

      <div className="card mb-4 flex flex-wrap gap-3 items-center">
        <input
          className="input max-w-xs"
          placeholder="SKU / barkod / isim ara…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={lowOnly}
            onChange={(e) => setLowOnly(e.target.checked)}
          />
          Sadece düşük stok
        </label>
      </div>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Ürün</th>
              <th>Kategori</th>
              <th className="text-right">Stok</th>
              <th className="text-right">Eşik</th>
              <th className="text-right">Maliyet</th>
              <th className="text-right">Satış</th>
              <th>Durum</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((p) => (
              <tr key={p.id}>
                <td className="font-mono">{p.sku}</td>
                <td>{p.name}</td>
                <td>{categories.find((c) => c.id === p.category_id)?.name ?? '—'}</td>
                <td className="text-right">{p.on_hand}</td>
                <td className="text-right text-slate-500">{p.low_stock_threshold}</td>
                <td className="text-right">{Number(p.cost_price).toFixed(2)}</td>
                <td className="text-right">{Number(p.sale_price).toFixed(2)}</td>
                <td>
                  {!p.is_active ? (
                    <span className="badge-slate">Pasif</span>
                  ) : p.is_low_stock ? (
                    <span className="badge-amber">Düşük</span>
                  ) : (
                    <span className="badge-green">Yeterli</span>
                  )}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center text-slate-400 py-6">
                  Kayıt bulunamadı.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={open} title="Yeni Ürün" onClose={() => setOpen(false)}>
        <form onSubmit={onSubmit} className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">SKU *</label>
            <input
              className="input"
              required
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Barkod</label>
            <input
              className="input"
              value={form.barcode}
              onChange={(e) => setForm({ ...form, barcode: e.target.value })}
            />
          </div>
          <div className="col-span-2">
            <label className="label">Ürün Adı *</label>
            <input
              className="input"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Kategori</label>
            <select
              className="input"
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
            >
              <option value="">—</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Tedarikçi</label>
            <select
              className="input"
              value={form.supplier_id}
              onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}
            >
              <option value="">—</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Maliyet (₺)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="input"
              value={form.cost_price}
              onChange={(e) => setForm({ ...form, cost_price: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="label">Satış Fiyatı (₺)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="input"
              value={form.sale_price}
              onChange={(e) => setForm({ ...form, sale_price: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="label">KDV (%)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              className="input"
              value={form.tax_rate}
              onChange={(e) => setForm({ ...form, tax_rate: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="label">Düşük Stok Eşiği</label>
            <input
              type="number"
              min="0"
              className="input"
              value={form.low_stock_threshold}
              onChange={(e) => setForm({ ...form, low_stock_threshold: Number(e.target.value) })}
            />
          </div>
          {error && <div className="col-span-2 text-sm text-red-600">{error}</div>}
          <div className="col-span-2 flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
              Vazgeç
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Kaydediliyor…' : 'Kaydet'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
