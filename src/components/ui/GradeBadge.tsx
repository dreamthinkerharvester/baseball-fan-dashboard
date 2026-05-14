// Design Ref: §5.4 + m3-comp tier chips — 색상 + 텍스트 + 아이콘 (WCAG 색맹 안전, Primary↔RARE 충돌 회피).

import clsx from 'clsx';

import { GRADE_LABELS } from '@/lib/constants';

import type { Grade } from '@/types';

export interface GradeBadgeProps {
  grade: Grade;
  size?: 'sm' | 'md';
  className?: string;
  showIcon?: boolean;
}

const SIZE_MAP: Record<NonNullable<GradeBadgeProps['size']>, string> = {
  sm: 'text-[9px] px-1 py-[1px] tracking-wide gap-[2px]',
  md: 'text-[11px] px-2 py-[2px] tracking-wider gap-1',
};

const TIER_CLASS: Record<Grade, string> = {
  elite: 'tier-elite',
  rare: 'tier-rare',
  special: 'tier-special',
  normal: 'tier-normal',
};

const TIER_ICON: Record<Grade, string> = {
  elite: 'star',
  rare: 'diamond',
  special: 'bolt',
  normal: 'circle',
};

export function GradeBadge({ grade, size = 'sm', className, showIcon = true }: GradeBadgeProps) {
  const iconSize = size === 'sm' ? 10 : 12;
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded font-bold uppercase',
        SIZE_MAP[size],
        TIER_CLASS[grade],
        className,
      )}
      data-grade={grade}
      aria-label={`등급 ${GRADE_LABELS[grade]}`}
    >
      {showIcon && (
        <span
          className="mso filled"
          aria-hidden
          style={{ fontSize: iconSize, lineHeight: 1 }}
        >
          {TIER_ICON[grade]}
        </span>
      )}
      {GRADE_LABELS[grade]}
    </span>
  );
}
