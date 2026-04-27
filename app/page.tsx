'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import Section from '@/components/ui/Section';
import StatCard from '@/components/ui/StatCard';
import EmptyState from '@/components/ui/EmptyState';
import Sparkline from '@/components/Sparkline';
import BarChart from '@/components/BarChart';
import Tag from '@/components/ui/Tag';
import { api } from '@/lib/api';
import { toast } from '@/store/toast';
import { formatCurrency } from '@/lib/format';
import type {
  DailySnapshot,
  DashboardStats,
  TopProduct,
  TrendPoint,
} from '@/types/api';

const QUICK_LINKS: Array<{ href: string; label: string; icon: string; tone: string }> = [
  { href: '/sell',      label: 'Hızlı Satış',    icon: '🍔', tone: 'bg-brand-50 text-brand-700' },
  { href: '/products',  label: 'Yeni Malzeme',   icon: '📦', tone: 'bg-blue-50 text-blue-700'   },
  { href: '/movements', label: 'Hareket Ekle',   icon: '🔄', tone: 'bg-amber-50 text-amber-700' },
  { href: '/waste',     label: 'Zayiat Kaydet',  icon: '🗑️', tone: 'bg-red-50 text-red-700'    },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [top, setTop] = useState<TopProduct[]>([]);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [daily, setDaily] = useState<DailySnapshot[]>([]);

  useEffect(() => {
    Promise.all([
      api.get<DashboardStats>('/reports/dashboard'),
      api.get<TopProduct[]>('/reports/top-products?movement=out&limit=8'),
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

  const todayRevenue = daily.reduce((s, d) => s + d.revenue, 0);
  const todaySales   = daily.reduce((s, d) => s + d.sales_count, 0);
  const todayMargin  = daily.reduce((s, d) => s + d.margin, 0);
  const todayWaste   = daily.reduce((s, d) => s + d.waste_value, 0);
  const fortnightRev = trend.reduce((s, p) => s + p.revenue, 0);
  const marginPct = todayRevenue > 0 ? (todayMargin / todayRevenue) * 100 : 0;

  const today = new Date().toLocaleDateString('tr-TR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <>
      <PageHeader
        title="Pano"
        subtitle={today}
        meta={
          <div className="flex flex-wrap gap-2">
            <Tag tone="brand" icon="📅">Bugün</Tag>
            <Tag tone="slate">Tüm şubeler</Tag>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {QUICK_LINKS.map((q) => (
          <Link key={q.href} href={q.href} className="card-interactive flex items-center gap-3 p-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${q.tone}`}>
              {q.icon}
            </div>
            <div>
              <div className="text-sm font-medium text-ink-900">{q.label}</div>
              <div className="text-[11px] text-ink-500">→ Aç</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Bugün Ciro"
          value={formatCurrency(todayRevenue)}
          tone="brand"
          icon="💰"
          hint={`${todaySales} sipariş`}
        />
        <StatCard
          label="Bugün Marj"
          value={formatCurrency(todayMargin)}
          tone="success"
          icon="📈"
          hint={todayRevenue > 0 ? `%${marginPct.toFixed(1)} oran` : '—'}
        />
        <StatCard label="14 Gün Ciro" value={formatCurrency(fortnightRev)} icon="📅" hint="Toplam" />
        <StatCard
          label="Bugün Zayiat"
          value={formatCurrency(todayWaste)}
          tone={todayWaste > 0 ? 'warning' : 'default'}
          icon="🗑️"
          hint={todayWaste > 0 ? 'İncelemeye değer' : 'Sorun yok'}
        />
      </div>

      <Section
        title="Son 14 Gün Cirosu"
        description="Günlük gelir trendi"
        actions={<Tag tone="brand">{formatCurrency(fortnightRev)}</Tag>}
        className="mb-6"
      >
        {trend.length === 0 ? (
          <EmptyState icon="📈" title="Henüz satış yok" description="İlk satışınızdan sonra trend burada belirir." />
        ) : (
          <Sparkline values={trend.map((p) => p.revenue)} labels={trend.map((p) => p.date)} />
        )}
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Section title="Şubelerin Bugünü" description="Bugünkü ciro performansı">
          {daily.length === 0 ? (
            <p className="text-sm text-ink-500">Şube tanımlı değil.</p>
          ) : (
            <BarChart
              rows={daily.map((d) => ({
                label: d.warehouse_code ?? `#${d.warehouse_id}`,
                value: d.revenue,
              }))}
              formatValue={(n) => formatCurrency(n, '₺', 0)}
            />
          )}
        </Section>

        <Section title="En Çok Çıkan Malzeme" description="Son hareketlere göre">
          {top.length === 0 ? (
            <EmptyState icon="📦" title="Hareket yok" description="İlk satış veya stok girişinden sonra burası dolar." />
          ) : (
            <BarChart rows={top.map((p) => ({ label: p.name, value: p.units_moved }))} />
          )}
        </Section>
      </div>

      <Section title="Envanter Durumu" description="Stok özet metrikleri">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {!stats ? (
            Array.from({ length: 4 }).map((_, i) => <StatCard key={i} label="" value="" loading />)
          ) : (
            <>
              <StatCard label="Toplam Malzeme" value={stats.total_products} icon="📦" />
              <StatCard
                label="Düşük Stok"
                value={stats.low_stock_count}
                tone={stats.low_stock_count > 0 ? 'warning' : 'success'}
                hint={stats.low_stock_count > 0 ? 'Tedarik gerekli' : 'Sorun yok'}
                icon="⚠️"
              />
              <StatCard label="Stok Değeri" value={formatCurrency(stats.total_stock_value)} icon="💎" />
              <StatCard label="Şube" value={stats.total_warehouses} icon="🏪" />
            </>
          )}
        </div>
      </Section>
    </>
  );
}
