'use client';

import { useToastStore } from '@/store/toast';

const KIND_STYLES: Record<string, string> = {
  success: 'bg-white text-green-900 ring-green-200 border-l-4 border-l-green-500',
  error:   'bg-white text-red-900 ring-red-200 border-l-4 border-l-red-500',
  info:    'bg-white text-ink-900 ring-ink-200 border-l-4 border-l-ink-400',
};

const KIND_ICONS: Record<string, string> = {
  success: '✅',
  error: '⚠️',
  info: 'ℹ️',
};

export default function Toaster() {
  const { toasts, dismiss } = useToastStore();
  return (
    <div className="pointer-events-none fixed bottom-24 md:bottom-4 right-4 z-[100] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`pointer-events-auto rounded-lg ring-1 px-4 py-3 shadow-pop text-sm flex items-start gap-3 animate-slide-in-right ${KIND_STYLES[t.kind]}`}
        >
          <span className="text-lg leading-none">{KIND_ICONS[t.kind]}</span>
          <span className="flex-1 leading-relaxed">{t.message}</span>
          <button
            onClick={() => dismiss(t.id)}
            className="text-ink-400 hover:text-ink-700 leading-none text-xl -mt-0.5"
            aria-label="Kapat"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
