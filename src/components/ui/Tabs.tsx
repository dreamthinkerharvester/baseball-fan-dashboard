// Design Ref: §5.4 — 탭 컴포넌트 (Schedule range, PlayerModal Season/Career).
// 자체 구현 (shadcn/ui dependency 없이) — 단순한 접근성 보장.

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
}

export function Tabs<TValue extends string = string>({
  items,
  value,
  defaultValue,
  onChange,
  className,
  ariaLabel,
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

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={clsx('inline-flex gap-1 rounded-button bg-bg-panel p-1', className)}
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
            className={clsx(
              'min-h-[36px] rounded-button px-3 text-body font-medium transition-colors',
              active
                ? 'bg-grade-elite text-text-primary'
                : 'text-text-muted hover:text-text-primary',
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
