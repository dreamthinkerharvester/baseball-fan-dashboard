// Design Ref: §9 (Card Grade System Spec).
// Plan SC: 등급 산출 알고리즘 100% unit coverage 필수 (Pre-mortem F2 — 신뢰성).
//
// Algorithm:
//   1) 최근 N경기 기준 wRC+ (타자) / FIP (투수) 추출. fallback: OPS / ERA.
//   2) 비교 모집단 내 백분위 계산. 데이터 부족 시 명시적으로 부족 상태 반환.
//   3) GRADE_PERCENTILES 임계값으로 4단계 매핑.
//
// 순수 함수. 외부 I/O 없음 — 호출자가 stat과 모집단을 주입.

import {
  GRADE_MIN_GAMES_FOR_RECENT,
  GRADE_PERCENTILES,
  GRADE_RECENT_GAMES,
} from './constants';

import type { Grade, RecentGameStat } from '@/types';

export type MetricKind = 'wrcPlus' | 'ops' | 'fip' | 'era';

export interface GradeResult {
  grade: Grade;
  /** 0~100, 비교 모집단 대비 백분위 (높을수록 우수). */
  percentile: number;
  /** 사용된 metric. fallback 발생 시 표시용. */
  metric: MetricKind;
  /** 사용된 경기 수 (기대=GRADE_RECENT_GAMES, 부족 시 작음). */
  sampleSize: number;
  /** 한국어 사용자 설명 (모달 툴팁/FAQ용). */
  basis: string;
}

/**
 * 데이터 부족으로 등급 산출 불가능한 경우 normal + sampleSize=0 반환.
 * "등급 미산출" UI 분기는 호출 측에서 sampleSize를 보고 결정.
 */
export const NO_DATA: GradeResult = {
  grade: 'normal',
  percentile: 0,
  metric: 'ops',
  sampleSize: 0,
  basis: '데이터 부족 — 등급 미산출',
};

/** percentile (0~100) → Grade. 90↑ elite, 70↑ rare, 40↑ special, else normal. */
export function percentileToGrade(percentile: number): Grade {
  if (percentile >= GRADE_PERCENTILES.elite) return 'elite';
  if (percentile >= GRADE_PERCENTILES.rare) return 'rare';
  if (percentile >= GRADE_PERCENTILES.special) return 'special';
  return 'normal';
}

/**
 * 정렬된 모집단(오름차순)에서 value의 백분위를 계산.
 * Higher-is-better metric 기준. 동률 처리: midrank 방식 (티 처리에 안전).
 *
 *   percentile = (count(p < value) + 0.5 * count(p == value)) / N * 100
 */
export function percentileRankAscending(value: number, sortedPopulation: number[]): number {
  const n = sortedPopulation.length;
  if (n === 0) return 0;
  let lower = 0;
  let equal = 0;
  for (const p of sortedPopulation) {
    if (p < value) lower += 1;
    else if (p === value) equal += 1;
    else break; // sorted asc면 빠른 종료
  }
  return ((lower + 0.5 * equal) / n) * 100;
}

/**
 * Lower-is-better metric (FIP/ERA)의 백분위.
 * Higher percentile = lower stat = better player.
 */
export function percentileRankDescending(value: number, sortedPopulationAsc: number[]): number {
  const n = sortedPopulationAsc.length;
  if (n === 0) return 0;
  let higher = 0;
  let equal = 0;
  for (const p of sortedPopulationAsc) {
    if (p > value) higher += 1;
    else if (p === value) equal += 1;
  }
  return ((higher + 0.5 * equal) / n) * 100;
}

/** 최근 게임 평균. NaN/null/undefined 안전 처리. */
function meanOf(values: ReadonlyArray<number | null | undefined>): number | null {
  const valid = values.filter(
    (v): v is number => typeof v === 'number' && Number.isFinite(v),
  );
  if (valid.length === 0) return null;
  const sum = valid.reduce((acc, v) => acc + v, 0);
  return sum / valid.length;
}

/** 최근 N경기로 자르고 데이터 충분 여부 판정. */
function takeRecent(games: ReadonlyArray<RecentGameStat>): {
  recent: RecentGameStat[];
  enough: boolean;
} {
  const sorted = [...games].sort((a, b) => (a.date < b.date ? 1 : -1));
  const recent = sorted.slice(0, GRADE_RECENT_GAMES);
  const enough = recent.length >= GRADE_MIN_GAMES_FOR_RECENT;
  return { recent, enough };
}

export interface ComputeBatterGradeInput {
  recentGames: ReadonlyArray<RecentGameStat>;
  /** 비교 모집단 wRC+ 값 (오름차순 정렬). 비어있으면 OPS로 fallback. */
  populationWrcPlusAsc: ReadonlyArray<number>;
  populationOpsAsc: ReadonlyArray<number>;
  /** Recent에 데이터 부족 시 fallback할 시즌 누적 스탯. */
  seasonOps?: number;
  seasonWrcPlus?: number | null;
}

export function computeBatterGrade(input: ComputeBatterGradeInput): GradeResult {
  const { recent, enough } = takeRecent(input.recentGames);

  // Path A: 최근 N경기 충분 + wRC+ 가용
  const recentWrcMean = enough ? meanOf(recent.map((g) => g.wrcPlus)) : null;
  if (recentWrcMean !== null && input.populationWrcPlusAsc.length > 0) {
    const pct = percentileRankAscending(recentWrcMean, [...input.populationWrcPlusAsc]);
    return {
      grade: percentileToGrade(pct),
      percentile: pct,
      metric: 'wrcPlus',
      sampleSize: recent.length,
      basis: `최근 ${recent.length}경기 wRC+ 평균 ${recentWrcMean.toFixed(0)} (백분위 ${pct.toFixed(0)})`,
    };
  }

  // Path B: 최근 N경기 충분 + OPS fallback
  const recentOpsMean = enough ? meanOf(recent.map((g) => g.ops)) : null;
  if (recentOpsMean !== null && input.populationOpsAsc.length > 0) {
    const pct = percentileRankAscending(recentOpsMean, [...input.populationOpsAsc]);
    return {
      grade: percentileToGrade(pct),
      percentile: pct,
      metric: 'ops',
      sampleSize: recent.length,
      basis: `최근 ${recent.length}경기 OPS 평균 ${recentOpsMean.toFixed(3)} (백분위 ${pct.toFixed(0)})`,
    };
  }

  // Path C: 데이터 부족 → 시즌 누적 fallback
  if (input.seasonWrcPlus != null && input.populationWrcPlusAsc.length > 0) {
    const pct = percentileRankAscending(input.seasonWrcPlus, [...input.populationWrcPlusAsc]);
    return {
      grade: percentileToGrade(pct),
      percentile: pct,
      metric: 'wrcPlus',
      sampleSize: recent.length,
      basis: `시즌 누적 wRC+ ${input.seasonWrcPlus.toFixed(0)} (최근 경기 부족, 백분위 ${pct.toFixed(0)})`,
    };
  }
  if (input.seasonOps != null && input.populationOpsAsc.length > 0) {
    const pct = percentileRankAscending(input.seasonOps, [...input.populationOpsAsc]);
    return {
      grade: percentileToGrade(pct),
      percentile: pct,
      metric: 'ops',
      sampleSize: recent.length,
      basis: `시즌 누적 OPS ${input.seasonOps.toFixed(3)} (최근 경기 부족, 백분위 ${pct.toFixed(0)})`,
    };
  }

  return NO_DATA;
}

export interface ComputePitcherGradeInput {
  recentGames: ReadonlyArray<RecentGameStat>;
  /** 비교 모집단 FIP (오름차순). lower-is-better. */
  populationFipAsc: ReadonlyArray<number>;
  populationEraAsc: ReadonlyArray<number>;
  seasonEra?: number;
  seasonFip?: number | null;
}

export function computePitcherGrade(input: ComputePitcherGradeInput): GradeResult {
  const { recent, enough } = takeRecent(input.recentGames);

  const recentFipMean = enough ? meanOf(recent.map((g) => g.fip)) : null;
  if (recentFipMean !== null && input.populationFipAsc.length > 0) {
    const pct = percentileRankDescending(recentFipMean, [...input.populationFipAsc]);
    return {
      grade: percentileToGrade(pct),
      percentile: pct,
      metric: 'fip',
      sampleSize: recent.length,
      basis: `최근 ${recent.length}등판 FIP 평균 ${recentFipMean.toFixed(2)} (백분위 ${pct.toFixed(0)})`,
    };
  }

  const recentEraMean = enough ? meanOf(recent.map((g) => g.era)) : null;
  if (recentEraMean !== null && input.populationEraAsc.length > 0) {
    const pct = percentileRankDescending(recentEraMean, [...input.populationEraAsc]);
    return {
      grade: percentileToGrade(pct),
      percentile: pct,
      metric: 'era',
      sampleSize: recent.length,
      basis: `최근 ${recent.length}등판 ERA 평균 ${recentEraMean.toFixed(2)} (백분위 ${pct.toFixed(0)})`,
    };
  }

  if (input.seasonFip != null && input.populationFipAsc.length > 0) {
    const pct = percentileRankDescending(input.seasonFip, [...input.populationFipAsc]);
    return {
      grade: percentileToGrade(pct),
      percentile: pct,
      metric: 'fip',
      sampleSize: recent.length,
      basis: `시즌 누적 FIP ${input.seasonFip.toFixed(2)} (최근 경기 부족, 백분위 ${pct.toFixed(0)})`,
    };
  }
  if (input.seasonEra != null && input.populationEraAsc.length > 0) {
    const pct = percentileRankDescending(input.seasonEra, [...input.populationEraAsc]);
    return {
      grade: percentileToGrade(pct),
      percentile: pct,
      metric: 'era',
      sampleSize: recent.length,
      basis: `시즌 누적 ERA ${input.seasonEra.toFixed(2)} (최근 경기 부족, 백분위 ${pct.toFixed(0)})`,
    };
  }

  return NO_DATA;
}
