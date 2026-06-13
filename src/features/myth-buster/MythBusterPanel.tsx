// Design Ref: kia-fan-service §5.3/§5.4 (FR-06) — Myth-Buster 패널.
// "체감(클래식 순위) vs 데이터(세이버 순위)" 갭을 절대값 내림차순으로 노출.
// +갭 = 저평가(초록) / −갭 = 고평가(주황) / 0 = 일치 묶음 하단.

'use client';

import { PendingBadge } from '@/components/ui/PendingBadge';
import { SaberTooltip } from '@/components/ui/SaberTooltip';
import { formatMetric } from '@/lib/saber-glossary';

import { useSaberRankings } from './useSaberRankings';

import type { SaberRankingEntry } from '@/types';

export function MythBusterPanel() {
  const { data, isLoading, notReady, error } = useSaberRankings();

  return (
    <section aria-labelledby="myth-buster-heading" className="px-4 py-2">
      <header style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '8px 0 6px' }}>
        <h2
          id="myth-buster-heading"
          className="font-brand-magu"
          style={{ margin: 0, fontSize: 15, color: 'var(--magu-text-1)' }}
        >
          ⚡ 체감 vs 데이터
        </h2>
        <span style={{ fontSize: 10, color: 'var(--magu-text-3)' }}>
          클래식 순위와 세이버 순위가 다른 선수들
        </span>
      </header>

      {isLoading ? (
        <p style={{ fontSize: 12, color: 'var(--magu-text-3)', padding: '8px 0' }} aria-live="polite">
          불러오는 중…
        </p>
      ) : null}

      {notReady ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: 12,
            borderRadius: 8,
            background: 'var(--magu-panel-deep)',
            border: '1px solid var(--magu-line)',
            fontSize: 12,
            color: 'var(--magu-text-2)',
          }}
        >
          <PendingBadge />
          오늘 아침 데이터를 집계하고 있습니다. 잠시 후 다시 확인해주세요.
        </div>
      ) : null}

      {error ? (
        <p style={{ fontSize: 12, color: 'var(--magu-text-3)', padding: '8px 0' }}>
          갭 데이터를 불러오지 못했습니다.
        </p>
      ) : null}

      {data && data.entries.length > 0 ? (
        <>
          <ul role="list" style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 0, margin: 0, listStyle: 'none' }}>
            {data.entries
              .filter((e) => e.gapScore !== 0)
              .map((e) => (
                <GapRow key={e.playerId} entry={e} />
              ))}
          </ul>
          {/* 갭 0 — "일치" 묶음 */}
          {data.entries.some((e) => e.gapScore === 0) ? (
            <p style={{ margin: '6px 0 0', fontSize: 10, color: 'var(--magu-text-3)' }}>
              일치:{' '}
              {data.entries
                .filter((e) => e.gapScore === 0)
                .map((e) => e.name)
                .join(' · ')}{' '}
              — 체감과 데이터가 같은 선수
            </p>
          ) : null}
          <p style={{ margin: '6px 0 0', fontSize: 9, color: 'var(--magu-text-3)' }}>
            규정 타석/이닝 충족 선수만 · 리그 타자 {data.qualifiedBatters}명 / 투수{' '}
            {data.qualifiedPitchers}명 기준 · 매일 아침 갱신
          </p>
        </>
      ) : null}

      {data && data.entries.length === 0 ? (
        <p style={{ fontSize: 12, color: 'var(--magu-text-3)', padding: '8px 0' }}>
          규정 충족 KIA 선수가 아직 없습니다.
        </p>
      ) : null}
    </section>
  );
}

function GapRow({ entry: e }: { entry: SaberRankingEntry }) {
  const positive = e.gapScore > 0;
  const badgeColor = positive ? '#2EA45A' : '#F4A261';
  const badgeLabel = positive ? '저평가' : '고평가';
  const classicLabel = e.isPitcher ? 'ERA' : '타율';
  const interpretation = positive
    ? e.isPitcher
      ? 'ERA보다 구위 지표가 더 좋습니다'
      : '타율보다 실제 득점 기여가 높습니다'
    : e.isPitcher
      ? '구위 지표는 ERA만큼 좋지 않습니다'
      : '타율 대비 출루·장타 효율이 낮습니다';

  return (
    <li
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        padding: '8px 10px',
        background: 'linear-gradient(180deg, var(--magu-panel-deep), #141B30)',
        border: '1px solid var(--magu-line)',
        borderLeft: `3px solid ${badgeColor}`,
        borderRadius: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--magu-text-1)' }}>{e.name}</span>
        <span
          style={{
            padding: '1px 6px',
            borderRadius: 4,
            fontSize: 9,
            fontWeight: 700,
            background: badgeColor,
            color: '#0F1421',
          }}
        >
          {badgeLabel} {e.gapScore > 0 ? `+${e.gapScore}` : e.gapScore}
        </span>
      </div>
      <div className="font-digit" style={{ fontSize: 11, color: 'var(--magu-text-2)' }}>
        {classicLabel} 리그 {e.classicRank}위 ({formatClassic(e)}) ↔{' '}
        <SaberTooltip metric={e.saberMetric} value={e.saberValue} triggerStyle={{ fontSize: 11 }} /> 리그{' '}
        {e.saberRank}위 ({formatMetric(e.saberMetric, e.saberValue)})
      </div>
      <div style={{ fontSize: 10, color: 'var(--magu-text-3)' }}>{interpretation}</div>
    </li>
  );
}

function formatClassic(e: SaberRankingEntry): string {
  return e.isPitcher ? e.classicValue.toFixed(2) : e.classicValue.toFixed(3).replace(/^0/, '');
}
