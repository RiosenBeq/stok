'use client';

import { useEffect, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import { api } from '@/lib/api';
import { toast } from '@/store/toast';
import type { DashboardStats, TopProduct } from '@/types/api';

function StatCard({
  label,
  value,
  hint,
  accent,
  icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: string;
  icon?: string;
}) {
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
        {icon && <div className="text-xl opacity-60">{icon}</div>}
      </div>
      <div className={`mt-2 text-2xl font-semibold ${accent ?? 'text-slate-900'}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
    </div>
  );
}

function StatSkeleton() {
  return (
    <div className="card">
      <div className="h-3 w-20 bg-slate-200 rounded animate-pulse" />
      <div className="mt-3 h-7 w-16 bg-slate-200 rounded animate-pulse" />
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [top, setTop] = useState<TopProduct[]>([]);

  useEffect(() => {
    Promise.all([
      api.get<DashboardStats>('/reports/dashboard'),
      api.get<TopProduct[]>('/reports/top-products?movement=out&limit=10'),
    ])
      .then(([s, t]) => {
        setStats(s);
        setTop(t);
      })
      .catch((e: Error) => toast.error(e.message));
  }, []);

  return (
    <>
      <PageHeader title="Pano" subtitle="Genel sistem durumu ve metrikler" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {!stats ? (
          Array.from({ length: 7 }).map((_, i) => <StatSkeleton key={i} />)
        ) : (
          <>
            <StatCard label="Toplam Ürün" value={stats.total_products} icon="📦" />
            <StatCard label="Aktif Ürün" value={stats.active_products} icon="✓" />
            <StatCard label="Toplam Birim" value={stats.total_units_on_hand} icon="🔢" />
            <StatCard
              label="Düşük Stok"
              value={stats.low_stock_count}
              accent={stats.low_stock_count > 0 ? 'text-amber-600' : 'text-green-600'}
              hint={stats.low_stock_count > 0 ? 'Aksiyon gerekli' : 'Sorun yok'}
              icon="⚠️"
            />
            <StatCard label="Depolar" value={stats.total_warehouses} icon="🏭" />
            <StatCard label="Tedarikçiler" value={stats.total_suppliers} icon="🤝" />
            <StatCard
              label="Stok Değeri (₺)"
              value={stats.total_stock_value.toLocaleString('tr-TR', {
                minimumFractionDigits: 2,
              })}
              accent="text-brand-700"
              icon="💰"
            />
          </>
        )}
      </div>

      <section className="card">
        <h2 className="text-lg font-semibold mb-4">En Çok Satan 10 Ürün</h2>
        {!stats ? (
          <p className="text-sm text-slate-500">Yükleniyor…</p>
        ) : top.length === 0 ? (
          <p className="text-sm text-slate-500">
            Henüz satış hareketi yok. <a href="/movements" className="text-brand-700 hover:underline">İlk hareketi ekleyin →</a>
          </p>
        ) : (
          <div className="overflow-x-auto">
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
                    <td className="text-right font-medium">{p.units_moved}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
