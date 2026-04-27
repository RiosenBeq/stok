'use client';

import { ReactNode } from 'react';

interface Props {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
  count?: number;
}

export default function FilterChip({ active, onClick, children, count }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all
                  ring-1 ring-inset
                  ${active
                    ? 'bg-brand-600 text-white ring-brand-600 shadow-soft'
                    : 'bg-white text-ink-700 ring-ink-200 hover:bg-ink-50 hover:ring-ink-300'}`}
    >
      {children}
      {count != null && (
        <span className={`text-[10px] font-semibold rounded-full px-1.5 ${active ? 'bg-white/20' : 'bg-ink-100'}`}>
          {count}
        </span>
      )}
    </button>
  );
}
