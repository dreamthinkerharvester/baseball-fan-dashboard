// Phase 1.5 — Debounced search input. M3 search-bar pill.

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

  useEffect(() => {
    setLocal(value);
  }, [value]);

  useEffect(() => {
    if (local === value) return;
    const t = setTimeout(() => onChange(local), debounceMs);
    return () => clearTimeout(t);
  }, [local, value, onChange, debounceMs]);

  return (
    <label className={clsx('m3-search-bar', className)}>
      <span className="sr-only">선수명 검색</span>
      <span className="mso" aria-hidden style={{ fontSize: 20 }}>
        search
      </span>
      <input
        type="search"
        inputMode="search"
        enterKeyHint="search"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
      />
      {local && (
        <button
          type="button"
          onClick={() => setLocal('')}
          className="m3-btn m3-btn-icon"
          style={{ width: 32, height: 32 }}
          aria-label="검색어 지우기"
        >
          <span className="mso" style={{ fontSize: 18 }}>close</span>
        </button>
      )}
    </label>
  );
}
