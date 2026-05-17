// Magu Magu 풍 일정 — 촘촘 한 줄. 좌 컬러바(승/패/예정/취소) + 날짜 + 상대팀 + 결과/시간.

'use client';

import { useState } from 'react';

import { badge, icon, teamEmblem } from '@/lib/assets-magu';
import { TEAMS } from '@/lib/constants';

import { useGames, type ScheduleRange } from './hooks/useGames';
import { ScheduleTabs } from './ScheduleTabs';

import type { Game, GameStatus, TeamCode } from '@/types';

const STATUS_LABEL: Record<GameStatus, string> = {
  scheduled: '예정',
  in_progress: 'LIVE',
  final: '종료',
  cancelled: '취소',
  postponed: '연기',
};

export interface ScheduleListProps {
  myTeam?: TeamCode | null;
  defaultRange?: ScheduleRange;
}

export function ScheduleList({ myTeam, defaultRange = 'day' }: ScheduleListProps) {
  const [range, setRange] = useState<ScheduleRange>(defaultRange);
  const { data: games, error, isLoading, refresh } = useGames(range);

  return (
    <section aria-label="경기 일정" style={{ padding: '8px 8px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 8px 3px 4px',
            borderRadius: 6,
            background: 'linear-gradient(180deg, var(--magu-gold), var(--magu-gold-deep))',
            color: '#2A1A00',
            fontSize: 11,
            fontWeight: 900,
            boxShadow: '0 2px 0 #5C3D00',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={icon('calendar')} alt="" width={16} height={16} className="magu-pixel" />
          {range === 'day' ? '오늘' : range === 'week' ? '이번 주' : '이번 달'}
        </span>
        <h2 className="font-brand-magu" style={{ margin: 0, fontSize: 18, color: 'var(--magu-text-1)' }}>
          경기 일정
        </h2>
        <div style={{ marginLeft: 'auto' }}>
          <ScheduleTabs value={range} onChange={setRange} />
        </div>
      </div>

      {isLoading ? (
        <p aria-busy="true" style={{ padding: '24px 0', textAlign: 'center', color: 'var(--magu-text-3)', fontSize: 12 }}>
          일정 불러오는 중…
        </p>
      ) : null}

      {error ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 10,
            background: 'rgba(232,58,63,.15)',
            border: '1px solid var(--magu-kia-red)',
            color: 'var(--magu-text-2)',
            borderRadius: 8,
            fontSize: 12,
          }}
        >
          <span>일정을 불러오지 못했습니다.</span>
          <button
            type="button"
            onClick={refresh}
            style={{
              height: 28,
              padding: '0 10px',
              fontSize: 11,
              background: 'transparent',
              border: '1px solid currentColor',
              color: 'inherit',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            다시
          </button>
        </div>
      ) : null}

      {games && games.length === 0 ? (
        <p style={{ padding: '24px 0', textAlign: 'center', color: 'var(--magu-text-3)', fontSize: 12 }}>
          이 기간에 경기가 없습니다.
        </p>
      ) : null}

      {games && games.length > 0 ? (
        <ul role="list" style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: 0, margin: 0, listStyle: 'none' }}>
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

  // 마이팀 시점 상대팀 + 홈/원정 + 승패
  const myIsHome = isMyTeam && myTeam ? game.homeTeam === myTeam : false;
  const opponentCode: TeamCode = isMyTeam
    ? myIsHome
      ? game.awayTeam
      : game.homeTeam
    : game.awayTeam; // 마이팀 무관 시 away 표시
  const displayHome = isMyTeam ? myIsHome : false;
  const opponent = TEAMS[opponentCode];

  const myScore = isMyTeam
    ? myIsHome
      ? game.homeScore
      : game.awayScore
    : null;
  const oppScore = isMyTeam
    ? myIsHome
      ? game.awayScore
      : game.homeScore
    : null;

  const isFinal = game.status === 'final';
  const won = isFinal && myScore != null && oppScore != null && myScore > oppScore;
  const lost = isFinal && myScore != null && oppScore != null && myScore < oppScore;
  const tied = isFinal && myScore != null && oppScore != null && myScore === oppScore;

  // 좌측 컬러 바
  let stripeColor: string = 'var(--magu-line)';
  if (isMyTeam) {
    if (won) stripeColor = 'var(--magu-field-green)';
    else if (lost) stripeColor = 'var(--magu-kia-red)';
    else if (tied) stripeColor = 'var(--magu-gold)';
    else if (game.status === 'scheduled' || game.status === 'in_progress') stripeColor = 'var(--magu-sky)';
    else if (game.status === 'cancelled' || game.status === 'postponed') stripeColor = 'var(--magu-text-dim, #5D6786)';
  } else if (game.status === 'scheduled') stripeColor = 'var(--magu-line)';

  const d = game.date.slice(5).replace('-', '/'); // MM/DD
  const wd = weekdayKo(game.date);

  // 비-마이팀 게임도 양 팀 표시 (away → home)
  const showBothTeams = !isMyTeam;

  return (
    <li
      aria-current={isMyTeam ? 'true' : undefined}
      style={{
        display: 'grid',
        gridTemplateColumns: '32px 1fr auto',
        alignItems: 'center',
        gap: 6,
        padding: '5px 8px 5px 6px',
        background: isMyTeam
          ? 'linear-gradient(90deg, rgba(232,58,63,.15), rgba(36,49,82,.6) 60%)'
          : 'linear-gradient(180deg, var(--magu-panel), var(--magu-panel-deep))',
        border: '1px solid var(--magu-line)',
        borderLeft: `3px solid ${stripeColor}`,
        borderRadius: 8,
        boxShadow: '0 1px 0 #0A0F1C',
        listStyle: 'none',
      }}
    >
      {/* 날짜 */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1 }}>
        <span className="font-digit" style={{ fontSize: 13, color: isMyTeam ? 'var(--magu-kia-red)' : 'var(--magu-text-1)', fontWeight: 900 }}>
          {d}
        </span>
        <span style={{ fontSize: 8, color: 'var(--magu-text-3)', marginTop: 1 }}>{wd} {game.startTime?.slice(0, 5) ?? ''}</span>
      </div>

      {/* 상대팀 (마이팀 시점) 또는 양 팀 (그 외) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, minWidth: 0, overflow: 'hidden' }}>
        {isMyTeam ? (
          <>
            <span style={{ color: 'var(--magu-text-3)', fontSize: 9 }}>{myIsHome ? 'vs' : '@'}</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={teamEmblem(opponentCode)} alt="" width={18} height={18} className="magu-pixel" />
            <span style={{ fontWeight: 700, color: 'var(--magu-text-1)', whiteSpace: 'nowrap' }}>{opponent.shortName}</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={badge(displayHome ? 'home' : 'away')}
              alt={displayHome ? '홈' : '원정'}
              height={14}
              className="magu-pixel"
              style={{ height: 14, width: 'auto' }}
            />
          </>
        ) : showBothTeams ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={teamEmblem(game.awayTeam)} alt="" width={16} height={16} className="magu-pixel" />
            <span style={{ color: 'var(--magu-text-2)' }}>{TEAMS[game.awayTeam].shortName}</span>
            <span style={{ color: 'var(--magu-text-3)', fontSize: 9 }}>@</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={teamEmblem(game.homeTeam)} alt="" width={16} height={16} className="magu-pixel" />
            <span style={{ color: 'var(--magu-text-2)' }}>{TEAMS[game.homeTeam].shortName}</span>
          </>
        ) : null}
        <span style={{ fontSize: 9, color: 'var(--magu-text-3)', marginLeft: 'auto', whiteSpace: 'nowrap' }}>{game.stadium}</span>
      </div>

      {/* 결과 / 시간 / 상태 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        {game.status === 'final' && game.homeScore != null && game.awayScore != null ? (
          <>
            {isMyTeam ? (
              <span
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 4,
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 9,
                  fontWeight: 900,
                  color: won || tied ? (tied ? '#2A1A00' : '#fff') : '#fff',
                  background: won
                    ? 'var(--magu-field-green)'
                    : lost
                      ? 'var(--magu-kia-red)'
                      : 'var(--magu-gold)',
                }}
              >
                {won ? '승' : lost ? '패' : '무'}
              </span>
            ) : null}
            <span className="font-digit" style={{ fontSize: 13, color: 'var(--magu-gold)', fontWeight: 700 }}>
              {isMyTeam ? `${myScore ?? '-'}:${oppScore ?? '-'}` : `${game.awayScore}:${game.homeScore}`}
            </span>
          </>
        ) : game.status === 'in_progress' ? (
          <span
            style={{
              padding: '2px 6px',
              borderRadius: 4,
              fontSize: 9,
              fontWeight: 900,
              background: 'var(--magu-kia-red)',
              color: '#fff',
              letterSpacing: 0.5,
            }}
          >
            LIVE
          </span>
        ) : game.status === 'cancelled' || game.status === 'postponed' ? (
          <span style={{ fontSize: 11, color: 'var(--magu-text-3)' }}>{STATUS_LABEL[game.status]}</span>
        ) : (
          <span className="font-digit" style={{ fontSize: 11, color: 'var(--magu-text-2)' }}>
            {game.startTime?.slice(0, 5) ?? '-'}
          </span>
        )}
      </div>
    </li>
  );
}

const WD_KO: readonly string[] = ['일', '월', '화', '수', '목', '금', '토'];
function weekdayKo(date: string): string {
  // date: 'YYYY-MM-DD' (KST 기준) — Date 객체 timezone 영향 없이 인덱싱
  const d = new Date(`${date}T00:00:00+09:00`);
  const wd = WD_KO[d.getDay()];
  return wd ?? '';
}
