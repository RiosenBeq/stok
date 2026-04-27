'use client';

import { ReactNode, useEffect } from 'react';

export default function Modal({
  open,
  title,
  onClose,
  children,
  size = 'md',
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  size?: 'md' | 'lg';
}) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const widthClass = size === 'lg' ? 'md:max-w-2xl' : 'md:max-w-lg';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-slate-900/40 md:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={`w-full ${widthClass} bg-white shadow-xl
                    rounded-t-2xl md:rounded-lg
                    max-h-[92vh] md:max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b px-5 py-3 sticky top-0 bg-white">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-2xl leading-none w-8 h-8 inline-flex items-center justify-center"
            aria-label="Kapat"
          >
            ×
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
