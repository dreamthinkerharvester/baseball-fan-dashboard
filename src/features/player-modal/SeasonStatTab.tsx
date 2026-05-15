// Design Ref: §5.4 PlayerModal Season Tab + m3-comp Screen2 stats grid.

'use client';

import { MiniSparkline } from '@/components/ui/MiniSparkline';

import type { Grade } from '@/types';

export interface SeasonStatTabProps {
  isPitcher: boolean;
  currentSeason: Record<string, unknown>;
  recentTen: ReadonlyArray<Record<string, unknown>>;
  grade: Grade;
}

export function SeasonStatTab({
  isPitcher,
  currentSeason,
  recentTen,
  grade,
}: SeasonStatTabProps) {
  const cells = isPitcher ? buildPitcherCells(currentSeason) : buildBatterCells(currentSeason);
  const sparkValues = recentTen.map((g) =>
    isPitcher ? num(g.fip ?? g.era) : num(g.ops ?? g.wrcPlus),
  );

  return (
    <div className="flex flex-col gap-4">
      <dl className="grid grid-cols-3 gap-2 sm:grid-cols-5" style={{ margin: 0 }}>
        {cells.map((c) => (
          <div key={c.label} className="m3-kpi-cell">
            <dt className="m3-kpi-label">{c.label}</dt>
            <dd
              className="m3-kpi-value"
              style={{ margin: 0, color: `var(--grade-${grade})` }}
            >
              {c.value}
            </dd>
          </div>
        ))}
      </dl>

      {sparkValues.length > 0 && (
        <div
          className="m3-card"
          style={{
            padding: 14,
            background: 'var(--md-sys-color-surface-container-highest)',
            borderRadius: 'var(--md-sys-shape-corner-medium)',
          }}
        >
          <div
            className="flex items-baseline justify-between"
            style={{ marginBottom: 8 }}
          >
            <span
              className="font-brand"
              style={{ fontSize: 13, fontWeight: 600, color: 'var(--md-sys-color-on-surface)' }}
            >
              최근 {recentTen.length}경기 트렌드
            </span>
            <span
              className="tabular"
              style={{ fontSize: 11, color: 'var(--md-sys-color-on-surface-variant)' }}
            >
              {isPitcher ? 'FIP/ERA' : 'OPS/wRC+'}
            </span>
          </div>
          <MiniSparkline
            values={sparkValues}
            grade={grade}
            ariaLabel={`최근 ${recentTen.length}경기 ${isPitcher ? 'FIP/ERA' : 'OPS/wRC+'} 추이`}
            height={42}
          />
          <div className="flex justify-between" style={{ paddingTop: 6 }}>
            <span
              className="tabular"
              style={{ fontSize: 11, color: 'var(--md-sys-color-on-surface-variant)' }}
            >
              {recentTen.length}G ago
            </span>
            <span
              className="tabular"
              style={{ fontSize: 11, color: 'var(--md-sys-color-on-surface-variant)' }}
            >
              오늘
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

interface Cell {
  label: string;
  value: string;
}

function buildBatterCells(s: Record<string, unknown>): Cell[] {
  return [
    { label: 'AVG', value: fmt(s.avg, 3) },
    { label: 'OPS', value: fmt(s.ops, 3) },
    { label: 'wRC+', value: fmtInt(s.wrcPlus) },
    { label: 'HR', value: fmtInt(s.hr) },
    { label: 'RBI', value: fmtInt(s.rbi) },
  ];
}

function buildPitcherCells(s: Record<string, unknown>): Cell[] {
  return [
    { label: 'ERA', value: fmt(s.era, 2) },
    { label: 'FIP', value: fmt(s.fip, 2) },
    { label: 'WHIP', value: fmt(s.whip, 2) },
    { label: 'K/9', value: fmt(s.k9, 1) },
    { label: 'BB/9', value: fmt(s.bb9, 1) },
  ];
}

function num(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
}

function fmt(v: unknown, decimals: number): string {
  if (typeof v !== 'number' || !Number.isFinite(v)) return '—';
  return v.toFixed(decimals);
}

function fmtInt(v: unknown): string {
  if (typeof v !== 'number' || !Number.isFinite(v)) return '—';
  return String(Math.round(v));
}
