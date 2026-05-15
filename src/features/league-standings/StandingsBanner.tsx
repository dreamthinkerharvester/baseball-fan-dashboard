// Design Ref: 사용자 피드백 — 게임차 + 연속만 표시, 작은 영역.
// 가로 스크롤 단일 행, 마이팀 강조.

'use client';

import { TEAMS } from '@/lib/constants';

import { useStandings } from './hooks/useStandings';

import type { TeamCode } from '@/types';

export interface StandingsBannerProps {
  myTeam?: TeamCode | null;
}

export function StandingsBanner({ myTeam }: StandingsBannerProps) {
  const { data, isLoading, error, refresh } = useStandings();

  if (isLoading) {
    return (
      <div
        className="px-3 py-1.5"
        aria-busy="true"
        style={{ fontSize: 11, color: 'var(--md-sys-color-on-surface-variant)' }}
      >
        순위 …
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        className="flex items-center justify-between gap-2 mx-3 my-1.5 px-3 py-1.5"
        style={{
          fontSize: 11,
          background: 'var(--md-sys-color-error-container)',
          color: 'var(--md-sys-color-on-error-container)',
          borderRadius: 'var(--md-sys-shape-corner-small)',
        }}
      >
        <span>순위 불러오기 실패</span>
        <button
          type="button"
          onClick={refresh}
          style={{
            background: 'transparent',
            border: '1px solid currentColor',
            borderRadius: 4,
            padding: '2px 8px',
            color: 'inherit',
            cursor: 'pointer',
            fontSize: 11,
          }}
        >
          재시도
        </button>
      </div>
    );
  }

  const rows = data.rows;

  return (
    <section
      aria-label="리그 순위 (게임차 · 연속)"
      style={{
        borderBottom: '1px solid var(--md-sys-color-outline-variant)',
        background: 'var(--md-sys-color-surface-container-low)',
      }}
    >
      <div
        className="no-scrollbar flex items-center"
        style={{
          gap: 6,
          padding: '6px 12px',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
        }}
      >
        {rows.map((row) => {
          const isMyTeam = myTeam && row.teamCode === myTeam;
          const team = TEAMS[row.teamCode];
          const streak = row.streak ?? '';
          const streakSign = streak.startsWith('W')
            ? 'win'
            : streak.startsWith('L')
            ? 'loss'
            : 'neutral';
          return (
            <span
              key={row.teamCode}
              role="listitem"
              aria-current={isMyTeam ? 'true' : undefined}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 7px',
                borderRadius: 9999,
                whiteSpace: 'nowrap',
                fontSize: 11,
                fontWeight: 500,
                scrollSnapAlign: 'start',
                background: isMyTeam
                  ? 'var(--md-sys-color-primary-container)'
                  : 'var(--md-sys-color-surface-container-high)',
                color: isMyTeam
                  ? 'var(--md-sys-color-on-primary-container)'
                  : 'var(--md-sys-color-on-surface)',
                boxShadow: isMyTeam ? '0 0 0 1.5px var(--md-sys-color-primary)' : 'none',
                flexShrink: 0,
                lineHeight: 1.2,
              }}
              title={`${row.rank}위 · 게임차 ${row.gamesBehind === 0 ? '-' : row.gamesBehind} · 연속 ${streak || '-'}`}
            >
              <span
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 9999,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: team.primaryColor,
                  color: '#fff',
                  fontSize: 8,
                  fontWeight: 800,
                  letterSpacing: 0,
                }}
              >
                {team.shortName.slice(0, 2)}
              </span>
              <span style={{ fontWeight: 700 }}>{team.shortName}</span>
              <span
                className="tabular"
                style={{
                  fontFamily: 'var(--md-ref-typeface-mono)',
                  color: isMyTeam
                    ? 'var(--md-sys-color-on-primary-container)'
                    : 'var(--md-sys-color-on-surface-variant)',
                }}
              >
                {row.gamesBehind === 0 ? '0gb' : `${row.gamesBehind}gb`}
              </span>
              {streak && (
                <span
                  className="tabular"
                  style={{
                    fontFamily: 'var(--md-ref-typeface-mono)',
                    fontWeight: 700,
                    fontSize: 10,
                    padding: '0 4px',
                    borderRadius: 3,
                    background:
                      streakSign === 'win'
                        ? 'var(--md-sys-color-secondary-container)'
                        : streakSign === 'loss'
                        ? 'var(--md-sys-color-error-container)'
                        : 'transparent',
                    color:
                      streakSign === 'win'
                        ? 'var(--md-sys-color-on-secondary-container)'
                        : streakSign === 'loss'
                        ? 'var(--md-sys-color-on-error-container)'
                        : 'var(--md-sys-color-on-surface-variant)',
                  }}
                >
                  {streak}
                </span>
              )}
            </span>
          );
        })}
      </div>
    </section>
  );
}
