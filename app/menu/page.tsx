'use client';

import { FormEvent, useEffect, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import { RowCard } from '@/components/ResponsiveCard';
import { api } from '@/lib/api';
import { toast } from '@/store/toast';
import type { FoodCostRow, MenuItem, Product } from '@/types/api';

interface RecipeLine {
  product_id: string;
  quantity: number;
}

interface FormState {
  sku: string;
  name: string;
  price: number;
  description: string;
  recipe: RecipeLine[];
}

const EMPTY: FormState = { sku: '', name: '', price: 0, description: '', recipe: [] };

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[] | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [costs, setCosts] = useState<Record<number, FoodCostRow>>({});
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  async function reload() {
    try {
      const [list, fc] = await Promise.all([
        api.get<MenuItem[]>('/menu-items/'),
        api.get<FoodCostRow[]>('/menu-items/-/food-cost').catch(() => [] as FoodCostRow[]),
      ]);
      setItems(list);
      setCosts(Object.fromEntries(fc.map((r) => [r.menu_item_id, r])));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Yüklenemedi');
    }
  }

  useEffect(() => {
    api.get<Product[]>('/products/?limit=200').then(setProducts).catch(() => {});
    reload();
  }, []);

  function openNew() {
    setEditing(null);
    setForm(EMPTY);
    setOpen(true);
  }

  function openEdit(mi: MenuItem) {
    setEditing(mi);
    setForm({
      sku: mi.sku,
      name: mi.name,
      price: Number(mi.price),
      description: mi.description ?? '',
      recipe: mi.recipe.map((r) => ({
        product_id: String(r.product_id),
        quantity: Number(r.quantity),
      })),
    });
    setOpen(true);
  }

  function addLine() {
    setForm((f) => ({ ...f, recipe: [...f.recipe, { product_id: '', quantity: 1 }] }));
  }
  function removeLine(idx: number) {
    setForm((f) => ({ ...f, recipe: f.recipe.filter((_, i) => i !== idx) }));
  }
  function updateLine(idx: number, patch: Partial<RecipeLine>) {
    setForm((f) => ({
      ...f,
      recipe: f.recipe.map((l, i) => (i === idx ? { ...l, ...patch } : l)),
    }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const validRecipe = form.recipe.filter((r) => r.product_id && r.quantity > 0);
    if (validRecipe.length === 0) {
      toast.error('En az bir malzeme ekleyin');
      return;
    }
    setSaving(true);
    const payload = {
      sku: form.sku,
      name: form.name,
      price: form.price,
      description: form.description || null,
      recipe: validRecipe.map((r) => ({
        product_id: Number(r.product_id),
        quantity: r.quantity,
      })),
    };
    try {
      if (editing) {
        await api.patch(`/menu-items/${editing.id}`, payload);
        toast.success('Menü kalemi güncellendi');
      } else {
        await api.post('/menu-items/', payload);
        toast.success('Menü kalemi eklendi');
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
      await api.delete(`/menu-items/${id}`);
      toast.success('Pasifleştirildi');
      reload();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Silinemedi');
    }
  }

  const productMap = new Map(products.map((p) => [p.id, p]));

  return (
    <>
      <PageHeader
        title="Menü &amp; Reçete"
        subtitle="Burger, menü ve eşlik eden ürünler — her satışta reçete malzemelerini otomatik düşer"
        actions={<button className="btn-primary" onClick={openNew}>+ Yeni Menü</button>}
      />

      {items === null ? (
        <div className="text-center text-slate-400 py-10">Yükleniyor…</div>
      ) : items.length === 0 ? (
        <div className="card text-center text-slate-500 py-10">
          Henüz menü kalemi yok. <strong>+ Yeni Menü</strong> ile başlayın.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map((mi) => {
            const fc = costs[mi.id];
            return (
              <RowCard
                key={mi.id}
                title={
                  <span className="flex items-center gap-2">
                    {mi.name}
                    {!mi.is_active && <span className="badge-slate">Pasif</span>}
                  </span>
                }
                subtitle={`${mi.sku} · ${mi.recipe.length} malzeme`}
                meta={
                  <div className="space-y-1">
                    <div className="text-xs text-slate-600 truncate">
                      {mi.recipe
                        .map((r) => `${productMap.get(r.product_id)?.name ?? `#${r.product_id}`} ×${r.quantity}`)
                        .join(', ') || 'Reçete boş'}
                    </div>
                    {fc && (
                      <div className="flex items-center gap-3 text-xs">
                        <span>Fiyat <strong>{fc.price.toFixed(2)} ₺</strong></span>
                        <span>Maliyet <strong>{fc.cost.toFixed(2)} ₺</strong></span>
                        <span className={fc.food_cost_pct < 35 ? 'text-green-700' : fc.food_cost_pct < 50 ? 'text-amber-700' : 'text-red-700'}>
                          %{fc.food_cost_pct.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                }
                actions={
                  <>
                    <button onClick={() => openEdit(mi)} className="text-brand-700">Düzenle</button>
                    {mi.is_active && (
                      <button onClick={() => setConfirmingId(mi.id)} className="text-red-600">Sil</button>
                    )}
                  </>
                }
              />
            );
          })}
        </div>
      )}

      <Modal
        open={open}
        title={editing ? `Düzenle: ${editing.sku}` : 'Yeni Menü Kalemi'}
        onClose={() => setOpen(false)}
        size="lg"
      >
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="label">SKU *</label>
              <input className="input" required value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            </div>
            <div>
              <label className="label">Fiyat (₺)</label>
              <input type="number" inputMode="decimal" step="0.01" min="0" className="input"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
            </div>
            <div className="md:col-span-2">
              <label className="label">Ad *</label>
              <input className="input" required value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="label">Açıklama</label>
              <input className="input" value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Reçete (Malzemeler)</label>
              <button type="button" onClick={addLine} className="text-brand-700 text-xs hover:underline">
                + Malzeme ekle
              </button>
            </div>
            {form.recipe.length === 0 && (
              <div className="text-xs text-slate-500 py-2">Henüz malzeme eklenmedi.</div>
            )}
            <div className="space-y-2">
              {form.recipe.map((line, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <select
                    className="input flex-1"
                    value={line.product_id}
                    onChange={(e) => updateLine(i, { product_id: e.target.value })}
                  >
                    <option value="">— Malzeme seç —</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.sku} — {p.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.001"
                    min="0"
                    className="input w-24"
                    placeholder="Miktar"
                    value={line.quantity}
                    onChange={(e) => updateLine(i, { quantity: Number(e.target.value) })}
                  />
                  <button
                    type="button"
                    onClick={() => removeLine(i)}
                    className="text-red-600 text-sm w-8"
                    aria-label="Sil"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 sticky bottom-0 bg-white pb-1">
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
        title="Menü kalemini pasifleştir"
        message="Geçmiş satışlar korunur, ama bu menü artık satılamaz."
        confirmLabel="Pasifleştir"
        onConfirm={() => confirmingId !== null && onDelete(confirmingId)}
        onCancel={() => setConfirmingId(null)}
      />
    </>
  );
}
