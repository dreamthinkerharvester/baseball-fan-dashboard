// Magu Magu 풍 순위 배너 — 가로 스크롤 한 줄.
// 1·2·3위: 메달 픽셀. 4위↓: 번호 배지. 각 팀 엠블럼 픽셀.

'use client';

import { medal, teamEmblem } from '@/lib/assets-magu';
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
      <div className="px-3 py-1.5" aria-busy="true" style={{ fontSize: 11, color: 'var(--magu-text-3)' }}>
        순위 불러오는 중…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        className="flex items-center justify-between gap-2 mx-3 my-1.5 px-3 py-1.5"
        style={{ fontSize: 11, background: 'rgba(232,58,63,.18)', color: 'var(--magu-text-2)', borderRadius: 8, border: '1px solid var(--magu-kia-red-deep)' }}
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
      style={{ borderBottom: '1px solid var(--magu-line)', background: 'rgba(15,20,33,.5)' }}
    >
      <div
        className="no-scrollbar flex items-center"
        style={{ gap: 4, padding: '6px 8px', overflowX: 'auto', scrollSnapType: 'x mandatory' }}
      >
        {data.rows.map((row) => {
          const isMyTeam = myTeam && row.teamCode === myTeam;
          const team = TEAMS[row.teamCode];
          const streak = row.streak ?? '';
          const isWin = streak.startsWith('W');
          const isLoss = streak.startsWith('L');
          const isTop3 = row.rank >= 1 && row.rank <= 3;

          return (
            <span
              key={row.teamCode}
              role="listitem"
              aria-current={isMyTeam ? 'true' : undefined}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '3px 8px 3px 4px',
                borderRadius: 12,
                whiteSpace: 'nowrap',
                fontSize: 11,
                fontWeight: isMyTeam ? 900 : 700,
                scrollSnapAlign: 'start',
                flexShrink: 0,
                background: isMyTeam
                  ? 'linear-gradient(180deg, rgba(232,58,63,.5), rgba(184,36,40,.5))'
                  : 'linear-gradient(180deg, var(--magu-panel), var(--magu-panel-deep))',
                border: isMyTeam ? '1px solid var(--magu-kia-red)' : '1px solid var(--magu-line)',
                color: 'var(--magu-text-1)',
                boxShadow: isMyTeam ? '0 0 8px rgba(232,58,63,.4), 0 2px 0 #0A0F1C' : '0 2px 0 #0A0F1C',
              }}
              title={`${row.rank}위 ${team.name} | 게임차 ${row.gamesBehind === 0 ? '-' : row.gamesBehind} | ${streak}`}
            >
              {/* 순위 배지: 1~3위 메달 / 4위↓ 번호 */}
              {isTop3 ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={medal(row.rank as 1 | 2 | 3)}
                  alt={`${row.rank}위`}
                  width={22}
                  height={22}
                  className="magu-pixel"
                  style={{ filter: 'drop-shadow(0 1px 0 rgba(0,0,0,.5))' }}
                />
              ) : (
                <span
                  className="font-digit"
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 4,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--magu-panel-light)',
                    color: 'var(--magu-text-2)',
                    fontSize: 11,
                    fontWeight: 900,
                  }}
                >
                  {row.rank}
                </span>
              )}

              {/* 팀 엠블럼 픽셀 */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={teamEmblem(row.teamCode)}
                alt=""
                width={18}
                height={18}
                className="magu-pixel"
              />

              {/* 팀 shortName */}
              <span style={{ fontWeight: isMyTeam ? 900 : 700 }}>{team.shortName}</span>

              {/* 게임차 */}
              <span className="font-digit" style={{ fontSize: 10, color: 'var(--magu-text-3)' }}>
                {row.gamesBehind === 0 ? '0' : `${row.gamesBehind}`}gb
              </span>

              {/* 연속 */}
              {streak && (
                <span
                  className="font-digit"
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '1px 4px',
                    borderRadius: 3,
                    background: isWin
                      ? 'var(--magu-field-green)'
                      : isLoss
                        ? 'var(--magu-kia-red)'
                        : 'transparent',
                    color: '#fff',
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
