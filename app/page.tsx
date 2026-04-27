'use client';

import { useEffect, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import { api } from '@/lib/api';
import type { DashboardStats, TopProduct } from '@/types/api';

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: string;
}) {
  return (
    <div className="card">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-2 text-2xl font-semibold ${accent ?? 'text-slate-900'}`}>{value}</div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [top, setTop] = useState<TopProduct[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<DashboardStats>('/reports/dashboard'),
      api.get<TopProduct[]>('/reports/top-products?movement=out&limit=10'),
    ])
      .then(([s, t]) => {
        setStats(s);
        setTop(t);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) return <div className="text-red-600">{error}</div>;
  if (!stats) return <div className="text-slate-500">Yükleniyor…</div>;

  return (
    <>
      <PageHeader title="Pano" subtitle="Genel sistem durumu ve metrikler" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Toplam Ürün" value={stats.total_products} />
        <StatCard label="Aktif Ürün" value={stats.active_products} />
        <StatCard label="Toplam Birim" value={stats.total_units_on_hand} />
        <StatCard
          label="Düşük Stok"
          value={stats.low_stock_count}
          accent={stats.low_stock_count > 0 ? 'text-amber-600' : 'text-green-600'}
        />
        <StatCard label="Depolar" value={stats.total_warehouses} />
        <StatCard label="Tedarikçiler" value={stats.total_suppliers} />
        <StatCard
          label="Stok Değeri (₺)"
          value={stats.total_stock_value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
          accent="text-brand-700"
        />
      </div>

      <section className="card">
        <h2 className="text-lg font-semibold mb-4">En Çok Satan 10 Ürün</h2>
        {top.length === 0 ? (
          <p className="text-sm text-slate-500">Henüz satış hareketi yok.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Ürün</th>
                <th className="text-right">Çıkan Birim</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {top.map((p) => (
                <tr key={p.product_id}>
                  <td className="font-mono">{p.sku}</td>
                  <td>{p.name}</td>
                  <td className="text-right">{p.units_moved}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
