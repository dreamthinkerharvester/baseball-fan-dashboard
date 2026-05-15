// 수도권(잠실/고척/수원/문학/인천) KIA 경기 알림 — 사용자 요청 (5).

'use client';

import useSWR from 'swr';

import { fetcher } from '@/lib/api-client';
import { TEAMS } from '@/lib/constants';
import { todayKstString } from '@/lib/date';

import type { ApiResponse, Game, TeamCode } from '@/types';

const METRO_KEYWORDS = ['잠실', '고척', '수원', '문학', '인천'];
const KIA: TeamCode = 'KIA';

function isMetro(stadium: string | null | undefined): boolean {
  if (!stadium) return false;
  return METRO_KEYWORDS.some((kw) => stadium.includes(kw));
}

export function MetroGameAlert({ myTeam }: { myTeam: TeamCode | null }) {
  const today = todayKstString();
  const { data } = useSWR<ApiResponse<Game[]>>(
    `/api/games?range=month&date=${today}`,
    fetcher,
  );

  if (myTeam !== KIA) return null;
  const games = data?.data ?? [];
  if (games.length === 0) return null;

  // Find next KIA away game in metro within next 14 days
  const now = new Date(today);
  const horizon = new Date(now);
  horizon.setDate(horizon.getDate() + 14);

  const candidates = games
    .filter((g) => g.homeTeam === KIA || g.awayTeam === KIA)
    .filter((g) => g.awayTeam === KIA) // KIA가 원정 = 수도권 가는 경우
    .filter((g) => g.date >= today && new Date(g.date) <= horizon)
    .filter((g) => isMetro(g.stadium))
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  if (candidates.length === 0) return null;
  const next = candidates[0]!;
  const oppCode = next.homeTeam as TeamCode;
  const opp = TEAMS[oppCode];

  // Date diff in days
  const daysAway = Math.round(
    (new Date(next.date).getTime() - now.getTime()) / 86400000,
  );
  const dayLabel =
    daysAway === 0 ? '오늘' : daysAway === 1 ? '내일' : `${daysAway}일 후`;

  return (
    <section
      role="status"
      style={{
        margin: '8px 12px 0',
        padding: '10px 14px',
        borderRadius: 'var(--md-sys-shape-corner-medium)',
        background: 'var(--md-sys-color-tertiary-container)',
        color: 'var(--md-sys-color-on-tertiary-container)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        boxShadow: 'var(--md-sys-elevation-1)',
      }}
    >
      <span className="mso filled" aria-hidden style={{ fontSize: 22 }}>
        stadium
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 0.3,
            textTransform: 'uppercase',
          }}
        >
          📍 수도권 KIA 원정 경기
        </div>
        <div style={{ fontSize: 13, fontWeight: 500, marginTop: 2 }}>
          <span className="tabular" style={{ fontFamily: 'var(--md-ref-typeface-mono)', marginRight: 6 }}>
            {dayLabel}
          </span>
          <span style={{ fontWeight: 700 }}>vs {opp.shortName}</span>
          <span style={{ marginLeft: 6, opacity: 0.8 }}>
            @ {next.stadium} · {next.startTime}
          </span>
        </div>
      </div>
    </section>
  );
}
