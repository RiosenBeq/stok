'use client';

import { useToastStore } from '@/store/toast';

const KIND_STYLES: Record<string, string> = {
  success: 'bg-green-50 text-green-900 ring-green-200',
  error: 'bg-red-50 text-red-900 ring-red-200',
  info: 'bg-slate-50 text-slate-900 ring-slate-200',
};

const KIND_ICONS: Record<string, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
};

export default function Toaster() {
  const { toasts, dismiss } = useToastStore();
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`pointer-events-auto rounded-md ring-1 px-4 py-3 shadow-md text-sm flex items-start gap-2 animate-in slide-in-from-right ${KIND_STYLES[t.kind]}`}
        >
          <span className="font-bold">{KIND_ICONS[t.kind]}</span>
          <span className="flex-1">{t.message}</span>
          <button
            onClick={() => dismiss(t.id)}
            className="text-current/60 hover:text-current"
            aria-label="Kapat"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
