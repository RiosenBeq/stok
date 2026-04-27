import { FormEvent, useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import { api } from '../lib/api';
import type { Product, StockMovement, Warehouse } from '../types/api';

export default function Movements() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    product_id: '',
    warehouse_id: '',
    type: 'in' as 'in' | 'out',
    quantity: 1,
    reference: '',
    note: '',
  });

  async function reload() {
    const data = await api.get<StockMovement[]>('/inventory/movements?limit=200');
    setMovements(data);
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
    setError(null);
    try {
      await api.post('/inventory/movements', {
        product_id: Number(form.product_id),
        warehouse_id: Number(form.warehouse_id),
        type: form.type,
        quantity: Number(form.quantity),
        reference: form.reference || null,
        note: form.note || null,
      });
      setOpen(false);
      reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Hata');
    }
  }

  const productMap = new Map(products.map((p) => [p.id, p]));
  const warehouseMap = new Map(warehouses.map((w) => [w.id, w]));

  return (
    <>
      <PageHeader
        title="Stok Hareketleri"
        subtitle="Giriş, çıkış, transfer ve düzeltme kayıtları"
        actions={<button className="btn-primary" onClick={() => setOpen(true)}>+ Yeni Hareket</button>}
      />

      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Tarih</th>
              <th>Tür</th>
              <th>Ürün</th>
              <th>Depo</th>
              <th className="text-right">Miktar</th>
              <th>Referans</th>
              <th>Not</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {movements.map((m) => {
              const badge =
                m.type === 'in' ? 'badge-green'
                : m.type === 'out' ? 'badge-red'
                : m.type === 'transfer' ? 'badge-slate'
                : 'badge-amber';
              return (
                <tr key={m.id}>
                  <td className="text-slate-500 whitespace-nowrap">
                    {new Date(m.created_at).toLocaleString('tr-TR')}
                  </td>
                  <td><span className={badge}>{m.type}</span></td>
                  <td>{productMap.get(m.product_id)?.name ?? `#${m.product_id}`}</td>
                  <td>{warehouseMap.get(m.warehouse_id)?.code ?? `#${m.warehouse_id}`}</td>
                  <td className={`text-right font-medium ${m.quantity < 0 ? 'text-red-600' : 'text-green-700'}`}>
                    {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                  </td>
                  <td className="text-slate-500">{m.reference ?? '—'}</td>
                  <td className="text-slate-500">{m.note ?? '—'}</td>
                </tr>
              );
            })}
            {movements.length === 0 && (
              <tr><td colSpan={7} className="text-center text-slate-400 py-6">Hareket yok.</td></tr>
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
            <label className="label">Ürün</label>
            <select className="input" required value={form.product_id}
                    onChange={(e) => setForm({ ...form, product_id: e.target.value })}>
              {products.map((p) => <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Depo</label>
            <select className="input" required value={form.warehouse_id}
                    onChange={(e) => setForm({ ...form, warehouse_id: e.target.value })}>
              {warehouses.map((w) => <option key={w.id} value={w.id}>{w.code} — {w.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Miktar</label>
            <input type="number" min="1" required className="input" value={form.quantity}
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
          {error && <div className="text-sm text-red-600">{error}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Vazgeç</button>
            <button type="submit" className="btn-primary">Kaydet</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
