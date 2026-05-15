// Phase 1.5 — Search results list (행 형태). M3 surface-container.

'use client';

import clsx from 'clsx';

import { TEAMS } from '@/lib/constants';

import type { PlayerSearchResult } from '@/types';

export interface ResultsListProps {
  results: readonly PlayerSearchResult[];
  isLoading: boolean;
  totalMatched?: number;
  onSelect: (playerId: string) => void;
  className?: string;
}

export function ResultsList({
  results,
  isLoading,
  totalMatched,
  onSelect,
  className,
}: ResultsListProps) {
  if (isLoading && results.length === 0) {
    return (
      <p
        className={clsx('py-8 text-center', className)}
        style={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: 13 }}
      >
        검색 중…
      </p>
    );
  }

  if (results.length === 0) {
    return (
      <p
        className={clsx('py-8 text-center', className)}
        style={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: 13 }}
      >
        해당 조건의 선수가 없습니다.
      </p>
    );
  }

  const overflow =
    totalMatched != null && totalMatched > results.length
      ? totalMatched - results.length
      : 0;

  return (
    <ul
      className={clsx('flex flex-col', className)}
      aria-label="검색 결과"
      style={{
        background: 'var(--md-sys-color-surface-container)',
        borderRadius: 'var(--md-sys-shape-corner-medium)',
        overflow: 'hidden',
        listStyle: 'none',
        padding: 0,
        margin: 0,
      }}
    >
      {results.map(({ player, keyStat }, idx) => {
        const team = TEAMS[player.teamCode];
        return (
          <li
            key={player.id}
            style={
              idx === 0
                ? undefined
                : { borderTop: '1px solid var(--md-sys-color-outline-variant)' }
            }
          >
            <button
              type="button"
              onClick={() => onSelect(player.id)}
              className="flex w-full items-center text-left"
              style={{
                minHeight: 56,
                padding: '8px 12px',
                gap: 12,
                background: 'transparent',
                border: 'none',
                color: 'var(--md-sys-color-on-surface)',
                cursor: 'pointer',
                transition: 'background var(--md-sys-motion-duration-short2) var(--md-sys-motion-easing-standard)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background =
                  'var(--md-sys-color-surface-container-high)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <span
                className="font-mono-tn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 28,
                  height: 28,
                  borderRadius: 9999,
                  flexShrink: 0,
                  background: team.primaryColor,
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: 0,
                }}
                aria-label={`팀: ${team.name}`}
              >
                {team.shortName.slice(0, 2)}
              </span>
              <span
                className="m3-chip m3-chip-sm m3-chip-outline tabular"
                style={{ flexShrink: 0 }}
                aria-label={`포지션: ${player.position}`}
              >
                {player.position}
              </span>
              <span className="flex-1 truncate" style={{ minWidth: 0 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{player.name}</span>
                {player.uniformNumber ? (
                  <span
                    className="tabular"
                    style={{
                      marginLeft: 8,
                      fontSize: 11,
                      color: 'var(--md-sys-color-on-surface-variant)',
                      fontFamily: 'var(--md-ref-typeface-mono)',
                    }}
                  >
                    #{player.uniformNumber}
                  </span>
                ) : null}
              </span>
              <span
                className="font-mono-tn"
                style={{
                  fontSize: 12,
                  color: 'var(--md-sys-color-on-surface-variant)',
                  flexShrink: 0,
                }}
              >
                {keyStat ?? '—'}
              </span>
              <span
                className="mso"
                aria-hidden
                style={{ fontSize: 18, color: 'var(--md-sys-color-on-surface-variant)' }}
              >
                chevron_right
              </span>
            </button>
          </li>
        );
      })}
      {overflow > 0 ? (
        <li
          style={{
            padding: '12px',
            fontSize: 11,
            color: 'var(--md-sys-color-on-surface-variant)',
            borderTop: '1px solid var(--md-sys-color-outline-variant)',
            textAlign: 'center',
          }}
        >
          외 {overflow}명 — 검색어/필터를 좁혀주세요
        </li>
      ) : null}
    </ul>
  );
}
