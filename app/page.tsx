'use client';

import { useEffect, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import Sparkline from '@/components/Sparkline';
import BarChart from '@/components/BarChart';
import { api } from '@/lib/api';
import { toast } from '@/store/toast';
import type {
  DailySnapshot,
  DashboardStats,
  TopProduct,
  TrendPoint,
} from '@/types/api';

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
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [daily, setDaily] = useState<DailySnapshot[]>([]);

  useEffect(() => {
    Promise.all([
      api.get<DashboardStats>('/reports/dashboard'),
      api.get<TopProduct[]>('/reports/top-products?movement=out&limit=10'),
      api.get<TrendPoint[]>('/sales/trend?days=14'),
      api.get<DailySnapshot[]>('/sales/daily'),
    ])
      .then(([s, t, tr, d]) => {
        setStats(s);
        setTop(t);
        setTrend(tr);
        setDaily(d);
      })
      .catch((e: Error) => toast.error(e.message));
  }, []);

  const todayRevenue = daily.reduce((sum, d) => sum + d.revenue, 0);
  const todaySales = daily.reduce((sum, d) => sum + d.sales_count, 0);
  const todayMargin = daily.reduce((sum, d) => sum + d.margin, 0);
  const todayWaste = daily.reduce((sum, d) => sum + d.waste_value, 0);

  return (
    <>
      <PageHeader title="Pano" subtitle="Genel sistem durumu, satış ve stok metrikleri" />

      {/* Today's metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <StatCard label="Bugün Ciro" value={`${todayRevenue.toFixed(2)} ₺`} accent="text-brand-700" icon="💰" />
        <StatCard label="Bugün Sipariş" value={todaySales} icon="🧾" />
        <StatCard label="Bugün Marj" value={`${todayMargin.toFixed(2)} ₺`} accent="text-green-700" icon="📈" />
        <StatCard label="Bugün Zayiat" value={`${todayWaste.toFixed(2)} ₺`} accent={todayWaste > 0 ? 'text-amber-700' : 'text-slate-700'} icon="🗑️" />
      </div>

      {/* Sales trend */}
      <section className="card mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold">Son 14 Gün Cirosu</h2>
          <span className="text-xs text-slate-500">
            {trend.reduce((s, p) => s + p.revenue, 0).toFixed(2)} ₺ toplam
          </span>
        </div>
        <Sparkline
          values={trend.map((p) => p.revenue)}
          labels={trend.map((p) => p.date)}
        />
      </section>

      {/* Inventory metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {!stats ? (
          Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
        ) : (
          <>
            <StatCard label="Toplam Malzeme" value={stats.total_products} icon="📦" />
            <StatCard
              label="Düşük Stok"
              value={stats.low_stock_count}
              accent={stats.low_stock_count > 0 ? 'text-amber-600' : 'text-green-600'}
              hint={stats.low_stock_count > 0 ? 'Tedarik gerekli' : 'Sorun yok'}
              icon="⚠️"
            />
            <StatCard label="Stok Değeri" value={`${stats.total_stock_value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`} icon="💎" />
            <StatCard label="Şube" value={stats.total_warehouses} icon="🏪" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="card">
          <h2 className="font-semibold mb-3">Şubelerin Bugünü</h2>
          {daily.length === 0 ? (
            <p className="text-sm text-slate-500">Şube yok.</p>
          ) : (
            <BarChart
              rows={daily.map((d) => ({
                label: d.warehouse_code ?? `#${d.warehouse_id}`,
                value: d.revenue,
              }))}
              formatValue={(n) => `${n.toFixed(0)} ₺`}
            />
          )}
        </section>

        <section className="card">
          <h2 className="font-semibold mb-3">En Çok Çıkan 10 Malzeme</h2>
          {top.length === 0 ? (
            <p className="text-sm text-slate-500">
              Henüz hareket yok. <a href="/sell" className="text-brand-700 hover:underline">İlk satışı yapın →</a>
            </p>
          ) : (
            <BarChart rows={top.map((p) => ({ label: p.name, value: p.units_moved }))} />
          )}
        </section>
      </div>
    </>
  );
}
