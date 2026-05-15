// Design Ref: 사용자 요청 — 순위·팀·게임차·연속만 표시. 작은 영역.
// 한 줄 가로 스크롤. 마이팀 primary-container ring.

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
      <div className="px-3 py-1.5" aria-busy="true" style={{ fontSize: 11, color: 'var(--md-sys-color-on-surface-variant)' }}>
        순위 불러오는 중…
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
          style={{ background: 'transparent', border: '1px solid currentColor', borderRadius: 4, padding: '2px 8px', color: 'inherit', cursor: 'pointer', fontSize: 11 }}
        >
          재시도
        </button>
      </div>
    );
  }

  return (
    <section
      aria-label="리그 순위"
      style={{
        borderBottom: '1px solid var(--md-sys-color-outline-variant)',
        background: 'var(--md-sys-color-surface-container-low)',
      }}
    >
      <div
        className="no-scrollbar flex items-center"
        style={{ gap: 4, padding: '5px 12px', overflowX: 'auto', scrollSnapType: 'x mandatory' }}
      >
        {data.rows.map((row) => {
          const isMyTeam = myTeam && row.teamCode === myTeam;
          const team = TEAMS[row.teamCode];
          const streak = row.streak ?? '';
          const isWin = streak.startsWith('W');
          const isLoss = streak.startsWith('L');

          return (
            <span
              key={row.teamCode}
              role="listitem"
              aria-current={isMyTeam ? 'true' : undefined}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '3px 8px',
                borderRadius: 9999,
                whiteSpace: 'nowrap',
                fontSize: 11,
                fontWeight: isMyTeam ? 700 : 500,
                scrollSnapAlign: 'start',
                flexShrink: 0,
                background: isMyTeam
                  ? 'var(--md-sys-color-primary-container)'
                  : 'var(--md-sys-color-surface-container-high)',
                color: isMyTeam
                  ? 'var(--md-sys-color-on-primary-container)'
                  : 'var(--md-sys-color-on-surface)',
                boxShadow: isMyTeam ? '0 0 0 1.5px var(--md-sys-color-primary)' : 'none',
              }}
              title={`${row.rank}위 ${team.name} | 게임차 ${row.gamesBehind === 0 ? '-' : row.gamesBehind} | ${streak}`}
            >
              {/* 순위 번호 */}
              <span
                className="tabular"
                style={{
                  fontFamily: 'var(--md-ref-typeface-mono)',
                  fontSize: 10,
                  fontWeight: 700,
                  color: isMyTeam
                    ? 'var(--md-sys-color-on-primary-container)'
                    : 'var(--md-sys-color-on-surface-variant)',
                  minWidth: 14,
                }}
              >
                {row.rank}
              </span>

              {/* 팀 컬러 dot — shortName 단 한 곳만 */}
              <span
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9999,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: team.primaryColor,
                  color: '#fff',
                  fontSize: 8,
                  fontWeight: 800,
                  letterSpacing: 0,
                  flexShrink: 0,
                }}
                aria-hidden
              >
                {team.shortName.slice(0, 2)}
              </span>

              {/* 팀 shortName — 모바일에서는 숨김 */}
              <span className="hidden sm:inline" style={{ fontWeight: 700 }}>
                {team.shortName}
              </span>

              {/* 게임차 */}
              <span
                className="tabular"
                style={{
                  fontFamily: 'var(--md-ref-typeface-mono)',
                  fontSize: 10,
                  color: isMyTeam
                    ? 'var(--md-sys-color-on-primary-container)'
                    : 'var(--md-sys-color-on-surface-variant)',
                }}
              >
                {row.gamesBehind === 0 ? '0' : `${row.gamesBehind}`}gb
              </span>

              {/* 연속 */}
              {streak && (
                <span
                  className="tabular"
                  style={{
                    fontFamily: 'var(--md-ref-typeface-mono)',
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '1px 4px',
                    borderRadius: 3,
                    background: isWin
                      ? 'var(--md-sys-color-secondary-container)'
                      : isLoss
                      ? 'var(--md-sys-color-error-container)'
                      : 'transparent',
                    color: isWin
                      ? 'var(--md-sys-color-on-secondary-container)'
                      : isLoss
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
