// Design Ref: §5.4 Page 2 ⭐ — 핵심 UX. 단일 카드:
//   - 등급 색상 보더 + ELITE/RARE/SPECIAL에 글로우 (NORMAL 제외)
//   - 등급 텍스트 배지 (색상만에 의존하지 않음, WCAG 색맹 안전)
//   - 타순 번호 / 선수명 / 포지션 / 대표 스탯 1개
//   - 클릭 → 모달 트리거 (onClick 전달)
//   - 터치 타깃 ≥ 44px 보장

'use client';

import clsx from 'clsx';

import { GradeBadge } from '@/components/ui/GradeBadge';
import { TEAMS } from '@/lib/constants';

import type { LineupSlot, Player } from '@/types';

export interface PlayerCardProps {
  slot: LineupSlot;
  player: Player | null;
  /** 카드 변형: 'starter' = 가로형 큰 카드 (선발 투수), 'batter' = 정사각형. */
  variant?: 'starter' | 'batter';
  /** 대표 스탯 (예: "OPS .892" 또는 "ERA 3.21"). null이면 라벨 숨김. */
  keyStat?: string | null;
  onClick?: () => void;
  className?: string;
}

export function PlayerCard({
  slot,
  player,
  variant = 'batter',
  keyStat = null,
  onClick,
  className,
}: PlayerCardProps) {
  const team = player ? TEAMS[player.teamCode] : null;
  const orderLabel =
    slot.battingOrder === 0 ? 'P' : `${slot.battingOrder}`;

  return (
    <button
      type="button"
      onClick={onClick}
      data-grade={slot.grade}
      data-position={slot.position}
      aria-label={
        player
          ? `${orderLabel}번 ${player.name} ${slot.position}, 등급 ${slot.grade}, ${slot.gradeBasis}`
          : `${orderLabel}번 슬롯`
      }
      title={slot.gradeBasis}
      className={clsx(
        'group relative flex flex-col items-center justify-between border-2 bg-gradient-to-br from-bg-card to-bg-cardEnd text-text-primary',
        'rounded-card transition-transform duration-150 hover:scale-[1.04] active:scale-100 focus-visible:outline-grade-elite',
        variant === 'starter'
          ? 'h-[120px] w-full px-3 py-2 sm:h-[140px]'
          : 'h-[140px] w-full min-w-[100px] px-2 py-2 sm:h-[170px]',
        className,
      )}
    >
      {/* 헤더: 등급 배지 + 타순 번호 */}
      <header className="flex w-full items-start justify-between">
        <GradeBadge grade={slot.grade} size="sm" />
        <span
          className="text-caption font-bold text-text-muted"
          aria-hidden
        >
          {orderLabel}
        </span>
      </header>

      {/* 중앙: 선수 사진 OR 포지션 아바타 */}
      <div
        className={clsx(
          'flex items-center justify-center',
          variant === 'starter' ? 'h-12 w-12' : 'h-12 w-12 sm:h-16 sm:w-16',
        )}
        aria-hidden
      >
        {player?.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={player.photoUrl}
            alt=""
            className="h-full w-full rounded-full object-cover"
            loading="lazy"
          />
        ) : (
          <PositionAvatar position={slot.position} />
        )}
      </div>

      {/* 푸터: 선수명 + 포지션 + 스탯 */}
      <footer className="flex w-full flex-col items-center text-center">
        <span className="line-clamp-1 text-body font-semibold text-text-primary">
          {player?.name ?? '—'}
        </span>
        <span
          className="text-caption text-text-muted"
          style={team ? { color: team.primaryColor } : undefined}
        >
          {slot.position}
        </span>
        {keyStat ? (
          <span
            className="mt-0.5 text-caption font-bold"
            style={{ color: `var(--grade-${slot.grade})` }}
          >
            {keyStat}
          </span>
        ) : null}
      </footer>
    </button>
  );
}

/** SVG-free position icon (글자 기반). 사진 없는 선수의 폴백. */
function PositionAvatar({ position }: { position: string }) {
  return (
    <span
      className="flex h-full w-full items-center justify-center rounded-full bg-bg-deep text-heading font-bold text-text-muted"
      aria-hidden
    >
      {position}
    </span>
  );
}
