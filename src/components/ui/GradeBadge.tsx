// Design Ref: §5.4 — 등급 텍스트 배지. 색상 + 텍스트 *둘 다* 표기 (WCAG 색맹 안전).

import clsx from 'clsx';

import { GRADE_LABELS } from '@/lib/constants';

import type { Grade } from '@/types';

export interface GradeBadgeProps {
  grade: Grade;
  size?: 'sm' | 'md';
  className?: string;
}

const SIZE_MAP: Record<NonNullable<GradeBadgeProps['size']>, string> = {
  sm: 'text-[9px] px-1 py-[1px] tracking-wide',
  md: 'text-[11px] px-1.5 py-[2px] tracking-wider',
};

const GRADE_BG_CLASS: Record<Grade, string> = {
  elite: 'bg-grade-elite/15 text-grade-elite border-grade-elite/40',
  rare: 'bg-grade-rare/15 text-grade-rare border-grade-rare/40',
  special: 'bg-grade-special/15 text-grade-special border-grade-special/40',
  normal: 'bg-grade-normal/15 text-grade-normal border-grade-normal/40',
};

export function GradeBadge({ grade, size = 'sm', className }: GradeBadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-badge border font-bold uppercase',
        SIZE_MAP[size],
        GRADE_BG_CLASS[grade],
        className,
      )}
      data-grade={grade}
      aria-label={`등급 ${GRADE_LABELS[grade]}`}
    >
      {GRADE_LABELS[grade]}
    </span>
  );
}
