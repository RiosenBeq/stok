import { ReactNode } from 'react';

type Tone = 'green' | 'red' | 'amber' | 'blue' | 'slate' | 'brand';

interface Props {
  tone?: Tone;
  children: ReactNode;
  icon?: ReactNode;
}

const TONE: Record<Tone, string> = {
  green: 'bg-green-50 text-green-700 ring-green-200',
  red:   'bg-red-50 text-red-700 ring-red-200',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200',
  blue:  'bg-blue-50 text-blue-700 ring-blue-200',
  slate: 'bg-ink-50 text-ink-700 ring-ink-200',
  brand: 'bg-brand-50 text-brand-700 ring-brand-200',
};

export default function Tag({ tone = 'slate', children, icon }: Props) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${TONE[tone]}`}>
      {icon}
      {children}
    </span>
  );
}
