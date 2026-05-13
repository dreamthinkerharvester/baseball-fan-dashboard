// Design Ref: §5.4 OfflineBanner / 에러 토스트. 단순 큐 — 여러 라이브러리 의존 X.

'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import clsx from 'clsx';

interface ToastItem {
  id: number;
  text: string;
  severity: 'info' | 'success' | 'error';
  expiresAt: number;
}

interface ToastContextValue {
  show: (text: string, severity?: ToastItem['severity'], durationMs?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const show = useCallback<ToastContextValue['show']>(
    (text, severity = 'info', durationMs = 3500) => {
      const id = Date.now() + Math.random();
      const expiresAt = Date.now() + durationMs;
      setItems((prev) => [...prev, { id, text, severity, expiresAt }]);
    },
    [],
  );

  // expiry 정리
  useEffect(() => {
    if (items.length === 0) return;
    const t = setInterval(() => {
      const now = Date.now();
      setItems((prev) => prev.filter((i) => i.expiresAt > now));
    }, 500);
    return () => clearInterval(t);
  }, [items.length]);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div
        role="region"
        aria-live="polite"
        aria-label="알림"
        className="pointer-events-none fixed bottom-4 left-1/2 z-50 flex w-[min(92vw,420px)] -translate-x-1/2 flex-col gap-2"
      >
        {items.map((i) => (
          <div
            key={i.id}
            role="status"
            className={clsx(
              'pointer-events-auto rounded-button border px-3 py-2 text-body shadow-lg',
              i.severity === 'error'
                ? 'border-grade-rare/40 bg-grade-rare/10 text-grade-rare'
                : i.severity === 'success'
                  ? 'border-grade-elite/40 bg-grade-elite/10 text-grade-elite'
                  : 'border-text-dim/30 bg-bg-panel text-text-primary',
            )}
          >
            {i.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
