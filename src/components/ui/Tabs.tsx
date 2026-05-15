// Design Ref: §5.4 + m3-comp tabs primary indicator.
// 자체 구현 (shadcn/ui dependency 없이) — 접근성 보장 + M3 active 언더라인.

'use client';

import { useId, useState } from 'react';

import clsx from 'clsx';

export interface TabItem<TValue extends string = string> {
  value: TValue;
  label: string;
}

export interface TabsProps<TValue extends string = string> {
  items: ReadonlyArray<TabItem<TValue>>;
  value?: TValue;
  defaultValue?: TValue;
  onChange?: (value: TValue) => void;
  className?: string;
  ariaLabel?: string;
  /** "primary" = M3 underline tabs (default), "segmented" = pill segmented control. */
  variant?: 'primary' | 'segmented';
}

export function Tabs<TValue extends string = string>({
  items,
  value,
  defaultValue,
  onChange,
  className,
  ariaLabel,
  variant = 'segmented',
}: TabsProps<TValue>) {
  const id = useId();
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState<TValue>(
    defaultValue ?? items[0]?.value ?? ('' as TValue),
  );
  const current = isControlled ? value : internal;

  function select(v: TValue) {
    if (!isControlled) setInternal(v);
    onChange?.(v);
  }

  if (variant === 'primary') {
    return (
      <div role="tablist" aria-label={ariaLabel} className={clsx('m3-tabs', className)}>
        {items.map((item) => {
          const active = item.value === current;
          return (
            <button
              key={item.value}
              type="button"
              role="tab"
              id={`${id}-${item.value}`}
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              onClick={() => select(item.value)}
              className={active ? 'active' : ''}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    );
  }

  // Segmented variant — small inline control (use for Schedule range, Career filter)
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={clsx('inline-flex', className)}
      style={{
        gap: 2,
        padding: 3,
        borderRadius: 9999,
        background: 'var(--md-sys-color-surface-container-high)',
      }}
    >
      {items.map((item) => {
        const active = item.value === current;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            id={`${id}-${item.value}`}
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => select(item.value)}
            style={{
              minHeight: 32,
              padding: '0 12px',
              borderRadius: 9999,
              border: 'none',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: 0.1,
              transition: 'background var(--md-sys-motion-duration-short2) var(--md-sys-motion-easing-standard)',
              background: active ? 'var(--md-sys-color-primary-container)' : 'transparent',
              color: active
                ? 'var(--md-sys-color-on-primary-container)'
                : 'var(--md-sys-color-on-surface-variant)',
            }}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
