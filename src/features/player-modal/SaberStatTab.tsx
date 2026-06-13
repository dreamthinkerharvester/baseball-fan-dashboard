// Design Ref: kia-fan-service §5.4 (FR-03/05) — 모달 세이버 탭 (디폴트).
// 세이버 지표 그리드 + 지표명 탭 시 인라인 교육 툴팁 + null = "집계 중".
// 기존 SeasonStatTab의 최근 폼/스파크라인 로직 계승.

'use client';

import { MiniSparkline } from '@/components/ui/MiniSparkline';
import { PendingBadge } from '@/components/ui/PendingBadge';
import { SaberTooltip } from '@/components/ui/SaberTooltip';
import { formatMetric, type SaberMetricKey } from '@/lib/saber-glossary';

import type { Grade } from '@/types';

export interface SaberStatTabProps {
  isPitcher: boolean;
  currentSeason: Record<string, unknown>;
  recentTen: ReadonlyArray<Record<string, unknown>>;
  grade: Grade;
}

export function SaberStatTab({ isPitcher, currentSeason, recentTen, grade }: SaberStatTabProps) {
  const cells: { key: SaberMetricKey; value: number | null }[] = isPitcher
    ? [
        { key: 'fip', value: numOrNull(currentSeason.fip) },
        { key: 'war', value: numOrNull(currentSeason.war) },
        { key: 'kPct', value: numOrNull(currentSeason.kPct) },
        { key: 'bbPct', value: numOrNull(currentSeason.bbPct) },
        { key: 'babip', value: numOrNull(currentSeason.babip) },
      ]
    : [
        { key: 'wrcPlus', value: numOrNull(currentSeason.wrcPlus) },
        { key: 'woba', value: numOrNull(currentSeason.woba) },
        { key: 'war', value: numOrNull(currentSeason.war) },
        { key: 'babip', value: numOrNull(currentSeason.babip) },
        { key: 'kPct', value: numOrNull(currentSeason.kPct) },
        { key: 'bbPct', value: numOrNull(currentSeason.bbPct) },
      ];

  const sparkValues = recentTen.map((g) =>
    isPitcher ? num(g.fip ?? g.era) : num(g.ops ?? g.wrcPlus),
  );

  return (
    <div className="flex flex-col gap-4">
      {/* 정박 기준 안내 (FR-05 — "리그평균 100 기준" 상시 노출) */}
      <p
        style={{
          margin: 0,
          fontSize: 11,
          color: 'var(--md-sys-color-on-surface-variant)',
        }}
      >
        {isPitcher
          ? 'FIP는 낮을수록 좋습니다. 지표명을 누르면 설명이 표시됩니다.'
          : 'wRC+·OPS+는 리그평균 = 100 기준. 지표명을 누르면 설명이 표시됩니다.'}
      </p>

      <dl className="grid grid-cols-3 gap-2 sm:grid-cols-6" style={{ margin: 0 }}>
        {cells.map((c) => (
          <div key={c.key} className="m3-kpi-cell">
            <dt className="m3-kpi-label">
              <SaberTooltip metric={c.key} value={c.value} triggerStyle={{ fontSize: 'inherit' }} />
            </dt>
            <dd className="m3-kpi-value" style={{ margin: 0, color: `var(--grade-${grade})` }}>
              {c.value !== null ? formatMetric(c.key, c.value) : <PendingBadge />}
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
          <div className="flex items-baseline justify-between" style={{ marginBottom: 8 }}>
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
            <span className="tabular" style={{ fontSize: 11, color: 'var(--md-sys-color-on-surface-variant)' }}>
              {recentTen.length}G ago
            </span>
            <span className="tabular" style={{ fontSize: 11, color: 'var(--md-sys-color-on-surface-variant)' }}>
              오늘
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function num(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0;
}

/** 0은 네이버 미산출 표기일 가능성 → null 취급 ("집계 중"). */
function numOrNull(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) && v !== 0 ? v : null;
}
