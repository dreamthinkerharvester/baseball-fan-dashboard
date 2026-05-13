// Design Ref: §5.4 — 경기 목록. 더블헤더 + 우천취소 + 마이팀 강조 + 완료 스코어.

'use client';

import { useState } from 'react';

import clsx from 'clsx';

import { TEAMS } from '@/lib/constants';
import { formatKoreanShortDate } from '@/lib/date';

import { useGames, type ScheduleRange } from './hooks/useGames';
import { ScheduleTabs } from './ScheduleTabs';

import type { Game, GameStatus, TeamCode } from '@/types';

export interface ScheduleListProps {
  myTeam?: TeamCode | null;
  defaultRange?: ScheduleRange;
}

const STATUS_LABEL: Record<GameStatus, string> = {
  scheduled: '예정',
  in_progress: '진행 중',
  final: '완료',
  cancelled: '취소',
  postponed: '연기',
};

const STATUS_CLASS: Record<GameStatus, string> = {
  scheduled: 'bg-text-dim/20 text-text-muted',
  in_progress: 'bg-grade-rare/20 text-grade-rare animate-pulse',
  final: 'bg-grade-elite/20 text-grade-elite',
  cancelled: 'bg-text-dim/30 text-text-dim line-through',
  postponed: 'bg-grade-special/20 text-grade-special',
};

export function ScheduleList({ myTeam, defaultRange = 'day' }: ScheduleListProps) {
  const [range, setRange] = useState<ScheduleRange>(defaultRange);
  const { data: games, error, isLoading, refresh } = useGames(range);

  return (
    <section aria-label="경기 일정" className="px-4 py-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-heading">경기 일정</h2>
        <ScheduleTabs value={range} onChange={setRange} />
      </div>

      {isLoading ? (
        <p aria-busy="true" className="py-6 text-center text-body text-text-muted">
          일정 불러오는 중…
        </p>
      ) : null}

      {error ? (
        <div className="flex items-center justify-between rounded-card border border-grade-rare/40 bg-grade-rare/10 p-3 text-body text-grade-rare">
          <span>일정을 불러오지 못했습니다.</span>
          <button
            type="button"
            onClick={refresh}
            className="min-h-[36px] rounded-button border border-grade-rare/40 px-3"
          >
            다시 시도
          </button>
        </div>
      ) : null}

      {games && games.length === 0 ? (
        <p className="py-6 text-center text-body text-text-muted">
          이 기간에 경기가 없습니다.
        </p>
      ) : null}

      {games && games.length > 0 ? (
        <ul role="list" className="flex flex-col gap-2">
          {games.map((g) => (
            <ScheduleRow key={g.id} game={g} myTeam={myTeam ?? null} />
          ))}
        </ul>
      ) : null}
    </section>
  );
}

interface RowProps {
  game: Game;
  myTeam: TeamCode | null;
}

function ScheduleRow({ game, myTeam }: RowProps) {
  const isMyTeam = Boolean(myTeam && (game.homeTeam === myTeam || game.awayTeam === myTeam));
  const home = TEAMS[game.homeTeam];
  const away = TEAMS[game.awayTeam];
  const dh = game.doubleHeader ? `DH${game.doubleHeader}` : null;

  return (
    <li
      className={clsx(
        'flex items-center gap-3 rounded-card border bg-bg-card px-3 py-2',
        isMyTeam ? 'border-2' : 'border-text-dim/20',
      )}
      style={isMyTeam ? { borderColor: TEAMS[myTeam!].primaryColor } : undefined}
      aria-current={isMyTeam ? 'true' : undefined}
    >
      <div className="flex w-16 shrink-0 flex-col items-start text-caption text-text-muted">
        <span>{formatKoreanShortDate(game.date)}</span>
        <span className="text-text-primary">{game.startTime}</span>
      </div>

      <div className="flex flex-1 items-center gap-2">
        <TeamCell team={away} />
        <span className="text-caption text-text-dim">@</span>
        <TeamCell team={home} highlight={isMyTeam} />
      </div>

      <div className="flex w-20 shrink-0 flex-col items-end gap-1">
        <span
          className={clsx(
            'rounded-badge px-1.5 py-[1px] text-[10px] font-bold',
            STATUS_CLASS[game.status],
          )}
        >
          {STATUS_LABEL[game.status]}
          {dh ? ` ${dh}` : ''}
        </span>
        {game.status === 'final' && game.homeScore != null && game.awayScore != null ? (
          <span className="text-caption text-text-primary">
            {game.awayScore} : {game.homeScore}
          </span>
        ) : null}
        {game.status === 'in_progress' && game.homeScore != null && game.awayScore != null ? (
          <span className="text-caption text-text-primary">
            {game.awayScore} : {game.homeScore}
          </span>
        ) : null}
        {game.status === 'cancelled' && game.cancelReason ? (
          <span className="text-caption text-text-dim">{game.cancelReason}</span>
        ) : null}
        <span className="text-[10px] text-text-dim">{game.stadium}</span>
      </div>
    </li>
  );
}

function TeamCell({
  team,
  highlight,
}: {
  team: { shortName: string; primaryColor: string; name: string };
  highlight?: boolean;
}) {
  return (
    <span
      className={clsx('text-body', highlight ? 'font-bold' : '')}
      style={{ color: team.primaryColor }}
    >
      {team.shortName}
    </span>
  );
}
