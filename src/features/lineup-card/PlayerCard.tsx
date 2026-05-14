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
        'group relative flex flex-col items-stretch justify-between overflow-hidden border-2 text-text-primary',
        'rounded-card transition-transform duration-150 hover:scale-[1.04] active:scale-100 focus-visible:outline-grade-elite',
        variant === 'starter'
          ? 'h-[140px] w-full sm:h-[160px]'
          : 'h-[180px] w-full min-w-[110px] sm:h-[210px]',
        className,
      )}
    >
      {/* Background photo (full-bleed, sharp) */}
      {player?.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={player.photoUrl}
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-top opacity-95 transition-transform group-hover:scale-105"
          loading="lazy"
        />
      ) : (
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-bg-card to-bg-cardEnd"
          aria-hidden
        />
      )}
      {/* Gradient overlay for legibility (bottom-heavy so face stays clear) */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black via-black/85 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-black/70 to-transparent"
        aria-hidden
      />

      {/* 헤더: 등급 배지 + 타순 + 등번호 (작은 칩) */}
      <header className="relative z-10 flex w-full items-start justify-between gap-1 px-1.5 pt-1.5">
        <div className="flex items-center gap-1">
          <GradeBadge grade={slot.grade} size="sm" />
          <span
            className="rounded bg-black/70 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white shadow-lg"
            aria-hidden
          >
            {orderLabel}
          </span>
        </div>
        <span
          className="rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white/90 shadow-lg"
          aria-hidden
        >
          #{player?.uniformNumber ?? '?'}
        </span>
      </header>

      {/* Filler — sapphire space so photo dominates */}
      <div className="relative z-0 flex-1" aria-hidden />

      {/* 푸터: 선수명 + 포지션 + 스탯 */}
      <footer className="relative z-10 flex w-full flex-col items-center gap-0.5 px-2 pb-2 text-center">
        <span className="line-clamp-1 text-base font-bold text-white drop-shadow-md sm:text-lg">
          {player?.name ?? '—'}
        </span>
        <div className="flex items-center gap-2">
          <span
            className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase leading-none text-white"
            style={team ? { backgroundColor: team.primaryColor } : { backgroundColor: '#444' }}
          >
            {slot.position}
          </span>
          {keyStat ? (
            <span
              className="text-xs font-bold drop-shadow-md"
              style={{ color: `var(--grade-${slot.grade})` }}
            >
              {keyStat}
            </span>
          ) : null}
        </div>
      </footer>
    </button>
  );
}

