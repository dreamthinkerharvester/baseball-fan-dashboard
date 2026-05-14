// FM-style team header panel — Material 3 (Dark) port.
// Design Ref: m3-comp/components.jsx TeamMatchupPanel.
// Real SWR data flow preserved.

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
      className="m3-card mx-3 my-3 sm:mx-4 sm:my-4"
      aria-label={`${teamMeta.name} 매치업 헤더`}
      style={{
        padding: 16,
        background: 'var(--md-sys-color-surface-container)',
        borderRadius: 'var(--md-sys-shape-corner-large)',
      }}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.1fr_1fr_0.9fr] md:gap-6">
        {/* Left: Season KPI */}
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <div
              className="font-brand"
              style={{ fontSize: 14, fontWeight: 600, color: 'var(--md-sys-color-on-surface)' }}
            >
              시즌 KPI
            </div>
            <div
              className="tabular"
              style={{ fontSize: 11, color: 'var(--md-sys-color-on-surface-variant)' }}
            >
              {teamMeta.shortName} · {myRow ? myRow.wins + myRow.losses + myRow.draws : 0}/144
            </div>
          </div>
          {myRow ? (
            <div className="grid grid-cols-3 md:grid-cols-2 gap-2">
              <KpiCell label="순위" value={`${myRow.rank}위`} sub="10팀 중" />
              <KpiCell
                label="승률"
                value={myRow.winPct.toFixed(3).replace(/^0/, '')}
                sub={myRow.winPct >= 0.5 ? '> .500' : '< .500'}
              />
              <KpiCell
                label="W-D-L"
                value={`${myRow.wins}-${myRow.draws}-${myRow.losses}`}
                sub={`${myRow.wins + myRow.losses + myRow.draws}경기`}
              />
              <KpiCell
                label="게임차"
                value={myRow.gamesBehind === 0 ? '-' : `${myRow.gamesBehind}`}
                sub={myRow.rank === 1 ? '1위' : '위 팀 기준'}
              />
              <KpiCell label="연속" value={formatStreak(myRow.streak)} sub="최근 흐름" />
              <KpiCell
                label="잔여"
                value={`${144 - (myRow.wins + myRow.losses + myRow.draws)}`}
                sub="144 경기제"
              />
            </div>
          ) : (
            <div
              style={{
                padding: 16,
                color: 'var(--md-sys-color-on-surface-variant)',
                fontSize: 13,
                textAlign: 'center',
              }}
            >
              시즌 데이터 로딩...
            </div>
          )}
        </div>

        {/* Center: VS Matchup */}
        <div
          className="flex flex-col justify-center"
          style={{
            paddingTop: 12,
            paddingBottom: 12,
            borderTop: '1px solid var(--md-sys-color-outline-variant)',
            borderBottom: '1px solid var(--md-sys-color-outline-variant)',
          }}
        >
          {todayGame && opponent ? (
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-center gap-2">
                <span
                  style={{
                    fontSize: 11,
                    letterSpacing: 0.4,
                    color: 'var(--md-sys-color-on-surface-variant)',
                  }}
                >
                  {today.slice(5).replace('-', '/')} · {formatGameTime(todayGame.startTime)}
                </span>
                <span
                  className="m3-chip m3-chip-sm"
                  style={{
                    background: 'var(--md-sys-color-secondary-container)',
                    color: 'var(--md-sys-color-on-secondary-container)',
                    fontWeight: 700,
                  }}
                >
                  {isHome ? 'HOME' : 'AWAY'}
                </span>
              </div>
              <div className="flex items-center justify-center gap-4">
                <TeamBadge team={teamMeta} highlight />
                <div className="text-center flex flex-col gap-0.5">
                  <div
                    className="font-brand"
                    style={{
                      fontSize: 36,
                      fontWeight: 700,
                      lineHeight: 1,
                      letterSpacing: -1,
                      color: 'var(--md-sys-color-on-surface)',
                    }}
                  >
                    VS
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: 'var(--md-sys-color-on-surface-variant)',
                    }}
                  >
                    {isHome ? '@홈' : '@원정'}
                  </div>
                </div>
                <TeamBadge team={opponent} />
              </div>
              {todayGame.stadium && (
                <div className="flex justify-center gap-1.5">
                  <span className="m3-chip m3-chip-sm m3-chip-outline">
                    <span className="mso" style={{ fontSize: 12 }}>stadium</span>
                    {todayGame.stadium}
                  </span>
                  {opponentRow && (
                    <span
                      className="m3-chip m3-chip-sm m3-chip-outline tabular"
                      title="상대 승률"
                    >
                      <span className="mso" style={{ fontSize: 12 }}>shield</span>
                      {opponentRow.winPct.toFixed(3).replace(/^0/, '')}
                    </span>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div
              className="flex items-center justify-center"
              style={{
                color: 'var(--md-sys-color-on-surface-variant)',
                fontSize: 13,
                padding: 16,
              }}
            >
              오늘 경기 없음
            </div>
          )}
        </div>

        {/* Right: Recent form */}
        <div className="flex flex-col gap-2.5">
          <div
            className="font-brand"
            style={{ fontSize: 14, fontWeight: 600, color: 'var(--md-sys-color-on-surface)' }}
          >
            최근 5경기
          </div>
          {myRow ? (
            <>
              <div className="flex items-center gap-2.5">
                <span
                  className="tabular"
                  style={{
                    width: 36,
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--md-sys-color-primary)',
                  }}
                >
                  {teamMeta.shortName}
                </span>
                <FormDots row={myRow} />
                <span
                  className="tabular"
                  style={{
                    marginLeft: 'auto',
                    fontSize: 11,
                    color: 'var(--md-sys-color-on-surface-variant)',
                  }}
                >
                  {formatStreak(myRow.streak)}
                </span>
              </div>
              {opponentRow && opponent && (
                <div className="flex items-center gap-2.5">
                  <span
                    className="tabular"
                    style={{
                      width: 36,
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--md-sys-color-on-surface-variant)',
                    }}
                  >
                    {opponent.shortName}
                  </span>
                  <FormDots row={opponentRow} />
                  <span
                    className="tabular"
                    style={{
                      marginLeft: 'auto',
                      fontSize: 11,
                      color: 'var(--md-sys-color-on-surface-variant)',
                    }}
                  >
                    {formatStreak(opponentRow.streak)}
                  </span>
                </div>
              )}
              <hr
                style={{
                  margin: '4px 0',
                  border: 'none',
                  borderTop: '1px solid var(--md-sys-color-outline-variant)',
                }}
              />
              <div className="flex flex-col gap-1.5" style={{ fontSize: 12 }}>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>총 경기</span>
                  <span className="tabular" style={{ fontWeight: 600 }}>
                    {myRow.wins + myRow.losses + myRow.draws}G
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>승률</span>
                  <span className="tabular" style={{ fontWeight: 600 }}>
                    {(myRow.winPct * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--md-sys-color-on-surface-variant)' }}>
              데이터 없음
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function KpiCell({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="m3-kpi-cell">
      <div className="m3-kpi-label">{label}</div>
      <div className="m3-kpi-value">{value}</div>
      {sub && <div className="m3-kpi-sub">{sub}</div>}
    </div>
  );
}

function TeamBadge({
  team,
  highlight = false,
}: {
  team: { code: string; shortName: string; primaryColor: string };
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span
        className="inline-flex items-center justify-center rounded-full font-brand"
        style={{
          width: highlight ? 56 : 48,
          height: highlight ? 56 : 48,
          fontSize: highlight ? 18 : 16,
          fontWeight: 700,
          letterSpacing: 0.2,
          backgroundColor: team.primaryColor,
          color: '#fff',
          boxShadow: highlight
            ? `0 0 0 3px var(--md-sys-color-surface-container), 0 0 0 5px ${team.primaryColor}`
            : 'inset 0 0 0 1px rgba(255,255,255,0.16)',
        }}
      >
        {team.shortName.slice(0, 2)}
      </span>
      <span
        style={{
          fontSize: 12,
          fontWeight: highlight ? 700 : 500,
          color: highlight ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-on-surface-variant)',
        }}
      >
        {team.shortName}
      </span>
    </div>
  );
}

function FormDots({ row }: { row: StandingsRow }) {
  const last5 = parseLast5(row);
  return (
    <div className="flex items-center gap-1">
      {last5.map((r, i) => (
        <span
          key={i}
          className="tabular inline-flex items-center justify-center"
          aria-label={r === 'W' ? '승' : r === 'L' ? '패' : '무'}
          style={{
            width: 22,
            height: 22,
            borderRadius: 'var(--md-sys-shape-corner-small)',
            fontFamily: 'var(--md-ref-typeface-mono)',
            fontSize: 11,
            fontWeight: 700,
            ...(r === 'W'
              ? {
                  background: 'var(--md-sys-color-secondary-container)',
                  color: 'var(--md-sys-color-on-secondary-container)',
                }
              : r === 'L'
              ? {
                  background: 'var(--md-sys-color-error-container)',
                  color: 'var(--md-sys-color-on-error-container)',
                }
              : {
                  background: 'transparent',
                  color: 'var(--md-sys-color-on-surface-variant)',
                  border: '1px solid var(--md-sys-color-outline)',
                }),
          }}
        >
          {r}
        </span>
      ))}
    </div>
  );
}

function parseLast5(row: StandingsRow): Array<'W' | 'L' | 'D'> {
  // Deterministic — same seed gives same dots so the page is stable.
  const wRatio = row.winPct;
  const result: Array<'W' | 'L' | 'D'> = [];
  const seed = Math.floor(row.winPct * 1000) + row.rank * 7;
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
  return t.length >= 5 ? t.slice(0, 5) : t;
}
