// Design Ref: §5.4 Dashboard — Standings Banner. 10팀 + 마이팀 강조 + 펼침/접힘.

'use client';

import { useState } from 'react';

import clsx from 'clsx';

import { TEAMS } from '@/lib/constants';

import { useStandings } from './hooks/useStandings';

import type { TeamCode } from '@/types';

export interface StandingsBannerProps {
  myTeam?: TeamCode | null;
}

export function StandingsBanner({ myTeam }: StandingsBannerProps) {
  const [expanded, setExpanded] = useState(false);
  const { data, isLoading, error, refresh } = useStandings();

  if (isLoading) {
    return (
      <div className="px-4 py-2 text-caption text-text-muted" aria-busy="true">
        순위 불러오는 중…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-between gap-2 px-4 py-2 text-caption text-grade-rare">
        <span>순위 불러오기 실패</span>
        <button
          type="button"
          onClick={refresh}
          className="min-h-[36px] rounded-button border border-grade-rare/40 px-2"
        >
          다시
        </button>
      </div>
    );
  }

  const rows = data.rows;

  return (
    <section aria-label="리그 순위" className="border-b border-text-dim/20 bg-bg-panel">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-controls="standings-list"
        className="flex w-full items-center justify-between px-4 py-2 text-left"
      >
        <span className="text-caption text-text-muted">리그 순위</span>
        <span className="text-caption text-text-dim">
          {expanded ? '접기 ▲' : '펼치기 ▼'}
        </span>
      </button>

      {/* 접힘 상태에서는 가로 스크롤 한 줄. 펼치면 그리드. */}
      <div
        id="standings-list"
        className={clsx(
          'no-scrollbar overflow-x-auto',
          expanded ? 'overflow-visible' : '',
        )}
      >
        <ol
          role="list"
          className={clsx(
            expanded
              ? 'grid grid-cols-2 gap-2 px-4 pb-3 sm:grid-cols-5'
              : 'flex gap-2 px-4 pb-3',
          )}
        >
          {rows.map((row) => {
            const isMyTeam = myTeam && row.teamCode === myTeam;
            const team = TEAMS[row.teamCode];
            return (
              <li
                key={row.teamCode}
                className={clsx(
                  'flex shrink-0 items-baseline gap-2 rounded-button border px-2 py-1 text-caption',
                  isMyTeam
                    ? 'border-2 bg-bg-card font-semibold'
                    : 'border-text-dim/20 bg-bg-card/60',
                )}
                style={isMyTeam ? { borderColor: team.primaryColor } : undefined}
                aria-current={isMyTeam ? 'true' : undefined}
              >
                <span className="text-text-muted">{row.rank}</span>
                <span style={{ color: team.primaryColor }}>{team.shortName}</span>
                <span className="text-text-muted">
                  {row.wins}-{row.losses}
                  {row.draws > 0 ? `-${row.draws}` : ''}
                </span>
                {row.gamesBehind > 0 ? (
                  <span className="text-text-dim">{row.gamesBehind.toFixed(1)}gb</span>
                ) : null}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
