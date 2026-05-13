// Design Ref: §5.4 PlayerModal Career Tab — 연도별 시즌 테이블, 5시즌/전체 토글.

'use client';

import { useState } from 'react';

import { Tabs } from '@/components/ui/Tabs';

export interface CareerStatTabProps {
  isPitcher: boolean;
  careerSeasons: ReadonlyArray<Record<string, unknown>>;
}

export function CareerStatTab({ isPitcher, careerSeasons }: CareerStatTabProps) {
  const [showAll, setShowAll] = useState<'recent' | 'all'>('recent');
  const sorted = [...careerSeasons].sort(
    (a, b) => num(b.season) - num(a.season),
  );
  const visible = showAll === 'all' ? sorted : sorted.slice(0, 5);

  if (sorted.length === 0) {
    return (
      <p className="py-6 text-center text-body text-text-muted">
        역대 기록이 없습니다 (첫 시즌 진행 중).
      </p>
    );
  }

  const headers = isPitcher
    ? ['시즌', 'G', 'IP', 'ERA', 'FIP', 'WHIP', 'K/9']
    : ['시즌', 'G', 'AVG', 'OPS', 'wRC+', 'HR', 'RBI'];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end">
        <Tabs
          items={[
            { value: 'recent' as const, label: '최근 5시즌' },
            { value: 'all' as const, label: '전체' },
          ]}
          value={showAll}
          onChange={setShowAll}
          ariaLabel="기록 범위"
        />
      </div>

      <div className="overflow-x-auto rounded-card border border-text-dim/20">
        <table className="w-full text-caption">
          <caption className="sr-only">역대 시즌 기록</caption>
          <thead className="bg-bg-card text-text-muted">
            <tr>
              {headers.map((h) => (
                <th key={h} className="px-2 py-1 text-right first:text-left">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((s, i) => (
              <tr
                key={`${s.season}-${i}`}
                className="border-t border-text-dim/10 odd:bg-bg-panel/50"
              >
                <td className="px-2 py-1 text-left font-bold">{num(s.season)}</td>
                <td className="px-2 py-1 text-right">{fmtInt(s.games)}</td>
                {isPitcher ? (
                  <>
                    <td className="px-2 py-1 text-right">{fmt(s.ip, 1)}</td>
                    <td className="px-2 py-1 text-right">{fmt(s.era, 2)}</td>
                    <td className="px-2 py-1 text-right">{fmt(s.fip, 2)}</td>
                    <td className="px-2 py-1 text-right">{fmt(s.whip, 2)}</td>
                    <td className="px-2 py-1 text-right">{fmt(s.k9, 1)}</td>
                  </>
                ) : (
                  <>
                    <td className="px-2 py-1 text-right">{fmt(s.avg, 3)}</td>
                    <td className="px-2 py-1 text-right">{fmt(s.ops, 3)}</td>
                    <td className="px-2 py-1 text-right">{fmtInt(s.wrcPlus)}</td>
                    <td className="px-2 py-1 text-right">{fmtInt(s.hr)}</td>
                    <td className="px-2 py-1 text-right">{fmtInt(s.rbi)}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function num(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
}
function fmt(v: unknown, d: number): string {
  if (typeof v !== 'number' || !Number.isFinite(v)) return '—';
  return v.toFixed(d);
}
function fmtInt(v: unknown): string {
  if (typeof v !== 'number' || !Number.isFinite(v)) return '—';
  return String(Math.round(v));
}
