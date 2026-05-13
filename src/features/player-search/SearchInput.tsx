// Phase 1.5 — Debounced search input.

'use client';

import { useEffect, useState } from 'react';

import clsx from 'clsx';

export interface SearchInputProps {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  /** debounce 지연 (ms). 기본 200ms. */
  debounceMs?: number;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = '선수명을 입력하세요',
  debounceMs = 200,
  className,
}: SearchInputProps) {
  const [local, setLocal] = useState(value);

  // 외부 value(필터 reset 등)와 동기화
  useEffect(() => {
    setLocal(value);
  }, [value]);

  // local 변경 → debounce 후 onChange
  useEffect(() => {
    if (local === value) return;
    const t = setTimeout(() => onChange(local), debounceMs);
    return () => clearTimeout(t);
  }, [local, value, onChange, debounceMs]);

  return (
    <label className={clsx('relative block', className)}>
      <span className="sr-only">선수명 검색</span>
      <span
        aria-hidden
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
      >
        🔍
      </span>
      <input
        type="search"
        inputMode="search"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
        className={clsx(
          'h-11 w-full rounded-button border border-text-dim/30 bg-bg-card pl-9 pr-3',
          'text-body text-text-primary placeholder:text-text-muted',
          'focus:border-grade-elite focus:outline-none focus:ring-2 focus:ring-grade-elite/30',
        )}
      />
    </label>
  );
}
