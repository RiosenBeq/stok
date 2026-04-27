'use client';

import { ReactNode } from 'react';

/**
 * A "row card" used to render a list item on mobile in place of a table row.
 * Pair it with a desktop table inside `<div className="hidden md:block">`.
 */
export function RowCard({
  title,
  subtitle,
  meta,
  badges,
  actions,
  onClick,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  meta?: ReactNode;
  badges?: ReactNode;
  actions?: ReactNode;
  onClick?: () => void;
}) {
  return (
    <div
      className={`card p-3 ${onClick ? 'cursor-pointer active:bg-slate-50' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="font-medium text-slate-900 truncate">{title}</div>
          {subtitle && (
            <div className="text-xs text-slate-500 mt-0.5 truncate">{subtitle}</div>
          )}
          {meta && <div className="mt-2 text-sm text-slate-700">{meta}</div>}
        </div>
        {badges && <div className="flex-shrink-0 flex flex-col items-end gap-1">{badges}</div>}
      </div>
      {actions && <div className="mt-2 flex justify-end gap-3 text-xs">{actions}</div>}
    </div>
  );
}
