'use client';

interface Props {
  rows: Array<{ label: string; value: number }>;
  formatValue?: (n: number) => string;
}

export default function BarChart({ rows, formatValue }: Props) {
  if (rows.length === 0) return <div className="text-sm text-slate-400">Veri yok.</div>;
  const max = Math.max(...rows.map((r) => r.value), 1);
  const fmt = formatValue ?? ((n) => n.toLocaleString('tr-TR'));
  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={i} className="flex items-center gap-3 text-sm">
          <div className="w-32 truncate text-slate-700">{r.label}</div>
          <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-brand-500"
              style={{ width: `${(r.value / max) * 100}%` }}
            />
          </div>
          <div className="w-20 text-right tabular-nums font-medium">{fmt(r.value)}</div>
        </div>
      ))}
    </div>
  );
}
