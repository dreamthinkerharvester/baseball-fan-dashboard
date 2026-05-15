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

  // Hot/Cold: 최근 5경기 타율 vs 시즌 타율
  const form = computeRecentForm(isPitcher, currentSeason, recentTen);

  return (
    <div className="flex flex-col gap-4">
      {form && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            borderRadius: 9999,
            alignSelf: 'flex-start',
            background:
              form.trend === 'hot'
                ? 'color-mix(in oklab, var(--md-sys-color-tertiary-container) 60%, transparent)'
                : 'color-mix(in oklab, var(--md-sys-color-surface-container-highest) 80%, transparent)',
            fontSize: 12,
            fontWeight: 700,
            color:
              form.trend === 'hot'
                ? 'var(--md-sys-color-on-tertiary-container)'
                : 'var(--md-sys-color-on-surface-variant)',
          }}
        >
          <span>{form.trend === 'hot' ? '🔥' : form.trend === 'cold' ? '❄️' : '📊'}</span>
          <span>{form.label}</span>
        </div>
      )}
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

interface RecentForm {
  trend: 'hot' | 'cold' | 'neutral';
  label: string;
}

function computeRecentForm(
  isPitcher: boolean,
  currentSeason: Record<string, unknown>,
  recentTen: ReadonlyArray<Record<string, unknown>>,
): RecentForm | null {
  const last5 = recentTen.slice(0, 5);
  if (last5.length < 3) return null;

  if (!isPitcher) {
    const totalAb = last5.reduce((s, g) => s + num(g.ab), 0);
    const totalHits = last5.reduce((s, g) => s + num(g.hits), 0);
    if (totalAb === 0) return null;
    const last5Avg = totalHits / totalAb;
    const seasonAvg = num(currentSeason.avg);
    if (seasonAvg === 0) return null;
    const delta = last5Avg - seasonAvg;
    const trend: RecentForm['trend'] = delta >= 0.05 ? 'hot' : delta <= -0.05 ? 'cold' : 'neutral';
    return {
      trend,
      label: `최근 5경기 타율 ${last5Avg.toFixed(3).replace(/^0/, '')} (시즌 ${seasonAvg.toFixed(3).replace(/^0/, '')})`,
    };
  } else {
    // Pitcher: ERA comparison
    const totalEr = last5.reduce((s, g) => s + num((g as Record<string,unknown>).er), 0);
    const totalIp = last5.reduce((s, g) => s + num((g as Record<string,unknown>).ip), 0);
    if (totalIp < 5) return null;
    const last5Era = (totalEr / totalIp) * 9;
    const seasonEra = num(currentSeason.era);
    if (seasonEra === 0) return null;
    const delta = last5Era - seasonEra;
    const trend: RecentForm['trend'] = delta <= -0.5 ? 'hot' : delta >= 0.5 ? 'cold' : 'neutral';
    return {
      trend,
      label: `최근 5경기 ERA ${last5Era.toFixed(2)} (시즌 ${seasonEra.toFixed(2)})`,
    };
  }
}

function fmt(v: unknown, decimals: number): string {
  if (typeof v !== 'number' || !Number.isFinite(v)) return '—';
  return v.toFixed(decimals);
}

function fmtInt(v: unknown): string {
  if (typeof v !== 'number' || !Number.isFinite(v)) return '—';
  return String(Math.round(v));
}
