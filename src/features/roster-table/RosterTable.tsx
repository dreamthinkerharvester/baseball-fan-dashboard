// Design Ref: kia-fan-service 레이아웃 재편 (2026-06-12 사용자 요청) — 정보 밀집형 로스터 테이블.
// KIA 전체 로스터를 출전순(G desc)으로 타자/투수 분리 표. 행 클릭 → 선수 상세페이지.
// 세이버 컬럼 = 금색 강조, 클래식 컬럼 = ClassicStatCell 블러 (토글 연동).

'use client';

import { useMemo } from 'react';

import { useRouter } from 'next/navigation';
import useSWR from 'swr';

import { PendingBadge } from '@/components/ui/PendingBadge';
import { ClassicStatCell } from '@/features/saber-mode/ClassicStatCell';
import { fetcher } from '@/lib/api-client';
import { formatMetric, SABER_GLOSSARY, type SaberMetricKey } from '@/lib/saber-glossary';

import type { SaberCardEntry } from '@/services/saber';

export function RosterTables() {
  const { data, isLoading } = useSWR<{ entries: SaberCardEntry[] }>('/api/saber-cards', fetcher, {
    revalidateOnFocus: false,
  });
  const router = useRouter();
  const openPlayer = (id: string) => router.push(`/players/${id}`);

  const { batters, pitchers } = useMemo(() => {
    const entries = data?.entries ?? [];
    const byGames = (a: SaberCardEntry, b: SaberCardEntry) => b.games - a.games;
    return {
      batters: entries.filter((e) => !e.isPitcher).sort(byGames),
      pitchers: entries.filter((e) => e.isPitcher).sort(byGames),
    };
  }, [data]);

  if (isLoading) {
    return (
      <p style={{ fontSize: 12, color: 'var(--magu-text-3)', padding: '8px 16px' }} aria-live="polite">
        로스터 불러오는 중…
      </p>
    );
  }
  if (!data) return null;

  return (
    <>
      <RosterSection
        title="🏏 타자"
        sub={`출전순 · ${batters.length}명`}
        entries={batters}
        columns={BATTER_COLUMNS}
        onRowClick={openPlayer}
      />
      <RosterSection
        title="⚾ 투수"
        sub={`출전순 · ${pitchers.length}명`}
        entries={pitchers}
        columns={PITCHER_COLUMNS}
        onRowClick={openPlayer}
      />
    </>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// 컬럼 정의 — saber: 금색 / classic: 블러 / plain: 일반
// ────────────────────────────────────────────────────────────────────────────

interface Column {
  key: string;
  label: string;
  kind: 'saber' | 'classic' | 'plain';
  metric?: SaberMetricKey; // title 툴팁용
  width?: number;
  render: (e: SaberCardEntry) => string | null;
}

const BATTER_COLUMNS: Column[] = [
  { key: 'games', label: 'G', kind: 'plain', width: 34, render: (e) => String(e.games) },
  { key: 'wrcPlus', label: 'wRC+', kind: 'saber', metric: 'wrcPlus', width: 52, render: (e) => fmtOrNull('wrcPlus', e.wrcPlus) },
  { key: 'woba', label: 'wOBA', kind: 'saber', metric: 'woba', width: 50, render: (e) => fmtOrNull('woba', e.woba) },
  { key: 'war', label: 'WAR', kind: 'saber', metric: 'war', width: 44, render: (e) => fmtOrNull('war', e.war) },
  { key: 'babip', label: 'BABIP', kind: 'saber', metric: 'babip', width: 50, render: (e) => fmtOrNull('babip', e.babip) },
  { key: 'kPct', label: 'K%', kind: 'saber', metric: 'kPct', width: 46, render: (e) => fmtOrNull('kPct', e.kPct) },
  { key: 'bbPct', label: 'BB%', kind: 'saber', metric: 'bbPct', width: 46, render: (e) => fmtOrNull('bbPct', e.bbPct) },
  { key: 'avg', label: 'AVG', kind: 'classic', width: 46, render: (e) => (e.avg != null ? e.avg.toFixed(3).replace(/^0/, '') : null) },
  { key: 'ops', label: 'OPS', kind: 'classic', width: 48, render: (e) => (e.ops != null ? e.ops.toFixed(3).replace(/^0/, '') : null) },
  { key: 'hr', label: 'HR', kind: 'classic', width: 34, render: (e) => (e.hr != null ? String(e.hr) : null) },
  { key: 'rbi', label: 'RBI', kind: 'classic', width: 38, render: (e) => (e.rbi != null ? String(e.rbi) : null) },
];

const PITCHER_COLUMNS: Column[] = [
  { key: 'games', label: 'G', kind: 'plain', width: 34, render: (e) => String(e.games) },
  { key: 'fip', label: 'FIP', kind: 'saber', metric: 'fip', width: 46, render: (e) => fmtOrNull('fip', e.fip) },
  { key: 'war', label: 'WAR', kind: 'saber', metric: 'war', width: 44, render: (e) => fmtOrNull('war', e.war) },
  { key: 'kPct', label: 'K%', kind: 'saber', metric: 'kPct', width: 46, render: (e) => fmtOrNull('kPct', e.kPct) },
  { key: 'bbPct', label: 'BB%', kind: 'saber', metric: 'bbPct', width: 46, render: (e) => fmtOrNull('bbPct', e.bbPct) },
  { key: 'babip', label: 'BABIP', kind: 'saber', metric: 'babip', width: 50, render: (e) => fmtOrNull('babip', e.babip) },
  { key: 'whip', label: 'WHIP', kind: 'plain', width: 46, render: (e) => (e.whip != null ? e.whip.toFixed(2) : null) },
  { key: 'era', label: 'ERA', kind: 'classic', width: 46, render: (e) => (e.era != null ? e.era.toFixed(2) : null) },
  { key: 'wl', label: 'W-L', kind: 'classic', width: 42, render: (e) => e.wl },
  { key: 'svHold', label: 'S/H', kind: 'classic', width: 38, render: (e) => e.svHold },
];

function fmtOrNull(key: SaberMetricKey, v: number | null): string | null {
  return v != null ? formatMetric(key, v) : null;
}

// ────────────────────────────────────────────────────────────────────────────

function RosterSection({
  title,
  sub,
  entries,
  columns,
  onRowClick,
}: {
  title: string;
  sub: string;
  entries: SaberCardEntry[];
  columns: Column[];
  onRowClick: (id: string) => void;
}) {
  if (entries.length === 0) return null;
  return (
    <section aria-label={title} className="px-2 py-1 sm:px-4">
      <header style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '8px 4px 4px' }}>
        <h2 className="font-brand-magu" style={{ margin: 0, fontSize: 14, color: 'var(--magu-text-1)' }}>
          {title}
        </h2>
        <span style={{ fontSize: 10, color: 'var(--magu-text-3)' }}>{sub}</span>
      </header>
      <div
        className="no-scrollbar"
        style={{
          overflowX: 'auto',
          border: '1px solid var(--magu-line)',
          borderRadius: 8,
          background: 'linear-gradient(180deg, var(--magu-panel-deep), #121A2E)',
        }}
      >
        <table
          className="font-digit"
          style={{ borderCollapse: 'collapse', width: '100%', minWidth: 720, fontSize: 11 }}
        >
          <thead>
            <tr style={{ borderBottom: '1px solid var(--magu-line-light)' }}>
              <th style={{ ...TH, textAlign: 'left', position: 'sticky', left: 0, zIndex: 2, background: '#1B2440', minWidth: 96 }}>
                선수
              </th>
              {columns.map((c) => (
                <th
                  key={c.key}
                  title={c.metric ? SABER_GLOSSARY[c.metric].oneLiner : undefined}
                  style={{
                    ...TH,
                    minWidth: c.width,
                    color: c.kind === 'saber' ? 'var(--magu-gold)' : 'var(--magu-text-3)',
                    cursor: c.metric ? 'help' : undefined,
                  }}
                >
                  {c.label}
                </th>
              ))}
              <th style={{ ...TH, textAlign: 'left', minWidth: 150 }}>최근 근황</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr
                key={e.playerId}
                onClick={() => onRowClick(e.playerId)}
                style={{ borderBottom: '1px solid var(--magu-line)', cursor: 'pointer' }}
              >
                <td
                  style={{
                    ...TD,
                    textAlign: 'left',
                    position: 'sticky',
                    left: 0,
                    zIndex: 1,
                    background: '#1B2440',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span style={{ fontWeight: 900, color: 'var(--magu-text-1)' }}>{e.name}</span>
                  <span style={{ marginLeft: 4, fontSize: 9, color: 'var(--magu-text-3)' }}>
                    {e.position}
                    {e.uniformNumber != null ? ` #${e.uniformNumber}` : ''}
                  </span>
                </td>
                {columns.map((c) => {
                  const v = c.render(e);
                  return (
                    <td
                      key={c.key}
                      style={{
                        ...TD,
                        color:
                          c.kind === 'saber'
                            ? 'var(--magu-gold)'
                            : c.kind === 'classic'
                              ? 'var(--magu-text-2)'
                              : 'var(--magu-text-2)',
                        fontWeight: c.kind === 'saber' ? 700 : 400,
                      }}
                    >
                      {v == null ? (
                        c.kind === 'saber' ? <PendingBadge /> : '—'
                      ) : c.kind === 'classic' ? (
                        <ClassicStatCell showLock={false}>{v}</ClassicStatCell>
                      ) : (
                        v
                      )}
                    </td>
                  );
                })}
                <td style={{ ...TD, textAlign: 'left', fontSize: 10, color: 'var(--magu-text-3)', whiteSpace: 'nowrap' }}>
                  {e.recentForm ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const TH: React.CSSProperties = {
  padding: '5px 6px',
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: 0.3,
  textAlign: 'right',
  whiteSpace: 'nowrap',
};

const TD: React.CSSProperties = {
  padding: '4px 6px',
  textAlign: 'right',
  whiteSpace: 'nowrap',
};
