// Magu Magu 트레이딩 카드 — 라인업 단일 카드.
// 등급별 테두리(레전드 골드glow / A 골드 / B 실버 / C 브론즈) + SD 일러스트 face + 잔디 배경.

'use client';

import clsx from 'clsx';

import { TEAMS } from '@/lib/constants';
import { playerByLineupSlot, tile } from '@/lib/assets-magu';

import type { LineupSlot, Player } from '@/types';

export interface PlayerCardProps {
  slot: LineupSlot;
  player: Player | null;
  /** 카드 변형: 'starter' = 가로형 큰 카드 (선발 투수), 'batter' = 정사각형. */
  variant?: 'starter' | 'batter';
  keyStat?: string | null;
  onClick?: () => void;
  className?: string;
}

// 등급 매핑: bkit grade(elite/rare/special/normal) → magu tier(elite/gold/silver/bronze).
const GRADE_TIER: Record<string, 'elite' | 'gold' | 'silver' | 'bronze'> = {
  elite: 'elite',
  rare: 'gold',
  special: 'silver',
  normal: 'bronze',
};
const GRADE_LABEL: Record<string, string> = {
  elite: '레전드',
  rare: 'A',
  special: 'B',
  normal: 'C',
};
const GRADE_STARS: Record<string, string> = {
  elite: '★★★★★',
  rare: '★★★★☆',
  special: '★★★☆☆',
  normal: '★★☆☆☆',
};

export function PlayerCard({
  slot,
  player,
  variant = 'batter',
  keyStat = null,
  onClick,
  className,
}: PlayerCardProps) {
  const team = player ? TEAMS[player.teamCode] : null;
  const tier = GRADE_TIER[slot.grade] ?? 'bronze';
  const label = GRADE_LABEL[slot.grade] ?? 'C';
  const stars = GRADE_STARS[slot.grade] ?? '★★☆☆☆';

  const orderLabel = slot.battingOrder === 0 ? 'P' : `${slot.battingOrder}`;
  // KIA 라인업 1~9 → SD 이미지 슬롯. 그 외는 player.photoUrl fallback.
  const isKiaBatter = player?.teamCode === 'KIA' && slot.battingOrder >= 1 && slot.battingOrder <= 9;
  const sdImage = isKiaBatter ? playerByLineupSlot(slot.battingOrder - 1) : null;
  const faceImage = sdImage ?? player?.photoUrl ?? null;

  // Starter 카드는 가로형 — 작은 face + 풍부한 우측 정보.
  if (variant === 'starter') {
    return (
      <button
        type="button"
        onClick={onClick}
        data-grade={slot.grade}
        aria-label={player ? `선발 투수 ${player.name}, 등급 ${label}` : '선발 투수 슬롯'}
        title={slot.gradeBasis}
        className={clsx(`magu-card grade-${tier}`, 'group relative w-full text-left cursor-pointer transition-transform duration-150 hover:scale-[1.01] active:scale-100', className)}
        style={{ padding: 0 }}
      >
        <span
          aria-hidden
          style={{
            position: 'absolute', top: 0, right: 0,
            padding: '1px 6px 2px', fontSize: 9, fontWeight: 900, borderRadius: '0 0 0 6px', zIndex: 3,
            background: tier === 'elite' ? 'linear-gradient(180deg, var(--magu-gold), var(--magu-gold-deep))'
              : tier === 'gold' ? '#BB9020' : tier === 'silver' ? '#8C97B5' : '#6B4525',
            color: tier === 'elite' || tier === 'silver' ? '#2A1A00' : '#fff',
          }}
        >
          {label}
        </span>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '80px 1fr',
            gap: 10,
            padding: 8,
            alignItems: 'center',
          }}
        >
          {/* 좌: 작은 face */}
          <div
            style={{
              width: 80, height: 80, borderRadius: 10, overflow: 'hidden',
              position: 'relative',
              backgroundColor: 'rgba(255,255,255,.04)',
              backgroundImage: `url(${tile('grass')})`,
              backgroundSize: 'cover', backgroundPosition: 'center',
              border: '1px solid var(--magu-line)',
            }}
          >
            {faceImage ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={faceImage}
                alt=""
                style={{
                  position: 'absolute', inset: 0,
                  width: '100%', height: '100%',
                  objectFit: 'cover', objectPosition: 'center top',
                  filter: 'drop-shadow(0 2px 3px rgba(0,0,0,.4))',
                }}
                loading="lazy"
              />
            ) : null}
          </div>

          {/* 우: 정보 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  padding: '2px 6px', borderRadius: 4,
                  background: team?.primaryColor ?? 'var(--magu-kia-red)',
                  color: '#fff', fontWeight: 900, fontSize: 10, letterSpacing: 0.5,
                }}
              >
                선발 P
              </span>
              <span className="font-digit" style={{ color: 'var(--magu-gold)', fontSize: 11 }}>
                #{player?.uniformNumber ?? '?'}
              </span>
              <span style={{ marginLeft: 'auto', color: 'var(--magu-gold)', fontSize: 10, letterSpacing: -1 }}>{stars}</span>
            </div>
            <div className="font-brand-magu" style={{ fontSize: 18, color: 'var(--magu-text-1)', lineHeight: 1 }}>
              {player?.name ?? '미정'}
            </div>
            <div
              className="font-digit"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                fontSize: 11, color: 'var(--magu-text-2)',
              }}
            >
              <span style={{ color: 'var(--magu-text-3)' }}>등급</span>
              <span style={{ color: 'var(--magu-gold)', fontWeight: 700 }}>{keyStat ?? '-'}</span>
            </div>
          </div>
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      data-grade={slot.grade}
      aria-label={
        player
          ? `${orderLabel}번 ${player.name} ${slot.position}, 등급 ${label}`
          : `${orderLabel}번 슬롯`
      }
      title={slot.gradeBasis}
      className={clsx(
        `magu-card grade-${tier}`,
        'group relative flex w-full flex-col text-left text-text-primary cursor-pointer',
        'transition-transform duration-150 hover:scale-[1.03] active:scale-100',
        'min-h-[180px]',
        className,
      )}
      style={{ padding: 0 }}
    >
      {/* 등급 태그 (우상단) */}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          padding: '1px 6px 2px',
          fontSize: 9,
          fontWeight: 900,
          borderRadius: '0 0 0 6px',
          zIndex: 3,
          background:
            tier === 'elite'
              ? 'linear-gradient(180deg, var(--magu-gold), var(--magu-gold-deep))'
              : tier === 'gold'
                ? '#BB9020'
                : tier === 'silver'
                  ? '#8C97B5'
                  : '#6B4525',
          color: tier === 'elite' || tier === 'silver' ? '#2A1A00' : '#fff',
        }}
      >
        {label}
      </span>

      {/* 상단: 포지션 + 타순 + 별 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '4px 6px',
          background: 'linear-gradient(180deg, rgba(0,0,0,.4), transparent)',
          fontSize: 9,
          position: 'relative',
          zIndex: 2,
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 20,
            height: 18,
            borderRadius: 4,
            background: team?.primaryColor ?? 'var(--magu-kia-red)',
            color: '#fff',
            fontWeight: 900,
            fontSize: 10,
          }}
        >
          {slot.position}
        </span>
        <span className="font-digit" style={{ color: 'var(--magu-gold)', fontSize: 12 }}>{orderLabel}</span>
        <span style={{ marginLeft: 'auto', color: 'var(--magu-gold)', fontSize: 9, letterSpacing: -1 }}>{stars}</span>
      </div>

      {/* face (정사각형) — 잔디 배경 + SD 일러스트 (전체 보이게 contain) */}
      <div
        style={{
          aspectRatio: '1 / 1',
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: 'rgba(255,255,255,.04)',
          backgroundImage: `url(${tile('grass')})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {faceImage ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={faceImage}
            alt=""
            className="pointer-events-none"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              objectPosition: 'center',
              filter: 'drop-shadow(0 2px 3px rgba(0,0,0,.4))',
            }}
            loading="lazy"
          />
        ) : null}
      </div>

      {/* 푸터: 이름 + 스탯 */}
      <div
        style={{
          padding: '4px 6px 6px',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          background: 'rgba(0,0,0,.4)',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 900,
            color: 'var(--magu-text-1)',
            textAlign: 'center',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {player?.name ?? '—'}
        </div>
        {keyStat ? (
          <div
            className="font-digit"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 10,
              color: 'var(--magu-text-2)',
            }}
          >
            <span>등급</span>
            <span style={{ color: 'var(--magu-gold)' }}>{keyStat}</span>
          </div>
        ) : null}
      </div>
    </button>
  );
}
