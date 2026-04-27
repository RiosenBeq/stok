'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import { RowCard } from '@/components/ResponsiveCard';
import EmptyState from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import FilterChip from '@/components/ui/FilterChip';
import Tag from '@/components/ui/Tag';
import { api } from '@/lib/api';
import { toast } from '@/store/toast';
import { formatCurrency } from '@/lib/format';
import type { Category, ProductWithStock, Supplier } from '@/types/api';

type SortKey = 'sku' | 'name' | 'on_hand' | 'cost_price' | 'sale_price';
type SortDir = 'asc' | 'desc';
type Filter = 'all' | 'low' | 'out' | 'inactive';

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
  if (!p.is_active) return <Tag tone="slate">Pasif</Tag>;
  if (p.on_hand === 0) return <Tag tone="red">Tükendi</Tag>;
  if (p.is_low_stock) return <Tag tone="amber">Düşük</Tag>;
  return <Tag tone="green">Yeterli</Tag>;
}

export default function ProductsPage() {
  const [items, setItems] = useState<ProductWithStock[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProductWithStock | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  async function reload() {
    try {
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      setItems(await api.get<ProductWithStock[]>(`/products/?${params.toString()}`));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Yüklenemedi');
    }
  }

  useEffect(() => {
    Promise.all([api.get<Category[]>('/categories/'), api.get<Supplier[]>('/suppliers/')])
      .then(([c, s]) => { setCategories(c); setSuppliers(s); })
      .catch(() => {/* non-fatal */});
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(reload, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const counts = useMemo(() => {
    const list = items ?? [];
    return {
      all: list.length,
      low: list.filter((p) => p.is_active && p.is_low_stock && p.on_hand > 0).length,
      out: list.filter((p) => p.is_active && p.on_hand === 0).length,
      inactive: list.filter((p) => !p.is_active).length,
    };
  }, [items]);

  const filtered = useMemo(() => {
    if (!items) return null;
    let arr = items;
    if (filter === 'low') arr = arr.filter((p) => p.is_active && p.is_low_stock && p.on_hand > 0);
    else if (filter === 'out') arr = arr.filter((p) => p.is_active && p.on_hand === 0);
    else if (filter === 'inactive') arr = arr.filter((p) => !p.is_active);
    arr = [...arr].sort((a, b) => {
      const av = (a as unknown as Record<string, unknown>)[sortKey];
      const bv = (b as unknown as Record<string, unknown>)[sortKey];
      if (typeof av === 'number' && typeof bv === 'number') return sortDir === 'asc' ? av - bv : bv - av;
      return sortDir === 'asc'
        ? String(av ?? '').localeCompare(String(bv ?? ''), 'tr')
        : String(bv ?? '').localeCompare(String(av ?? ''), 'tr');
    });
    return arr;
  }, [items, filter, sortKey, sortDir]);

  function openNew() { setEditing(null); setForm(EMPTY_FORM); setOpen(true); }
  function openEdit(p: ProductWithStock) {
    setEditing(p);
    setForm({
      sku: p.sku, barcode: p.barcode ?? '', name: p.name, unit: p.unit,
      cost_price: Number(p.cost_price), sale_price: Number(p.sale_price),
      tax_rate: Number(p.tax_rate), low_stock_threshold: p.low_stock_threshold,
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

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  }

  function SortHeader({ k, label, align = 'left' }: { k: SortKey; label: string; align?: 'left' | 'right' }) {
    const arrow = sortKey === k ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';
    return (
      <th
        onClick={() => toggleSort(k)}
        className={`cursor-pointer select-none hover:bg-ink-100 ${align === 'right' ? 'text-right' : ''}`}
      >
        <span className={`${sortKey === k ? 'text-brand-700' : ''}`}>{label}{arrow}</span>
      </th>
    );
  }

  return (
    <>
      <PageHeader
        title="Stok / Malzeme"
        subtitle="Hammadde ve ambalaj kalemleri (köfte, ekmek, bardak…)"
        actions={
          <Button onClick={openNew} iconLeft={<span>+</span>}>Yeni Malzeme</Button>
        }
      />

      <div className="card mb-4 space-y-3">
        <Input
          iconLeft={<span>🔍</span>}
          placeholder="SKU / barkod / ad ara…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <FilterChip active={filter === 'all'} onClick={() => setFilter('all')} count={counts.all}>Tümü</FilterChip>
          <FilterChip active={filter === 'low'} onClick={() => setFilter('low')} count={counts.low}>⚠️ Düşük</FilterChip>
          <FilterChip active={filter === 'out'} onClick={() => setFilter('out')} count={counts.out}>🔴 Tükendi</FilterChip>
          <FilterChip active={filter === 'inactive'} onClick={() => setFilter('inactive')} count={counts.inactive}>Pasif</FilterChip>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {filtered === null ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="card skeleton h-20" />)
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="📦"
            title={search || filter !== 'all' ? 'Eşleşen malzeme yok' : 'Henüz malzeme yok'}
            description={search || filter !== 'all' ? 'Filtreleri temizlemeyi deneyin.' : 'Stok kayıtlarınızla başlayın.'}
            action={!search && filter === 'all' && <Button onClick={openNew}>+ İlk malzemeyi ekle</Button>}
          />
        ) : (
          filtered.map((p) => (
            <RowCard
              key={p.id}
              title={p.name}
              subtitle={`${p.sku}${p.barcode ? ` · ${p.barcode}` : ''}`}
              meta={
                <div className="flex items-center gap-3 text-xs">
                  <span>
                    Stok: <strong className="text-ink-900 tabular-nums">{p.on_hand}</strong>
                    <span className="text-ink-400"> / {p.low_stock_threshold}</span>
                  </span>
                  <span>Maliyet: <strong className="tabular-nums">{formatCurrency(Number(p.cost_price))}</strong></span>
                </div>
              }
              badges={<StatusBadge p={p} />}
              actions={
                <>
                  <button onClick={() => openEdit(p)} className="text-brand-700">Düzenle</button>
                  {p.is_active && <button onClick={() => setConfirmingId(p.id)} className="text-red-600">Sil</button>}
                </>
              }
            />
          ))
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block card overflow-x-auto p-0">
        <table className="table">
          <thead>
            <tr>
              <SortHeader k="sku" label="SKU" />
              <SortHeader k="name" label="Malzeme" />
              <th>Kategori</th>
              <SortHeader k="on_hand" label="Stok" align="right" />
              <th className="text-right">Eşik</th>
              <SortHeader k="cost_price" label="Maliyet" align="right" />
              <SortHeader k="sale_price" label="Satış" align="right" />
              <th>Durum</th>
              <th className="w-28 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {filtered === null ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={9}><div className="skeleton h-6 w-full" /></td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12">
                  <EmptyState
                    icon="📦"
                    title={search || filter !== 'all' ? 'Eşleşen malzeme yok' : 'Henüz malzeme yok'}
                    description={search || filter !== 'all' ? 'Filtreleri temizleyin.' : 'Stok kayıtlarınızla başlayın.'}
                    action={!search && filter === 'all' && <Button onClick={openNew}>+ Yeni Malzeme</Button>}
                  />
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id}>
                  <td className="font-mono text-xs text-ink-600">{p.sku}</td>
                  <td className="font-medium text-ink-900">{p.name}</td>
                  <td className="text-ink-600">{categories.find((c) => c.id === p.category_id)?.name ?? '—'}</td>
                  <td className="text-right tabular-nums font-medium">{p.on_hand}</td>
                  <td className="text-right text-ink-500 tabular-nums">{p.low_stock_threshold}</td>
                  <td className="text-right tabular-nums">{Number(p.cost_price).toFixed(2)}</td>
                  <td className="text-right tabular-nums">{Number(p.sale_price).toFixed(2)}</td>
                  <td><StatusBadge p={p} /></td>
                  <td className="text-right whitespace-nowrap">
                    <button onClick={() => openEdit(p)} className="text-brand-700 hover:underline mr-3 text-xs">Düzenle</button>
                    {p.is_active && <button onClick={() => setConfirmingId(p.id)} className="text-red-600 hover:underline text-xs">Sil</button>}
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
          <Input label="SKU" required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
          <Input label="Barkod" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
          <div className="md:col-span-2">
            <Input label="Malzeme Adı" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Kategori</label>
            <select className="input" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
              <option value="">—</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Tedarikçi</label>
            <select className="input" value={form.supplier_id} onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}>
              <option value="">—</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <Input label="Maliyet (₺)" type="number" inputMode="decimal" step="0.01" min={0}
            value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: Number(e.target.value) })} />
          <Input label="Satış Fiyatı (₺)" type="number" inputMode="decimal" step="0.01" min={0}
            value={form.sale_price} onChange={(e) => setForm({ ...form, sale_price: Number(e.target.value) })} />
          <Input label="KDV (%)" type="number" inputMode="decimal" step="0.01" min={0} max={100}
            value={form.tax_rate} onChange={(e) => setForm({ ...form, tax_rate: Number(e.target.value) })} />
          <Input label="Düşük Stok Eşiği" type="number" inputMode="numeric" min={0}
            value={form.low_stock_threshold} onChange={(e) => setForm({ ...form, low_stock_threshold: Number(e.target.value) })} />

          <div className="md:col-span-2 flex justify-end gap-2 pt-2 sticky bottom-0 bg-white">
            <Button variant="secondary" type="button" onClick={() => setOpen(false)}>Vazgeç</Button>
            <Button type="submit" loading={saving}>{editing ? 'Güncelle' : 'Kaydet'}</Button>
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
