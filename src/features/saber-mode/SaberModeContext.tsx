// Design Ref: kia-fan-service §5.3 (FR-04) — 세이버 온리 모드 전역 상태.
// hidden=true(디폴트) = 클래식 스탯 블러. localStorage `kia_saber_mode` 동기화.

'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import { getSaberMode, setSaberMode } from '@/lib/storage';

interface SaberModeContextValue {
  /** true = 클래식 스탯 숨김 (세이버 온리). */
  hidden: boolean;
  toggle: () => void;
}

const SaberModeContext = createContext<SaberModeContextValue | null>(null);

export function useSaberMode(): SaberModeContextValue {
  const ctx = useContext(SaberModeContext);
  if (!ctx) throw new Error('useSaberMode must be used within <SaberModeProvider>');
  return ctx;
}

export function SaberModeProvider({ children }: { children: ReactNode }) {
  // SSR 일치를 위해 디폴트(숨김)로 시작 → mount 후 localStorage 반영
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    setHidden(getSaberMode());
  }, []);

  const toggle = useCallback(() => {
    setHidden((prev) => {
      const next = !prev;
      setSaberMode(next);
      return next;
    });
  }, []);

  return (
    <SaberModeContext.Provider value={{ hidden, toggle }}>{children}</SaberModeContext.Provider>
  );
}
