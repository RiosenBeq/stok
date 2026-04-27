'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Tag from '@/components/ui/Tag';
import { api } from '@/lib/api';
import { toast } from '@/store/toast';
import { formatCurrency } from '@/lib/format';
import type { FoodCostRow, MenuItem, Product } from '@/types/api';

interface RecipeLine { product_id: string; quantity: number; }
interface FormState {
  sku: string; name: string; price: number; description: string;
  recipe: RecipeLine[];
}
const EMPTY: FormState = { sku: '', name: '', price: 0, description: '', recipe: [] };

function FoodCostBadge({ pct }: { pct: number }) {
  if (pct < 30) return <Tag tone="green">% {pct.toFixed(1)} sağlıklı</Tag>;
  if (pct < 45) return <Tag tone="amber">% {pct.toFixed(1)} ortalama</Tag>;
  return <Tag tone="red">% {pct.toFixed(1)} yüksek</Tag>;
}

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

  function openNew() { setEditing(null); setForm(EMPTY); setOpen(true); }
  function openEdit(mi: MenuItem) {
    setEditing(mi);
    setForm({
      sku: mi.sku, name: mi.name, price: Number(mi.price),
      description: mi.description ?? '',
      recipe: mi.recipe.map((r) => ({ product_id: String(r.product_id), quantity: Number(r.quantity) })),
    });
    setOpen(true);
  }
  function addLine() { setForm((f) => ({ ...f, recipe: [...f.recipe, { product_id: '', quantity: 1 }] })); }
  function removeLine(idx: number) { setForm((f) => ({ ...f, recipe: f.recipe.filter((_, i) => i !== idx) })); }
  function updateLine(idx: number, patch: Partial<RecipeLine>) {
    setForm((f) => ({ ...f, recipe: f.recipe.map((l, i) => i === idx ? { ...l, ...patch } : l) }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const validRecipe = form.recipe.filter((r) => r.product_id && r.quantity > 0);
    if (validRecipe.length === 0) { toast.error('En az bir malzeme ekleyin'); return; }
    setSaving(true);
    const payload = {
      sku: form.sku, name: form.name, price: form.price,
      description: form.description || null,
      recipe: validRecipe.map((r) => ({ product_id: Number(r.product_id), quantity: r.quantity })),
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

  // Live cost for the open form
  const liveCost = useMemo(() => {
    return form.recipe.reduce((sum, l) => {
      const p = productMap.get(Number(l.product_id));
      return sum + (p ? Number(p.cost_price) * l.quantity : 0);
    }, 0);
  }, [form.recipe, productMap]);
  const liveMargin = form.price - liveCost;
  const livePct = form.price > 0 ? (liveCost / form.price) * 100 : 0;

  return (
    <>
      <PageHeader
        title="Menü &amp; Reçete"
        subtitle="Burger, menü ve eşlik eden ürünler — her satışta reçete malzemeleri otomatik düşer"
        actions={<Button onClick={openNew} iconLeft={<span>+</span>}>Yeni Menü</Button>}
      />

      {items === null ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="card skeleton h-32" />)}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon="📖"
          title="Henüz menü kalemi yok"
          description="Bir burger veya menü oluşturun, malzemelerini reçeteyle bağlayın. Her satışta stok otomatik düşer."
          action={<Button onClick={openNew}>+ İlk menü kaleminizi oluşturun</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map((mi) => {
            const fc = costs[mi.id];
            return (
              <div key={mi.id} className="card hover:shadow-pop transition animate-slide-up">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center text-2xl flex-shrink-0">
                      🍔
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-ink-900 flex items-center gap-2">
                        {mi.name}
                        {!mi.is_active && <Tag>Pasif</Tag>}
                      </div>
                      <div className="text-xs text-ink-500 font-mono mt-0.5">
                        {mi.sku} · {mi.recipe.length} malzeme
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xl font-bold text-brand-700 tabular-nums">
                      {formatCurrency(Number(mi.price))}
                    </div>
                  </div>
                </div>

                {fc && (
                  <div className="mt-3 pt-3 border-t border-ink-100 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-ink-500">Maliyet</div>
                      <div className="text-sm font-semibold tabular-nums mt-0.5">{formatCurrency(fc.cost)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-ink-500">Marj</div>
                      <div className="text-sm font-semibold text-green-700 tabular-nums mt-0.5">{formatCurrency(fc.margin)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-ink-500">Food Cost</div>
                      <div className="mt-0.5"><FoodCostBadge pct={fc.food_cost_pct} /></div>
                    </div>
                  </div>
                )}

                {mi.recipe.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {mi.recipe.slice(0, 6).map((r) => (
                      <span key={r.id} className="text-[11px] bg-ink-50 text-ink-700 px-2 py-0.5 rounded-full ring-1 ring-inset ring-ink-200">
                        {productMap.get(r.product_id)?.name ?? `#${r.product_id}`} ×{r.quantity}
                      </span>
                    ))}
                    {mi.recipe.length > 6 && (
                      <span className="text-[11px] text-ink-500">+{mi.recipe.length - 6}</span>
                    )}
                  </div>
                )}

                <div className="mt-3 pt-3 border-t border-ink-100 flex justify-end gap-3 text-xs">
                  <button onClick={() => openEdit(mi)} className="text-brand-700 hover:underline">Düzenle</button>
                  {mi.is_active && (
                    <button onClick={() => setConfirmingId(mi.id)} className="text-red-600 hover:underline">Sil</button>
                  )}
                </div>
              </div>
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
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input label="SKU" required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            <Input label="Fiyat (₺)" type="number" inputMode="decimal" step="0.01" min={0}
              value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
            <div className="md:col-span-2">
              <Input label="Ad" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Input label="Açıklama" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>

          {/* Recipe builder */}
          <div className="rounded-lg ring-1 ring-ink-200 p-3 bg-ink-50/30">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-ink-900">Reçete</h3>
                <p className="text-xs text-ink-500">Bir adet menü için tüketilen malzemeler</p>
              </div>
              <Button variant="secondary" size="sm" type="button" onClick={addLine}>+ Malzeme</Button>
            </div>
            {form.recipe.length === 0 ? (
              <p className="text-xs text-ink-500 py-3 text-center">
                Henüz malzeme yok. <strong>+ Malzeme</strong> ile ekleyin.
              </p>
            ) : (
              <div className="space-y-2">
                {form.recipe.map((line, i) => (
                  <div key={i} className="flex gap-2 items-center animate-slide-up">
                    <select
                      className="input flex-1"
                      value={line.product_id}
                      onChange={(e) => updateLine(i, { product_id: e.target.value })}
                    >
                      <option value="">— Malzeme seç —</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>
                      ))}
                    </select>
                    <input
                      type="number" inputMode="decimal" step="0.001" min={0}
                      className="input w-24" placeholder="Miktar"
                      value={line.quantity}
                      onChange={(e) => updateLine(i, { quantity: Number(e.target.value) })}
                    />
                    <button
                      type="button" onClick={() => removeLine(i)}
                      className="w-9 h-9 rounded-md text-ink-400 hover:bg-red-50 hover:text-red-600 transition flex items-center justify-center"
                      aria-label="Sil"
                    >×</button>
                  </div>
                ))}
              </div>
            )}

            {/* Live food cost calculation */}
            {form.recipe.length > 0 && form.price > 0 && (
              <div className="mt-3 pt-3 border-t border-ink-200 grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <div className="text-[10px] uppercase text-ink-500">Maliyet</div>
                  <div className="font-semibold tabular-nums mt-0.5">{formatCurrency(liveCost)}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-ink-500">Marj</div>
                  <div className={`font-semibold tabular-nums mt-0.5 ${liveMargin >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                    {formatCurrency(liveMargin)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-ink-500">Food Cost</div>
                  <div className="mt-0.5"><FoodCostBadge pct={livePct} /></div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2 sticky bottom-0 bg-white">
            <Button variant="secondary" type="button" onClick={() => setOpen(false)}>Vazgeç</Button>
            <Button type="submit" loading={saving}>{editing ? 'Güncelle' : 'Kaydet'}</Button>
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
