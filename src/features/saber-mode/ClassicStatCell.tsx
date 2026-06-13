// Design Ref: kia-fan-service §5.3 (FR-04) — 클래식 스탯 블러 셀.
// 세이버 온리 모드(hidden)면 blur(4px)+🔒, 토글 ON이면 공개.
// 전환은 CSS transition만 사용 (JS 재연산 0 — NFR).

'use client';

import { useSaberMode } from './SaberModeContext';

import type { CSSProperties, ReactNode } from 'react';

export interface ClassicStatCellProps {
  children: ReactNode;
  /** 자물쇠 아이콘 표시 여부 (좁은 카드에서는 끔). */
  showLock?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function ClassicStatCell({
  children,
  showLock = true,
  className,
  style,
}: ClassicStatCellProps) {
  const { hidden } = useSaberMode();

  return (
    <span
      className={className}
      aria-hidden={hidden || undefined}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 3,
        ...style,
      }}
    >
      <span
        style={{
          filter: hidden ? 'blur(4px)' : 'blur(0)',
          userSelect: hidden ? 'none' : 'auto',
          transition: 'filter 0.3s ease',
        }}
      >
        {children}
      </span>
      {hidden && showLock ? (
        <span
          aria-hidden
          className="mso"
          style={{ fontSize: 11, color: 'var(--magu-text-3)', lineHeight: 1 }}
        >
          lock
        </span>
      ) : null}
    </span>
  );
}
