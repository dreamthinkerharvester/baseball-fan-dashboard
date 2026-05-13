// Plan SC: 등급 산출 알고리즘 100% coverage. Vitest config의 thresholds로 강제.
// Design Ref: §9 + §8 — 4단계 매핑 + 데이터 부족 분기 + 타자/투수 분기.

import { describe, expect, it } from 'vitest';

import {
  NO_DATA,
  computeBatterGrade,
  computePitcherGrade,
  percentileRankAscending,
  percentileRankDescending,
  percentileToGrade,
} from '@/lib/grade';

import type { RecentGameStat } from '@/types';

// ────────────────────────────────────────────────────────────────────────────
// percentileToGrade
// ────────────────────────────────────────────────────────────────────────────
describe('percentileToGrade', () => {
  it('returns elite at 90+', () => {
    expect(percentileToGrade(95)).toBe('elite');
    expect(percentileToGrade(90)).toBe('elite');
  });

  it('returns rare at 70~89', () => {
    expect(percentileToGrade(89.99)).toBe('rare');
    expect(percentileToGrade(70)).toBe('rare');
  });

  it('returns special at 40~69', () => {
    expect(percentileToGrade(69.99)).toBe('special');
    expect(percentileToGrade(40)).toBe('special');
  });

  it('returns normal at <40', () => {
    expect(percentileToGrade(39.99)).toBe('normal');
    expect(percentileToGrade(0)).toBe('normal');
  });
});

// ────────────────────────────────────────────────────────────────────────────
// percentileRankAscending  (higher value = higher percentile)
// ────────────────────────────────────────────────────────────────────────────
describe('percentileRankAscending', () => {
  it('returns 0 for empty population', () => {
    expect(percentileRankAscending(100, [])).toBe(0);
  });

  it('places value above all', () => {
    // 모든 값보다 큼 → 100
    expect(percentileRankAscending(200, [10, 20, 30])).toBe(100);
  });

  it('places value below all', () => {
    expect(percentileRankAscending(5, [10, 20, 30])).toBe(0);
  });

  it('mid-rank handles ties', () => {
    // value=20, pop=[10,20,30] → lower=1, equal=1 → (1 + 0.5)/3 * 100 = 50
    expect(percentileRankAscending(20, [10, 20, 30])).toBeCloseTo(50, 5);
  });

  it('breaks early after exceeding value (sorted assumption)', () => {
    // 정렬 가정: value=15, pop=[10,20,30] → lower=1, equal=0, break at 20 → 33.33
    expect(percentileRankAscending(15, [10, 20, 30])).toBeCloseTo(33.333, 2);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// percentileRankDescending  (lower value = higher percentile, e.g., FIP/ERA)
// ────────────────────────────────────────────────────────────────────────────
describe('percentileRankDescending', () => {
  it('returns 0 for empty population', () => {
    expect(percentileRankDescending(2.5, [])).toBe(0);
  });

  it('best (lowest) value = high percentile', () => {
    // FIP=1.0이 모든 값보다 작음 → higher=3, equal=0 → 100
    expect(percentileRankDescending(1.0, [2.5, 3.0, 4.0])).toBe(100);
  });

  it('worst (highest) value = low percentile', () => {
    // FIP=5.0이 모든 값보다 큼 → higher=0, equal=0 → 0
    expect(percentileRankDescending(5.0, [2.5, 3.0, 4.0])).toBe(0);
  });

  it('mid-rank handles ties (lower-is-better)', () => {
    // FIP=3.0, pop=[2.5, 3.0, 4.0] → higher=1 (4.0), equal=1, n=3 → (1+0.5)/3*100 = 50
    expect(percentileRankDescending(3.0, [2.5, 3.0, 4.0])).toBeCloseTo(50, 5);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// computeBatterGrade
// ────────────────────────────────────────────────────────────────────────────
function batterGames(count: number, opts: Partial<RecentGameStat> = {}): RecentGameStat[] {
  return Array.from({ length: count }, (_, i) => ({
    playerId: 'P1',
    date: `2026-05-${String(20 - i).padStart(2, '0')}`,
    ab: 4,
    hits: 1,
    ops: 0.85,
    wrcPlus: 130,
    ...opts,
  }));
}

describe('computeBatterGrade', () => {
  const populationWrcPlusAsc = Array.from({ length: 50 }, (_, i) => 50 + i * 2); // 50..148
  const populationOpsAsc = Array.from({ length: 50 }, (_, i) => 0.5 + i * 0.01); // 0.50..0.99

  it('returns NO_DATA when no games and no season fallback', () => {
    const r = computeBatterGrade({
      recentGames: [],
      populationWrcPlusAsc,
      populationOpsAsc,
    });
    expect(r).toEqual(NO_DATA);
    expect(r.sampleSize).toBe(0);
  });

  it('uses recent wRC+ when enough games + populationWrcPlusAsc available', () => {
    const r = computeBatterGrade({
      recentGames: batterGames(10, { wrcPlus: 200 }),
      populationWrcPlusAsc,
      populationOpsAsc,
    });
    expect(r.metric).toBe('wrcPlus');
    expect(r.sampleSize).toBe(10);
    expect(r.grade).toBe('elite'); // 200은 모집단 초과 → 100% percentile
    expect(r.basis).toContain('최근');
    expect(r.basis).toContain('wRC+');
  });

  it('caps recent at GRADE_RECENT_GAMES = 10 even with 15 input games', () => {
    const r = computeBatterGrade({
      recentGames: batterGames(15, { wrcPlus: 130 }),
      populationWrcPlusAsc,
      populationOpsAsc,
    });
    expect(r.sampleSize).toBe(10);
  });

  it('falls back to OPS when wrcPlus all null in recent + populationOpsAsc available', () => {
    const r = computeBatterGrade({
      recentGames: batterGames(10, { wrcPlus: null, ops: 0.95 }),
      populationWrcPlusAsc: [], // wrcPlus 모집단 비어있음
      populationOpsAsc,
    });
    expect(r.metric).toBe('ops');
    expect(r.grade).toBe('elite');
  });

  it('falls back to season wRC+ when recent insufficient (<5 games)', () => {
    const r = computeBatterGrade({
      recentGames: batterGames(3, { wrcPlus: 200 }),
      populationWrcPlusAsc,
      populationOpsAsc,
      seasonWrcPlus: 100,
    });
    expect(r.metric).toBe('wrcPlus');
    expect(r.basis).toContain('시즌 누적');
    // 시즌 wRC+ 100 → 모집단 50..148에서 중간 정도
    expect(['special', 'rare']).toContain(r.grade);
  });

  it('falls back to season OPS when no wrcPlus available anywhere', () => {
    const r = computeBatterGrade({
      recentGames: batterGames(2, { wrcPlus: null }),
      populationWrcPlusAsc: [],
      populationOpsAsc,
      seasonOps: 0.95,
    });
    expect(r.metric).toBe('ops');
    expect(r.basis).toContain('시즌 누적');
  });

  it('returns NO_DATA when recent insufficient and no season fallback', () => {
    expect(
      computeBatterGrade({
        recentGames: batterGames(2, { wrcPlus: null, ops: undefined }),
        populationWrcPlusAsc: [],
        populationOpsAsc: [],
      }),
    ).toEqual(NO_DATA);
  });

  it('returns NO_DATA when recent enough but values undefined and population empty', () => {
    expect(
      computeBatterGrade({
        recentGames: batterGames(10, { wrcPlus: null, ops: undefined }),
        populationWrcPlusAsc: [],
        populationOpsAsc: [],
      }),
    ).toEqual(NO_DATA);
  });

  it('skips wrcPlus path when population is empty even with recent values', () => {
    const r = computeBatterGrade({
      recentGames: batterGames(10, { wrcPlus: 130, ops: 0.85 }),
      populationWrcPlusAsc: [], // 강제 fallback
      populationOpsAsc,
    });
    expect(r.metric).toBe('ops');
  });

  it('basis text includes percentile when computed', () => {
    const r = computeBatterGrade({
      recentGames: batterGames(10, { wrcPlus: 60 }),
      populationWrcPlusAsc,
      populationOpsAsc,
    });
    expect(r.basis).toMatch(/백분위/);
  });

  it('handles a recent set with mixed valid/null wrcPlus', () => {
    const games = batterGames(10).map((g, i) => ({
      ...g,
      wrcPlus: i % 2 === 0 ? 150 : null,
    }));
    const r = computeBatterGrade({
      recentGames: games,
      populationWrcPlusAsc,
      populationOpsAsc,
    });
    // mean of valid (5 entries of 150) = 150 → high percentile
    expect(r.metric).toBe('wrcPlus');
    expect(r.grade).toBe('elite');
  });
});

// ────────────────────────────────────────────────────────────────────────────
// computePitcherGrade
// ────────────────────────────────────────────────────────────────────────────
function pitcherGames(count: number, opts: Partial<RecentGameStat> = {}): RecentGameStat[] {
  return Array.from({ length: count }, (_, i) => ({
    playerId: 'P2',
    date: `2026-05-${String(20 - i).padStart(2, '0')}`,
    ip: 6,
    fip: 3.5,
    era: 3.6,
    ...opts,
  }));
}

describe('computePitcherGrade', () => {
  const populationFipAsc = Array.from({ length: 30 }, (_, i) => 2.0 + i * 0.1); // 2.0..4.9
  const populationEraAsc = Array.from({ length: 30 }, (_, i) => 2.0 + i * 0.1);

  it('returns NO_DATA when no games and no season fallback', () => {
    expect(
      computePitcherGrade({
        recentGames: [],
        populationFipAsc,
        populationEraAsc,
      }),
    ).toEqual(NO_DATA);
  });

  it('lowest FIP gives elite grade', () => {
    const r = computePitcherGrade({
      recentGames: pitcherGames(10, { fip: 1.5 }),
      populationFipAsc,
      populationEraAsc,
    });
    expect(r.metric).toBe('fip');
    expect(r.grade).toBe('elite');
  });

  it('falls back to ERA when fip null in recent + fip pop empty', () => {
    const r = computePitcherGrade({
      recentGames: pitcherGames(10, { fip: null, era: 1.5 }),
      populationFipAsc: [],
      populationEraAsc,
    });
    expect(r.metric).toBe('era');
    expect(r.grade).toBe('elite');
  });

  it('falls back to season FIP when recent insufficient', () => {
    const r = computePitcherGrade({
      recentGames: pitcherGames(3, { fip: 1.5 }),
      populationFipAsc,
      populationEraAsc,
      seasonFip: 4.5,
    });
    expect(r.basis).toContain('시즌 누적');
    expect(r.metric).toBe('fip');
  });

  it('falls back to season ERA when fip absent everywhere', () => {
    const r = computePitcherGrade({
      recentGames: pitcherGames(2, { fip: null }),
      populationFipAsc: [],
      populationEraAsc,
      seasonEra: 4.0,
    });
    expect(r.metric).toBe('era');
    expect(r.basis).toContain('시즌 누적');
  });

  it('returns NO_DATA when nothing available', () => {
    expect(
      computePitcherGrade({
        recentGames: pitcherGames(1),
        populationFipAsc: [],
        populationEraAsc: [],
      }),
    ).toEqual(NO_DATA);
  });

  it('returns NO_DATA when recent enough but values undefined and pop empty', () => {
    expect(
      computePitcherGrade({
        recentGames: pitcherGames(10, { fip: null, era: undefined }),
        populationFipAsc: [],
        populationEraAsc: [],
      }),
    ).toEqual(NO_DATA);
  });

  it('skips fip path when pop empty even with recent values', () => {
    const r = computePitcherGrade({
      recentGames: pitcherGames(10, { fip: 3.0, era: 3.5 }),
      populationFipAsc: [],
      populationEraAsc,
    });
    expect(r.metric).toBe('era');
  });

  it('caps recent at 10 games', () => {
    const r = computePitcherGrade({
      recentGames: pitcherGames(20, { fip: 2.5 }),
      populationFipAsc,
      populationEraAsc,
    });
    expect(r.sampleSize).toBe(10);
  });

  it('handles mixed valid/null FIP in recent', () => {
    const games = pitcherGames(10).map((g, i) => ({
      ...g,
      fip: i % 2 === 0 ? 2.0 : null,
    }));
    const r = computePitcherGrade({
      recentGames: games,
      populationFipAsc,
      populationEraAsc,
    });
    expect(r.metric).toBe('fip');
    expect(r.grade).toBe('elite');
  });

  it('basis includes percentile + KST sample count', () => {
    const r = computePitcherGrade({
      recentGames: pitcherGames(10, { fip: 3.5 }),
      populationFipAsc,
      populationEraAsc,
    });
    expect(r.basis).toMatch(/백분위/);
    expect(r.basis).toMatch(/등판/);
  });
});
