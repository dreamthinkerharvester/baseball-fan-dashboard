// Design Ref: §5.4 + m3-comp components.jsx StandingsBanner.
// 10팀 가로 스크롤 칩 행 + 마이팀 강조(primary-container ring).

'use client';

import { useState } from 'react';

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
      <div
        className="px-4 py-2"
        aria-busy="true"
        style={{ fontSize: 11, color: 'var(--md-sys-color-on-surface-variant)' }}
      >
        순위 불러오는 중…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        className="flex items-center justify-between gap-2 mx-3 sm:mx-4 my-2 px-3 py-2"
        style={{
          fontSize: 12,
          background: 'var(--md-sys-color-error-container)',
          color: 'var(--md-sys-color-on-error-container)',
          borderRadius: 'var(--md-sys-shape-corner-medium)',
        }}
      >
        <span>순위 불러오기 실패</span>
        <button
          type="button"
          onClick={refresh}
          className="m3-btn"
          style={{
            height: 32,
            padding: '0 12px',
            fontSize: 12,
            background: 'transparent',
            border: '1px solid var(--md-sys-color-on-error-container)',
            color: 'var(--md-sys-color-on-error-container)',
          }}
        >
          다시
        </button>
      </div>
    );
  }

  const rows = data.rows;

  return (
    <section
      aria-label="리그 순위"
      style={{
        borderBottom: '1px solid var(--md-sys-color-outline-variant)',
        background: 'var(--md-sys-color-surface-container-low)',
      }}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-controls="standings-list"
        className="flex w-full items-baseline justify-between px-4 pt-2 pb-1 text-left"
        style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
            color: 'var(--md-sys-color-on-surface-variant)',
          }}
        >
          STANDINGS
        </span>
        <span
          className="tabular"
          style={{ fontSize: 11, color: 'var(--md-sys-color-on-surface-variant)' }}
        >
          {expanded ? '▲ 접기' : `← swipe · ${expanded ? '▲' : '▼'}`}
        </span>
      </button>

      <div
        id="standings-list"
        className="no-scrollbar"
        style={{
          display: 'flex',
          gap: 8,
          padding: '6px 16px 12px',
          overflowX: expanded ? 'visible' : 'auto',
          flexWrap: expanded ? 'wrap' : 'nowrap',
          scrollSnapType: 'x mandatory',
        }}
      >
        {rows.map((row) => {
          const isMyTeam = myTeam && row.teamCode === myTeam;
          const team = TEAMS[row.teamCode];
          return (
            <span
              key={row.teamCode}
              role="listitem"
              aria-current={isMyTeam ? 'true' : undefined}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 10px 6px 6px',
                borderRadius: 9999,
                whiteSpace: 'nowrap',
                fontSize: 12,
                fontWeight: 500,
                scrollSnapAlign: 'start',
                background: isMyTeam
                  ? 'var(--md-sys-color-primary-container)'
                  : 'var(--md-sys-color-surface-container-high)',
                color: isMyTeam
                  ? 'var(--md-sys-color-on-primary-container)'
                  : 'var(--md-sys-color-on-surface)',
                boxShadow: isMyTeam ? '0 0 0 2px var(--md-sys-color-primary)' : 'none',
                flexShrink: 0,
              }}
            >
              <span
                className="tabular"
                style={{
                  fontFamily: 'var(--md-ref-typeface-mono)',
                  fontSize: 11,
                  fontWeight: 700,
                  color: isMyTeam
                    ? 'var(--md-sys-color-on-primary-container)'
                    : 'var(--md-sys-color-on-surface-variant)',
                  marginRight: 2,
                }}
              >
                {row.rank}위
              </span>
              <span
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 9999,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: team.primaryColor,
                  color: '#fff',
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: 0,
                }}
              >
                {team.shortName.slice(0, 2)}
              </span>
              <span style={{ fontWeight: 600 }}>{team.shortName}</span>
              <span
                className="tabular"
                style={{
                  fontFamily: 'var(--md-ref-typeface-mono)',
                  marginLeft: 2,
                  color: isMyTeam
                    ? 'var(--md-sys-color-on-primary-container)'
                    : 'var(--md-sys-color-on-surface-variant)',
                }}
              >
                {row.winPct.toFixed(3).replace(/^0/, '')}
              </span>
            </span>
          );
        })}
      </div>
    </section>
  );
}
