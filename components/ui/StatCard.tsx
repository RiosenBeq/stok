import { ReactNode } from 'react';

type Tone = 'default' | 'success' | 'warning' | 'danger' | 'brand';

interface Props {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: Tone;
  loading?: boolean;
}

const TONE: Record<Tone, string> = {
  default: 'text-ink-900',
  success: 'text-green-700',
  warning: 'text-amber-600',
  danger:  'text-red-600',
  brand:   'text-brand-700',
};

export default function StatCard({ label, value, hint, icon, tone = 'default', loading }: Props) {
  if (loading) {
    return (
      <div className="card">
        <div className="skeleton h-3 w-20 mb-3" />
        <div className="skeleton h-7 w-16" />
      </div>
    );
  }
  return (
    <div className="card animate-slide-up">
      <div className="flex items-start justify-between gap-2">
        <div className="text-[11px] uppercase tracking-wider text-ink-500 font-medium">{label}</div>
        {icon && <div className="text-lg opacity-60 leading-none">{icon}</div>}
      </div>
      <div className={`mt-2 text-2xl font-semibold tabular-nums ${TONE[tone]}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-ink-500">{hint}</div>}
    </div>
  );
}
