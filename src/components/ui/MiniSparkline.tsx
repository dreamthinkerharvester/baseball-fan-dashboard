// Design Ref: §5.4 PlayerModal — 최근 10경기 막대 차트. CSS만, 라이브러리 X (200KB 예산 보호).

import clsx from 'clsx';

import type { Grade } from '@/types';

export interface MiniSparklineProps {
  values: ReadonlyArray<number>;
  /** 등급에 따라 막대 색상 결정. */
  grade?: Grade;
  /** 라벨 (스크린리더용). */
  ariaLabel: string;
  className?: string;
  height?: number;
}

const GRADE_BAR: Record<Grade, string> = {
  elite: 'bg-grade-elite',
  rare: 'bg-grade-rare',
  special: 'bg-grade-special',
  normal: 'bg-grade-normal',
};

export function MiniSparkline({
  values,
  grade = 'normal',
  ariaLabel,
  className,
  height = 32,
}: MiniSparklineProps) {
  const max = values.reduce((m, v) => (v > m ? v : m), 0) || 1;
  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className={clsx('flex items-end gap-[2px]', className)}
      style={{ height }}
    >
      {values.length === 0 ? (
        <span className="text-caption text-text-dim">데이터 없음</span>
      ) : (
        values.map((v, i) => {
          const hPct = Math.max(4, (v / max) * 100);
          return (
            <span
              key={i}
              className={clsx('w-2 rounded-sm', GRADE_BAR[grade])}
              style={{ height: `${hPct}%`, opacity: 0.6 + (v / max) * 0.4 }}
              title={String(v)}
            />
          );
        })
      )}
    </div>
  );
}
