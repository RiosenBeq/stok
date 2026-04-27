'use client';

import { FormEvent, useEffect, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import { RowCard } from '@/components/ResponsiveCard';
import { api } from '@/lib/api';
import { toast } from '@/store/toast';
import type { Category, ProductWithStock, Supplier } from '@/types/api';

interface FormState {
  sku: string;
  barcode: string;
  name: string;
  unit: string;
  cost_price: number;
  sale_price: number;
  tax_rate: number;
  low_stock_threshold: number;
  category_id: string;
  supplier_id: string;
}

const EMPTY_FORM: FormState = {
  sku: '',
  barcode: '',
  name: '',
  unit: 'adet',
  cost_price: 0,
  sale_price: 0,
  tax_rate: 18,
  low_stock_threshold: 10,
  category_id: '',
  supplier_id: '',
};

function StatusBadge({ p }: { p: ProductWithStock }) {
  if (!p.is_active) return <span className="badge-slate">Pasif</span>;
  if (p.is_low_stock) return <span className="badge-amber">Düşük</span>;
  return <span className="badge-green">Yeterli</span>;
}

export default function ProductsPage() {
  const [items, setItems] = useState<ProductWithStock[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [lowOnly, setLowOnly] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProductWithStock | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  async function reload() {
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (lowOnly) params.set('low_stock_only', 'true');
    try {
      setItems(await api.get<ProductWithStock[]>(`/products/?${params.toString()}`));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Yüklenemedi');
    }
  }

  useEffect(() => {
    Promise.all([api.get<Category[]>('/categories/'), api.get<Supplier[]>('/suppliers/')])
      .then(([c, s]) => {
        setCategories(c);
        setSuppliers(s);
      })
      .catch(() => {/* non-fatal */});
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(reload, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, lowOnly]);

  function openNew() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  }

  function openEdit(p: ProductWithStock) {
    setEditing(p);
    setForm({
      sku: p.sku,
      barcode: p.barcode ?? '',
      name: p.name,
      unit: p.unit,
      cost_price: Number(p.cost_price),
      sale_price: Number(p.sale_price),
      tax_rate: Number(p.tax_rate),
      low_stock_threshold: p.low_stock_threshold,
      category_id: p.category_id == null ? '' : String(p.category_id),
      supplier_id: p.supplier_id == null ? '' : String(p.supplier_id),
    });
    setOpen(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      category_id: form.category_id === '' ? null : Number(form.category_id),
      supplier_id: form.supplier_id === '' ? null : Number(form.supplier_id),
      barcode: form.barcode || null,
    };
    try {
      if (editing) {
        await api.patch(`/products/${editing.id}`, payload);
        toast.success('Malzeme güncellendi');
      } else {
        await api.post('/products/', payload);
        toast.success('Malzeme eklendi');
      }
      setOpen(false);
      reload();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Hata');
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: number) {
    setConfirmingId(null);
    try {
      await api.delete(`/products/${id}`);
      toast.success('Pasifleştirildi');
      reload();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Silinemedi');
    }
  }

  return (
    <>
      <PageHeader
        title="Stok / Malzeme"
        subtitle="Hammadde ve ambalaj kalemleri (köfte, ekmek, bardak…)"
        actions={
          <button className="btn-primary" onClick={openNew}>
            + Yeni Malzeme
          </button>
        }
      />

      <div className="card mb-4 flex flex-wrap gap-3 items-center">
        <input
          className="input flex-1 min-w-[180px] max-w-xs"
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
        {items && (
          <span className="text-xs text-slate-500 ml-auto">{items.length} kayıt</span>
        )}
      </div>

      {/* Mobile: card list */}
      <div className="md:hidden space-y-2">
        {items === null ? (
          <div className="text-center text-slate-400 py-6">Yükleniyor…</div>
        ) : items.length === 0 ? (
          <div className="text-center text-slate-400 py-10">
            {search || lowOnly ? 'Filtreyle eşleşen yok.' : '+ Yeni Malzeme ile başlayın.'}
          </div>
        ) : (
          items.map((p) => (
            <RowCard
              key={p.id}
              title={p.name}
              subtitle={`${p.sku}${p.barcode ? ` · ${p.barcode}` : ''}`}
              meta={
                <div className="flex items-center gap-3 text-xs">
                  <span>
                    Stok: <strong className="text-slate-900">{p.on_hand}</strong>
                    <span className="text-slate-400"> / eşik {p.low_stock_threshold}</span>
                  </span>
                  <span>
                    Maliyet: <strong>{Number(p.cost_price).toFixed(2)} ₺</strong>
                  </span>
                </div>
              }
              badges={<StatusBadge p={p} />}
              actions={
                <>
                  <button onClick={() => openEdit(p)} className="text-brand-700">
                    Düzenle
                  </button>
                  {p.is_active && (
                    <button onClick={() => setConfirmingId(p.id)} className="text-red-600">
                      Sil
                    </button>
                  )}
                </>
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
              <th>SKU</th>
              <th>Malzeme</th>
              <th>Kategori</th>
              <th className="text-right">Stok</th>
              <th className="text-right">Eşik</th>
              <th className="text-right">Maliyet</th>
              <th className="text-right">Satış</th>
              <th>Durum</th>
              <th className="w-28 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items === null ? (
              <tr>
                <td colSpan={9} className="text-center text-slate-400 py-6">
                  Yükleniyor…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center text-slate-400 py-10">
                  {search || lowOnly ? 'Filtreyle eşleşen yok.' : 'Henüz malzeme yok.'}
                </td>
              </tr>
            ) : (
              items.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="font-mono">{p.sku}</td>
                  <td>{p.name}</td>
                  <td>{categories.find((c) => c.id === p.category_id)?.name ?? '—'}</td>
                  <td className="text-right">{p.on_hand}</td>
                  <td className="text-right text-slate-500">{p.low_stock_threshold}</td>
                  <td className="text-right">{Number(p.cost_price).toFixed(2)}</td>
                  <td className="text-right">{Number(p.sale_price).toFixed(2)}</td>
                  <td><StatusBadge p={p} /></td>
                  <td className="text-right whitespace-nowrap">
                    <button onClick={() => openEdit(p)} className="text-brand-700 hover:underline mr-3 text-xs">
                      Düzenle
                    </button>
                    {p.is_active && (
                      <button onClick={() => setConfirmingId(p.id)} className="text-red-600 hover:underline text-xs">
                        Sil
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={open}
        title={editing ? `Düzenle: ${editing.sku}` : 'Yeni Malzeme'}
        onClose={() => setOpen(false)}
        size="lg"
      >
        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="label">SKU *</label>
            <input className="input" required value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })} />
          </div>
          <div>
            <label className="label">Barkod</label>
            <input className="input" value={form.barcode}
              onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <label className="label">Malzeme Adı *</label>
            <input className="input" required value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Kategori</label>
            <select className="input" value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
              <option value="">—</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Tedarikçi</label>
            <select className="input" value={form.supplier_id}
              onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}>
              <option value="">—</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Maliyet (₺)</label>
            <input type="number" inputMode="decimal" step="0.01" min="0" className="input"
              value={form.cost_price}
              onChange={(e) => setForm({ ...form, cost_price: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">Satış Fiyatı (₺)</label>
            <input type="number" inputMode="decimal" step="0.01" min="0" className="input"
              value={form.sale_price}
              onChange={(e) => setForm({ ...form, sale_price: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">KDV (%)</label>
            <input type="number" inputMode="decimal" step="0.01" min="0" max="100" className="input"
              value={form.tax_rate}
              onChange={(e) => setForm({ ...form, tax_rate: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">Düşük Stok Eşiği</label>
            <input type="number" inputMode="numeric" min="0" className="input"
              value={form.low_stock_threshold}
              onChange={(e) => setForm({ ...form, low_stock_threshold: Number(e.target.value) })} />
          </div>
          <div className="md:col-span-2 flex justify-end gap-2 pt-2 sticky bottom-0 bg-white pb-1">
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
              Vazgeç
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Kaydediliyor…' : 'Kaydet'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmingId !== null}
        title="Malzemeyi pasifleştir"
        message="Bu malzeme pasifleştirilecek (geçmiş hareketler korunur)."
        confirmLabel="Pasifleştir"
        onConfirm={() => confirmingId !== null && onDelete(confirmingId)}
        onCancel={() => setConfirmingId(null)}
      />
    </>
  );
}
