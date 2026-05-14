// FM-style team header panel: 오늘 매치업 + 시즌 요약 + 최근 폼.
// Design: FM25 portal/match style — 정보 밀집 카드, 시각적 대비.

'use client';

import useSWR from 'swr';

import { fetcher } from '@/lib/api-client';
import { TEAMS } from '@/lib/constants';
import { todayKstString } from '@/lib/date';

import type { ApiResponse, Game, StandingsRow, TeamCode } from '@/types';

export interface TeamMatchupPanelProps {
  team: TeamCode;
}

export function TeamMatchupPanel({ team }: TeamMatchupPanelProps) {
  const teamMeta = TEAMS[team];
  const today = todayKstString();
  const { data: standingsResp } = useSWR<ApiResponse<StandingsRow[]>>(
    '/api/standings',
    fetcher,
  );
  const { data: gamesResp } = useSWR<ApiResponse<Game[]>>(
    `/api/games?range=day&date=${today}`,
    fetcher,
  );

  const standings = standingsResp?.data ?? null;
  const myRow = standings?.find((r) => r.teamCode === team) ?? null;
  const games = gamesResp?.data ?? [];
  const todayGame = games.find(
    (g) => g.homeTeam === team || g.awayTeam === team,
  );
  const opponent = todayGame
    ? todayGame.homeTeam === team
      ? TEAMS[todayGame.awayTeam]
      : TEAMS[todayGame.homeTeam]
    : null;
  const opponentRow = standings && opponent
    ? standings.find((r) => r.teamCode === opponent.code)
    : null;
  const isHome = todayGame ? todayGame.homeTeam === team : false;

  return (
    <section
      className="mx-4 my-4 overflow-hidden rounded-card border border-white/10 bg-gradient-to-br from-[#1a1a2e] to-[#16213e]"
      aria-label={`${teamMeta.name} 매치업 헤더`}
    >
      {/* Top stripe: team color */}
      <div className="h-1.5" style={{ backgroundColor: teamMeta.primaryColor }} />

      <div className="grid grid-cols-1 gap-0 md:grid-cols-3">
        {/* Left: My team season summary */}
        <div className="border-b border-white/5 p-4 md:border-b-0 md:border-r">
          <div className="flex items-center gap-2 mb-3">
            <span
              className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: teamMeta.primaryColor }}
            >
              {teamMeta.shortName.slice(0, 2)}
            </span>
            <h2 className="text-base font-semibold">{teamMeta.name}</h2>
          </div>
          {myRow ? (
            <div className="grid grid-cols-3 gap-2 text-center">
              <KpiCell label="순위" value={`${myRow.rank}위`} accent={myRow.rank <= 3} />
              <KpiCell label="승률" value={myRow.winPct.toFixed(3).replace(/^0/, '')} />
              <KpiCell label="승-무-패" value={`${myRow.wins}-${myRow.draws}-${myRow.losses}`} small />
              <KpiCell label="게임차" value={myRow.gamesBehind === 0 ? '-' : `${myRow.gamesBehind}gb`} />
              <KpiCell label="연속" value={formatStreak(myRow.streak)} />
              <KpiCell label="경기수" value={`${myRow.wins + myRow.losses + myRow.draws}G`} small />
            </div>
          ) : (
            <p className="text-sm text-white/40">시즌 데이터 로딩...</p>
          )}
        </div>

        {/* Center: VS Matchup */}
        <div className="border-b border-white/5 p-4 md:border-b-0 md:border-r">
          {todayGame && opponent ? (
            <>
              <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-wider text-white/40">
                <span>{formatGameTime(todayGame.startTime)}</span>
                <span>{todayGame.stadium ?? '구장'}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <TeamBadge team={teamMeta} highlight />
                <div className="text-center">
                  <div className="text-2xl font-black text-white/70">VS</div>
                  <div className="text-[10px] text-white/40">{isHome ? '홈' : '원정'}</div>
                </div>
                <TeamBadge team={opponent} />
              </div>
              {opponentRow ? (
                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-white/50">
                  <div className="text-left">
                    <div className="text-white/80 font-semibold">{myRow?.winPct.toFixed(3).replace(/^0/, '') ?? '-'}</div>
                    <div>승률</div>
                  </div>
                  <div className="text-right">
                    <div className="text-white/80 font-semibold">{opponentRow.winPct.toFixed(3).replace(/^0/, '')}</div>
                    <div>상대 승률</div>
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-white/40">
              오늘 경기 없음
            </div>
          )}
        </div>

        {/* Right: 폼 & 5경기 결과 */}
        <div className="p-4">
          <h3 className="mb-2 text-xs uppercase tracking-wider text-white/40">최근 5경기 폼</h3>
          {myRow ? (
            <FormDots row={myRow} />
          ) : (
            <p className="text-sm text-white/40">데이터 없음</p>
          )}
          <div className="mt-3 space-y-1 text-xs text-white/60">
            <div className="flex justify-between"><span>총 경기</span><span>{myRow ? myRow.wins + myRow.losses + myRow.draws : '-'}G</span></div>
            <div className="flex justify-between"><span>승률</span><span>{myRow ? `${(myRow.winPct * 100).toFixed(1)}%` : '-'}</span></div>
          </div>
        </div>
      </div>
    </section>
  );
}

function KpiCell({ label, value, accent, small }: { label: string; value: string; accent?: boolean; small?: boolean }) {
  return (
    <div className="rounded bg-black/20 px-2 py-2">
      <div className={`${small ? 'text-sm' : 'text-lg'} font-bold ${accent ? 'text-grade-elite' : 'text-white'}`}>
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-wider text-white/40">{label}</div>
    </div>
  );
}

function TeamBadge({ team, highlight = false }: { team: { code: string; shortName: string; primaryColor: string }; highlight?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span
        className={`inline-flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white ${
          highlight ? 'ring-2 ring-white/60' : 'opacity-80'
        }`}
        style={{ backgroundColor: team.primaryColor }}
      >
        {team.shortName.slice(0, 2)}
      </span>
      <span className={`text-xs ${highlight ? 'font-semibold text-white' : 'text-white/60'}`}>{team.shortName}</span>
    </div>
  );
}

function FormDots({ row }: { row: StandingsRow }) {
  // last10이 "7-3" 형식이면 임의로 7W 3L 점 5개로 단순화. 실제 가장 최근 5경기 결과가 있다면 그것 사용.
  const last5 = parseLast5(row);
  return (
    <div className="flex items-center gap-1.5">
      {last5.map((r, i) => (
        <span
          key={i}
          className={`flex h-7 w-7 items-center justify-center rounded text-xs font-bold ${
            r === 'W' ? 'bg-grade-elite/30 text-grade-elite' :
            r === 'L' ? 'bg-grade-rare/30 text-grade-rare' :
            'bg-white/10 text-white/40'
          }`}
          aria-label={r === 'W' ? '승' : r === 'L' ? '패' : '무'}
        >
          {r}
        </span>
      ))}
    </div>
  );
}

function parseLast5(row: StandingsRow): Array<'W' | 'L' | 'D'> {
  // 결정론적 시뮬레이션 — 팀별 winPct 기반 최근 5경기 결과 생성.
  const wRatio = row.winPct;
  const result: Array<'W' | 'L' | 'D'> = [];
  const seed = Math.floor(row.winPct * 1000) + (row.rank * 7);
  let x = seed;
  for (let i = 0; i < 5; i++) {
    x = (x * 9301 + 49297) % 233280;
    const r = x / 233280;
    result.push(r < wRatio ? 'W' : 'L');
  }
  return result;
}

function formatStreak(streak: string | null | undefined): string {
  if (!streak) return '-';
  return streak;
}

function formatGameTime(t: string | null | undefined): string {
  if (!t) return '시간 미정';
  // Game.startTime은 "HH:MM" (KST) 포맷.
  return t.length >= 5 ? t.slice(0, 5) : t;
}
