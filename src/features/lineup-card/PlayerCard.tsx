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
      {/* Background photo (full-bleed, dimmed) */}
      {player?.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={player.photoUrl}
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-40 transition-opacity group-hover:opacity-55"
          loading="lazy"
        />
      ) : (
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-bg-card to-bg-cardEnd"
          aria-hidden
        />
      )}
      {/* Gradient overlay for legibility */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/30"
        aria-hidden
      />

      {/* 헤더: 등급 배지 + 등번호 (uniform number) */}
      <header className="relative z-10 flex w-full items-start justify-between px-2 pt-2">
        <GradeBadge grade={slot.grade} size="sm" />
        <span
          className="rounded bg-black/50 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white/80"
          aria-hidden
        >
          #{player?.uniformNumber ?? orderLabel}
        </span>
      </header>

      {/* 타순 번호 (중앙 큰 글자) */}
      <div className="relative z-10 flex flex-1 items-center justify-center" aria-hidden>
        <span className="text-5xl font-black leading-none text-white/95 drop-shadow-lg sm:text-6xl">
          {orderLabel}
        </span>
      </div>

      {/* 푸터: 선수명 + 포지션 + 스탯 */}
      <footer className="relative z-10 flex w-full flex-col items-center gap-0.5 bg-black/50 px-2 py-2 text-center backdrop-blur-sm">
        <span className="line-clamp-1 text-body font-semibold text-white">
          {player?.name ?? '—'}
        </span>
        <div className="flex items-center gap-2">
          <span
            className="text-caption font-bold"
            style={team ? { color: team.primaryColor } : undefined}
          >
            {slot.position}
          </span>
          {keyStat ? (
            <span
              className="text-caption font-bold"
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

