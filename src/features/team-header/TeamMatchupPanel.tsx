// Magu Magu 라이브 전광판 + 시즌 핵심 지표 패널.
// 좌:KIA 엠블럼 / 중:스코어보드 / 우:상대팀 엠블럼 — 16:9 압축 카드.

'use client';

import useSWR from 'swr';

import { useStandings } from '@/features/league-standings/hooks/useStandings';
import { fetcher } from '@/lib/api-client';
import { icon, teamEmblem } from '@/lib/assets-magu';
import { TEAMS } from '@/lib/constants';
import { todayKstString } from '@/lib/date';

import type { Game, TeamCode } from '@/types';

const SEASON_GAMES = 144;

export interface TeamMatchupPanelProps {
  team: TeamCode;
}

export function TeamMatchupPanel({ team }: TeamMatchupPanelProps) {
  const teamMeta = TEAMS[team];
  const today = todayKstString();
  const { data: standingsData } = useStandings();
  const { data: games } = useSWR<Game[]>(`/api/games?range=day&date=${today}`, fetcher);

  const standings = standingsData?.rows;
  const myRow = standings?.find((r) => r.teamCode === team) ?? null;
  const todayGame = (games ?? []).find((g) => g.homeTeam === team || g.awayTeam === team);
  const opponent = todayGame
    ? todayGame.homeTeam === team
      ? TEAMS[todayGame.awayTeam]
      : TEAMS[todayGame.homeTeam]
    : null;
  const opponentRow = standings && opponent
    ? standings.find((r) => r.teamCode === opponent.code)
    : null;
  const isHome = todayGame ? todayGame.homeTeam === team : false;

  const playedGames = myRow ? myRow.wins + myRow.losses + myRow.draws : 0;
  const progressPct = Math.min(100, Math.round((playedGames / SEASON_GAMES) * 100));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '8px' }}>
      {/* 1. 라이브 스코어 전광판 */}
      <section
        aria-label={`${teamMeta.name} 매치업 헤더`}
        style={{
          padding: '10px 12px',
          borderRadius: 14,
          background:
            'repeating-linear-gradient(0deg, rgba(0,0,0,.18) 0 1px, transparent 1px 3px), linear-gradient(160deg, #1F2A4A, #0F1730)',
          border: '1px solid var(--magu-line-light)',
          boxShadow: 'var(--magu-shadow-card)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* 상단 메타 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, position: 'relative' }}>
          {todayGame ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '2px 6px',
                borderRadius: 4,
                background: 'var(--magu-kia-red)',
                color: '#fff',
                fontSize: 9,
                fontWeight: 900,
                letterSpacing: 0.5,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#fff',
                  animation: 'spin 1s infinite',
                }}
              />
              오늘
            </span>
          ) : (
            <span style={{ fontSize: 9, color: 'var(--magu-text-3)', fontWeight: 700 }}>휴식일</span>
          )}
          <span className="font-digit" style={{ fontSize: 10, color: 'var(--magu-text-3)' }}>
            {today.slice(5).replace('-', '/')}
            {todayGame ? ` · ${formatGameTime(todayGame.startTime)}` : ''}
          </span>
          {todayGame?.stadium ? (
            <span
              style={{
                marginLeft: 'auto',
                fontSize: 10,
                color: 'var(--magu-text-2)',
                display: 'flex',
                alignItems: 'center',
                gap: 3,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={icon('baseball')} alt="" width={12} height={12} className="magu-pixel" />
              {todayGame.stadium}
            </span>
          ) : null}
        </div>

        {/* 메인 그리드: 마이팀 / VS 또는 스코어 / 상대팀 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            gap: 8,
            alignItems: 'center',
            position: 'relative',
          }}
        >
          {/* 좌: 마이팀 */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={teamEmblem(team)}
              alt={teamMeta.name}
              width={56}
              height={56}
              className="magu-pixel"
              style={{ filter: 'drop-shadow(0 2px 0 rgba(0,0,0,.5))' }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
              {myRow ? (
                <>
                  <span
                    style={{
                      background: 'var(--magu-gold)',
                      color: '#2A1A00',
                      padding: '0 5px',
                      borderRadius: 4,
                      fontWeight: 900,
                      fontSize: 9,
                    }}
                  >
                    {myRow.rank}위
                  </span>
                  <span className="font-digit" style={{ color: 'var(--magu-text-2)' }}>
                    {myRow.winPct.toFixed(3).replace(/^0/, '')}
                  </span>
                </>
              ) : (
                <span style={{ color: 'var(--magu-text-3)' }}>로딩…</span>
              )}
            </div>
          </div>

          {/* 중: 스코어보드 또는 VS */}
          {todayGame ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                padding: '4px 10px',
                background: '#000',
                borderRadius: 10,
                border: '2px solid #333',
                minWidth: 88,
                boxShadow: '0 0 0 1px rgba(255,255,255,.08) inset, 0 4px 0 #000',
              }}
            >
              <div
                className="font-digit"
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 4,
                  fontSize: 28,
                  lineHeight: 1,
                  color: 'var(--magu-gold)',
                  textShadow: '0 0 6px rgba(255,201,60,.6), 0 0 12px rgba(255,201,60,.3)',
                }}
              >
                <span>{formatScore(isHome ? todayGame.homeScore : todayGame.awayScore)}</span>
                <span style={{ fontSize: 14, color: 'var(--magu-text-3)' }}>:</span>
                <span>{formatScore(isHome ? todayGame.awayScore : todayGame.homeScore)}</span>
              </div>
              <div style={{ fontSize: 9, color: 'var(--magu-sky)', letterSpacing: 0.5, marginTop: 2 }}>
                {isHome ? '🏠 홈경기' : '✈ 원정경기'}
              </div>
            </div>
          ) : (
            <div
              style={{
                fontFamily: "'Black Han Sans', sans-serif",
                fontSize: 32,
                color: 'var(--magu-text-3)',
                letterSpacing: -1,
                padding: '0 8px',
              }}
            >
              VS
            </div>
          )}

          {/* 우: 상대팀 */}
          {opponent ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={teamEmblem(opponent.code as TeamCode)}
                alt={opponent.name}
                width={56}
                height={56}
                className="magu-pixel"
                style={{ filter: 'drop-shadow(0 2px 0 rgba(0,0,0,.5))' }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
                {opponentRow ? (
                  <>
                    <span className="font-digit" style={{ color: 'var(--magu-text-2)' }}>
                      {opponentRow.winPct.toFixed(3).replace(/^0/, '')}
                    </span>
                    <span
                      style={{
                        background: 'var(--magu-silver)',
                        color: '#1A1F33',
                        padding: '0 5px',
                        borderRadius: 4,
                        fontWeight: 900,
                        fontSize: 9,
                      }}
                    >
                      {opponentRow.rank}위
                    </span>
                  </>
                ) : (
                  <span style={{ color: 'var(--magu-text-3)' }}>—</span>
                )}
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--magu-text-3)', fontSize: 11, textAlign: 'right' }}>경기 없음</div>
          )}
        </div>
      </section>

      {/* 2. 빠른 통계 4셀 */}
      {myRow ? (
        <section
          aria-label="시즌 핵심 지표"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}
        >
          <QsCell label="순위" value={`${myRow.rank}`} sub="10팀중" tone="gold" />
          <QsCell
            label="승률"
            value={myRow.winPct.toFixed(3).replace(/^0/, '')}
            sub={myRow.winPct >= 0.5 ? '＞.500' : '＜.500'}
          />
          <QsCell label="연속" value={formatStreak(myRow.streak)} sub="최근" tone={streakTone(myRow.streak)} />
          <QsCell
            label="게임차"
            value={myRow.gamesBehind === 0 ? '-' : `${myRow.gamesBehind}`}
            sub={myRow.rank === 1 ? '1위' : '위팀'}
          />
        </section>
      ) : null}

      {/* 3. 시즌 진행 HP바 */}
      {myRow ? (
        <section className="magu-panel" style={{ padding: '10px 12px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 6,
              gap: 6,
            }}
          >
            <span style={{ fontSize: 11, color: 'var(--magu-text-2)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={icon('baseball')} alt="" width={16} height={16} className="magu-pixel" />
              시즌 진행 {playedGames} / {SEASON_GAMES} 경기
            </span>
            <span className="font-digit" style={{ fontSize: 14, color: 'var(--magu-gold)' }}>
              {myRow.wins}승 {myRow.draws}무 {myRow.losses}패
            </span>
          </div>
          <div className="magu-hpbar">
            <div className="fill" style={{ width: `${progressPct}%` }} />
          </div>
        </section>
      ) : null}
    </div>
  );
}

function QsCell({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: 'gold' | 'green' | 'red';
}) {
  const color =
    tone === 'gold'
      ? 'var(--magu-gold)'
      : tone === 'green'
        ? '#6EE890'
        : tone === 'red'
          ? '#FF7A7E'
          : 'var(--magu-text-1)';
  return (
    <div
      style={{
        padding: '6px 4px 8px',
        borderRadius: 10,
        background: 'linear-gradient(180deg, var(--magu-panel), var(--magu-panel-deep))',
        border: '1px solid var(--magu-line)',
        boxShadow: '0 2px 0 #0A0F1C',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 9, color: 'var(--magu-text-3)', letterSpacing: 0.3 }}>{label}</div>
      <div className="font-digit" style={{ fontSize: 18, lineHeight: 1, marginTop: 3, color }}>
        {value}
      </div>
      {sub ? (
        <div style={{ fontSize: 8, color: 'var(--magu-gold)', marginTop: 2, letterSpacing: 0.3 }}>{sub}</div>
      ) : null}
    </div>
  );
}

function streakTone(streak: string | null | undefined): 'green' | 'red' | 'gold' | undefined {
  if (!streak) return undefined;
  if (streak.includes('승')) return 'green';
  if (streak.includes('패')) return 'red';
  return 'gold';
}

function formatStreak(streak: string | null | undefined): string {
  if (!streak) return '-';
  return streak;
}

function formatGameTime(t: string | null | undefined): string {
  if (!t) return '시간 미정';
  return t.length >= 5 ? t.slice(0, 5) : t;
}

function formatScore(s: number | null | undefined): string {
  if (s == null) return '-';
  return String(s);
}
