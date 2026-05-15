// KIA 최근 10경기 카드 — 사용자 요청 (2): 상대팀, W-L, 점수, 선발투수, HR.

'use client';

import useSWR from 'swr';

import { fetcher } from '@/lib/api-client';
import { TEAMS } from '@/lib/constants';

import type { TeamCode } from '@/types';

interface KiaGameSummary {
  date: string;
  opponent: TeamCode | null;
  opponentName: string;
  isHome: boolean | null;
  stadium: string | null;
  result: 'W' | 'L' | 'D' | null;
  score: { kia: number; opp: number } | null;
  startingPitcher: { id: string; name: string } | null;
  homers: Array<{ id: string; name: string; count: number }>;
  totalAb: number;
  totalHits: number;
}

interface RecentResp {
  team: TeamCode;
  games: KiaGameSummary[];
}

export function KiaRecent10() {
  const { data, error, isLoading } = useSWR<RecentResp>('/api/recent-games', fetcher);

  if (isLoading) {
    return <Skeleton />;
  }
  if (error || !data) {
    return null;
  }
  const games = data.games;
  if (games.length === 0) return null;

  const wins = games.filter((g) => g.result === 'W').length;
  const losses = games.filter((g) => g.result === 'L').length;
  const draws = games.filter((g) => g.result === 'D').length;

  return (
    <section
      className="m3-card mx-3 my-3 sm:mx-4"
      aria-label="KIA 최근 10경기"
      style={{
        padding: 14,
        background: 'var(--md-sys-color-surface-container)',
        borderRadius: 'var(--md-sys-shape-corner-large)',
      }}
    >
      <header
        className="flex items-baseline justify-between"
        style={{ marginBottom: 10 }}
      >
        <h2
          className="font-brand"
          style={{
            margin: 0,
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: -0.2,
            color: 'var(--md-sys-color-on-surface)',
          }}
        >
          KIA 최근 10경기
        </h2>
        <span
          className="tabular"
          style={{
            fontSize: 11,
            fontFamily: 'var(--md-ref-typeface-mono)',
            color: 'var(--md-sys-color-on-surface-variant)',
          }}
        >
          {wins}승 {draws}무 {losses}패
        </span>
      </header>

      {/* Win/loss strip */}
      <div className="flex gap-1 mb-3 flex-wrap">
        {games.map((g) => (
          <span
            key={g.date}
            title={`${g.date} vs ${g.opponentName} ${g.score?.kia ?? '?'}-${g.score?.opp ?? '?'}`}
            style={{
              width: 18,
              height: 18,
              borderRadius: 4,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 9,
              fontWeight: 700,
              fontFamily: 'var(--md-ref-typeface-mono)',
              background:
                g.result === 'W'
                  ? 'var(--md-sys-color-secondary-container)'
                  : g.result === 'L'
                  ? 'var(--md-sys-color-error-container)'
                  : 'var(--md-sys-color-surface-container-high)',
              color:
                g.result === 'W'
                  ? 'var(--md-sys-color-on-secondary-container)'
                  : g.result === 'L'
                  ? 'var(--md-sys-color-on-error-container)'
                  : 'var(--md-sys-color-on-surface-variant)',
            }}
          >
            {g.result ?? '·'}
          </span>
        ))}
      </div>

      {/* Game rows */}
      <ul
        style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column' }}
      >
        {games.map((g, i) => {
          const oppMeta = g.opponent ? TEAMS[g.opponent] : null;
          return (
            <li
              key={g.date}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 0',
                borderTop: i === 0 ? 'none' : '1px solid var(--md-sys-color-outline-variant)',
              }}
            >
              {/* Date */}
              <span
                className="tabular"
                style={{
                  fontFamily: 'var(--md-ref-typeface-mono)',
                  fontSize: 11,
                  width: 36,
                  flexShrink: 0,
                  color: 'var(--md-sys-color-on-surface-variant)',
                }}
              >
                {formatMd(g.date)}
              </span>

              {/* Result chip */}
              <span
                className="tabular"
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 4,
                  flexShrink: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 800,
                  fontFamily: 'var(--md-ref-typeface-mono)',
                  background:
                    g.result === 'W'
                      ? 'var(--md-sys-color-secondary-container)'
                      : g.result === 'L'
                      ? 'var(--md-sys-color-error-container)'
                      : 'transparent',
                  color:
                    g.result === 'W'
                      ? 'var(--md-sys-color-on-secondary-container)'
                      : g.result === 'L'
                      ? 'var(--md-sys-color-on-error-container)'
                      : 'var(--md-sys-color-on-surface-variant)',
                }}
              >
                {g.result ?? '·'}
              </span>

              {/* Opponent */}
              <span className="flex items-center gap-1.5" style={{ flexShrink: 0 }}>
                <span
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 9999,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: oppMeta?.primaryColor ?? 'var(--md-sys-color-outline)',
                    color: '#fff',
                    fontSize: 8,
                    fontWeight: 800,
                  }}
                >
                  {(oppMeta?.shortName ?? g.opponentName).slice(0, 2)}
                </span>
                <span style={{ fontSize: 12, fontWeight: 600 }}>
                  {g.isHome === true ? 'vs ' : g.isHome === false ? '@ ' : ''}
                  {oppMeta?.shortName ?? g.opponentName}
                </span>
              </span>

              {/* Score */}
              <span
                className="tabular"
                style={{
                  fontFamily: 'var(--md-ref-typeface-mono)',
                  fontSize: 12,
                  fontWeight: 700,
                  width: 44,
                  textAlign: 'center',
                  flexShrink: 0,
                  color: 'var(--md-sys-color-on-surface)',
                }}
              >
                {g.score ? `${g.score.kia}-${g.score.opp}` : '—'}
              </span>

              {/* SP + HR (right aligned, truncates) */}
              <span
                style={{
                  marginLeft: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: 1,
                  minWidth: 0,
                  fontSize: 10,
                  lineHeight: '12px',
                  color: 'var(--md-sys-color-on-surface-variant)',
                  textAlign: 'right',
                }}
              >
                {g.startingPitcher && (
                  <span
                    style={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: 110,
                    }}
                    title={`선발 ${g.startingPitcher.name}`}
                  >
                    SP {g.startingPitcher.name}
                  </span>
                )}
                {g.homers.length > 0 && (
                  <span
                    style={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: 110,
                      color: 'var(--md-sys-color-tertiary)',
                      fontWeight: 600,
                    }}
                    title={`HR ${g.homers.map((h) => `${h.name}${h.count > 1 ? ` x${h.count}` : ''}`).join(', ')}`}
                  >
                    HR {g.homers.map((h) => h.name).join(', ')}
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Skeleton() {
  return (
    <section
      className="m3-card mx-3 my-3 sm:mx-4"
      style={{
        padding: 14,
        background: 'var(--md-sys-color-surface-container)',
        borderRadius: 'var(--md-sys-shape-corner-large)',
        color: 'var(--md-sys-color-on-surface-variant)',
        fontSize: 13,
      }}
    >
      최근 10경기 불러오는 중…
    </section>
  );
}

function formatMd(iso: string): string {
  const m = iso.slice(5, 7).replace(/^0/, '');
  const d = iso.slice(8, 10).replace(/^0/, '');
  return `${m}/${d}`;
}
