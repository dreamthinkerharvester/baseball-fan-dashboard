// Design Ref: §5.4 + m3-comp components.jsx ScheduleList.
// 더블헤더 + 우천취소 + 마이팀 강조 (primary border-left + surface-container-high).

'use client';

import { useState } from 'react';

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
  in_progress: 'LIVE',
  final: '종료',
  cancelled: '취소',
  postponed: '연기',
};

function statusStyle(s: GameStatus): React.CSSProperties {
  switch (s) {
    case 'in_progress':
      return {
        background: 'var(--md-sys-color-error-container)',
        color: 'var(--md-sys-color-on-error-container)',
        fontWeight: 700,
        animation: 'fadein 1.2s ease-in-out infinite alternate',
      };
    case 'final':
      return {
        background: 'var(--md-sys-color-secondary-container)',
        color: 'var(--md-sys-color-on-secondary-container)',
      };
    case 'cancelled':
      return {
        background: 'transparent',
        color: 'var(--md-sys-color-on-surface-variant)',
        textDecoration: 'line-through',
        border: '1px solid var(--md-sys-color-outline)',
      };
    case 'postponed':
      return {
        background: 'var(--md-sys-color-tertiary-container)',
        color: 'var(--md-sys-color-on-tertiary-container)',
      };
    default:
      return {
        background: 'var(--md-sys-color-surface-container-high)',
        color: 'var(--md-sys-color-on-surface-variant)',
      };
  }
}

export function ScheduleList({ myTeam, defaultRange = 'day' }: ScheduleListProps) {
  const [range, setRange] = useState<ScheduleRange>(defaultRange);
  const { data: games, error, isLoading, refresh } = useGames(range);

  return (
    <section
      aria-label="경기 일정"
      style={{ padding: '12px 16px 24px' }}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2
          className="font-brand"
          style={{
            margin: 0,
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: -0.1,
            color: 'var(--md-sys-color-on-surface)',
          }}
        >
          경기 일정
        </h2>
        <ScheduleTabs value={range} onChange={setRange} />
      </div>

      {isLoading ? (
        <p
          aria-busy="true"
          className="py-6 text-center"
          style={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: 13 }}
        >
          일정 불러오는 중…
        </p>
      ) : null}

      {error ? (
        <div
          className="flex items-center justify-between p-3"
          style={{
            background: 'var(--md-sys-color-error-container)',
            color: 'var(--md-sys-color-on-error-container)',
            borderRadius: 'var(--md-sys-shape-corner-medium)',
            fontSize: 13,
          }}
        >
          <span>일정을 불러오지 못했습니다.</span>
          <button
            type="button"
            onClick={refresh}
            className="m3-btn"
            style={{
              height: 36,
              padding: '0 12px',
              fontSize: 12,
              background: 'transparent',
              border: '1px solid var(--md-sys-color-on-error-container)',
              color: 'var(--md-sys-color-on-error-container)',
            }}
          >
            다시 시도
          </button>
        </div>
      ) : null}

      {games && games.length === 0 ? (
        <p
          className="py-6 text-center"
          style={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: 13 }}
        >
          이 기간에 경기가 없습니다.
        </p>
      ) : null}

      {games && games.length > 0 ? (
        <ul role="list" className="flex flex-col gap-1.5" style={{ padding: 0, margin: 0 }}>
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
  const score = game.homeScore != null && game.awayScore != null
    ? `${game.awayScore} : ${game.homeScore}`
    : null;
  const showScore = (game.status === 'final' || game.status === 'in_progress') && score;

  return (
    <li
      aria-current={isMyTeam ? 'true' : undefined}
      className="flex items-center gap-3"
      style={{
        padding: '10px 12px',
        borderRadius: 'var(--md-sys-shape-corner-medium)',
        background: isMyTeam
          ? 'var(--md-sys-color-surface-container-high)'
          : 'var(--md-sys-color-surface-container)',
        borderLeft: isMyTeam ? '2px solid var(--md-sys-color-primary)' : '2px solid transparent',
        listStyle: 'none',
      }}
    >
      <div className="flex flex-col items-start" style={{ width: 50, flexShrink: 0 }}>
        <span
          className="tabular"
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: isMyTeam
              ? 'var(--md-sys-color-primary)'
              : 'var(--md-sys-color-on-surface-variant)',
          }}
        >
          {formatKoreanShortDate(game.date)}
        </span>
        <span
          className="tabular"
          style={{ fontSize: 11, color: 'var(--md-sys-color-on-surface-variant)' }}
        >
          {game.startTime}
        </span>
      </div>

      <div className="flex flex-1 items-center gap-2 min-w-0">
        <TeamCell team={away} highlight={isMyTeam && game.awayTeam === myTeam} />
        <span style={{ fontSize: 11, color: 'var(--md-sys-color-on-surface-variant)' }}>@</span>
        <TeamCell team={home} highlight={isMyTeam && game.homeTeam === myTeam} />
      </div>

      <div
        className="flex flex-col items-end gap-1"
        style={{ width: 84, flexShrink: 0 }}
      >
        <span
          style={{
            ...statusStyle(game.status),
            padding: '3px 8px',
            borderRadius: 'var(--md-sys-shape-corner-small)',
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: 0.4,
            fontFamily: 'var(--md-ref-typeface-mono)',
          }}
        >
          {STATUS_LABEL[game.status]}
          {dh ? ` ${dh}` : ''}
        </span>
        {showScore && (
          <span
            className="tabular"
            style={{
              fontFamily: 'var(--md-ref-typeface-mono)',
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--md-sys-color-on-surface)',
            }}
          >
            {score}
          </span>
        )}
        {game.status === 'cancelled' && game.cancelReason ? (
          <span style={{ fontSize: 10, color: 'var(--md-sys-color-on-surface-variant)' }}>
            {game.cancelReason}
          </span>
        ) : null}
        <span style={{ fontSize: 10, color: 'var(--md-sys-color-on-surface-variant)' }}>
          {game.stadium}
        </span>
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
      className="flex items-center gap-1.5"
      style={{ minWidth: 0 }}
    >
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: 9999,
          flexShrink: 0,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: team.primaryColor,
          color: '#fff',
          fontSize: 9,
          fontWeight: 800,
        }}
      >
        {team.shortName.slice(0, 2)}
      </span>
      <span
        style={{
          fontSize: 13,
          fontWeight: highlight ? 700 : 500,
          color: highlight
            ? 'var(--md-sys-color-primary)'
            : 'var(--md-sys-color-on-surface)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {team.shortName}
      </span>
    </span>
  );
}
