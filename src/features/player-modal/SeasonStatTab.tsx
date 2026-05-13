// Design Ref: §5.4 PlayerModal Season Tab — 5개 지표 + 최근 10경기 sparkline.

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
    <div className="space-y-4">
      <dl className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {cells.map((c) => (
          <div
            key={c.label}
            className="rounded-card border border-text-dim/20 bg-bg-card p-2 text-center"
          >
            <dt className="text-caption text-text-muted">{c.label}</dt>
            <dd
              className="text-heading font-bold"
              style={{ color: `var(--grade-${grade})` }}
            >
              {c.value}
            </dd>
          </div>
        ))}
      </dl>

      <div>
        <h4 className="mb-2 text-caption text-text-muted">
          최근 {recentTen.length}경기 트렌드
        </h4>
        <MiniSparkline
          values={sparkValues}
          grade={grade}
          ariaLabel={`최근 ${recentTen.length}경기 ${isPitcher ? 'FIP/ERA' : 'OPS/wRC+'} 추이`}
          height={40}
        />
      </div>
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
