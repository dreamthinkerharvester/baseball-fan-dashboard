// Storybook M4: Prime Season Detection — Design Ref: §2.
// Pure function. No I/O. 100% test coverage required.

import type { PrimeHighlight, PrimeSeason, SeasonRecord } from '@/types';

const TIE_EPSILON = 0.1;
const ROOKIE_THRESHOLD = 3;
const PITCHER_MIN_IP = 100;
const BATTER_MIN_AB = 100;
const MAX_HIGHLIGHTS = 3;

export function detectPrimeSeason(
  seasons: SeasonRecord[],
  isPitcher: boolean,
): PrimeSeason | null {
  if (!seasons || seasons.length === 0) return null;

  if (seasons.length < ROOKIE_THRESHOLD) {
    return buildRookie(seasons, isPitcher);
  }

  return isPitcher ? detectPitcherPrime(seasons) : detectBatterPrime(seasons);
}

function detectBatterPrime(seasons: SeasonRecord[]): PrimeSeason {
  const withWar = seasons.filter((s) => typeof s.war === 'number');
  if (withWar.length > 0) {
    const best = pickByWarThenOps(withWar);
    return toPrime(best, 'WAR', best.war as number);
  }
  const withOps = seasons.filter(
    (s) => typeof s.ops === 'number' && (s.ab ?? 0) >= BATTER_MIN_AB,
  );
  if (withOps.length > 0) {
    const best = pickMaxBy(withOps, (s) => s.ops ?? -Infinity);
    return toPrime(best, 'OPS', best.ops as number);
  }
  return buildRookie(seasons, false);
}

function detectPitcherPrime(seasons: SeasonRecord[]): PrimeSeason {
  const withWar = seasons.filter((s) => typeof s.war === 'number');
  if (withWar.length > 0) {
    const best = pickByWarThenOps(withWar);
    return toPrime(best, 'WAR', best.war as number);
  }
  const withEra = seasons.filter(
    (s) => typeof s.era === 'number' && (s.ip ?? 0) >= PITCHER_MIN_IP,
  );
  if (withEra.length > 0) {
    const best = pickMaxBy(withEra, (s) => -(s.era ?? Infinity));
    return toPrime(best, 'ERA', best.era as number);
  }
  return buildRookie(seasons, true);
}

function pickByWarThenOps(seasons: SeasonRecord[]): SeasonRecord {
  // 1) max WAR
  const maxWar = Math.max(...seasons.map((s) => s.war ?? -Infinity));
  const topByWar = seasons.filter((s) => Math.abs((s.war ?? -Infinity) - maxWar) < TIE_EPSILON);
  if (topByWar.length === 1) return topByWar[0]!;

  // 2) tie on WAR → max OPS
  const maxOps = Math.max(...topByWar.map((s) => s.ops ?? -Infinity));
  const topByOps = topByWar.filter((s) => (s.ops ?? -Infinity) === maxOps);
  if (topByOps.length === 1) return topByOps[0]!;

  // 3) tie on both → most recent
  return topByOps.reduce((a, b) => (a.year >= b.year ? a : b));
}

function pickMaxBy<T>(arr: T[], scoreFn: (t: T) => number): T {
  let best = arr[0]!;
  let bestScore = scoreFn(best);
  for (let i = 1; i < arr.length; i++) {
    const item = arr[i]!;
    const score = scoreFn(item);
    if (score > bestScore) {
      best = item;
      bestScore = score;
    }
  }
  return best;
}

function buildRookie(seasons: SeasonRecord[], isPitcher: boolean): PrimeSeason {
  const latest = seasons.reduce((a, b) => (a.year >= b.year ? a : b));
  const metric: PrimeSeason['metric'] = isPitcher ? 'ERA' : 'OPS';
  const value = (isPitcher ? latest.era : latest.ops) ?? 0;
  return {
    year: latest.year,
    metric,
    value,
    rookieFlag: true,
    highlights: extractHighlights(latest, isPitcher),
  };
}

function toPrime(
  s: SeasonRecord,
  metric: PrimeSeason['metric'],
  value: number,
): PrimeSeason {
  const prime: PrimeSeason = {
    year: s.year,
    metric,
    value,
    rookieFlag: false,
    highlights: extractHighlights(s, metric === 'ERA' || (s.k !== undefined && (s.ip ?? 0) > 0)),
  };
  if (s.rankInLeague) {
    prime.rank = { metric: s.rankInLeague.metric, rankInLeague: s.rankInLeague.rank };
  }
  return prime;
}

export function extractHighlights(
  s: SeasonRecord,
  isPitcher: boolean,
): PrimeHighlight[] {
  const result: PrimeHighlight[] = [];

  if (isPitcher) {
    if (typeof s.k === 'number' && s.k >= 200) {
      result.push({ kpi: '탈삼진', value: `${s.k}K` });
    }
    if (typeof s.era === 'number' && s.era <= 2.5 && (s.ip ?? 0) >= 100) {
      result.push({ kpi: 'ERA', value: s.era.toFixed(2) });
    }
    if (typeof s.war === 'number' && s.war >= 5) {
      result.push({ kpi: 'WAR', value: s.war.toFixed(1) });
    }
  } else {
    if ((s.hr ?? 0) >= 40 && (s.sb ?? 0) >= 40) {
      result.push({ kpi: '40-40', value: '역대급 40-40' });
    } else if ((s.hr ?? 0) >= 30 && (s.sb ?? 0) >= 30) {
      result.push({ kpi: '30-30', value: '30-30 클럽' });
    }
    if ((s.avg ?? 0) >= 0.4) {
      result.push({ kpi: 'AVG', value: `${s.avg!.toFixed(3)} 신드롬` });
    }
    if (typeof s.ops === 'number' && s.ops >= 1.0) {
      result.push({ kpi: 'OPS', value: s.ops.toFixed(3) });
    }
    if (typeof s.war === 'number' && s.war >= 5) {
      result.push({ kpi: 'WAR', value: s.war.toFixed(1) });
    }
    if (typeof s.hr === 'number' && s.hr >= 30 && !result.some((h) => h.kpi === '40-40' || h.kpi === '30-30')) {
      result.push({ kpi: 'HR', value: `${s.hr}홈런` });
    }
  }

  if (s.rankInLeague?.rank === 1) {
    result.unshift({ kpi: '리그 1위', value: `${s.rankInLeague.metric} 1위` });
  }

  return result.slice(0, MAX_HIGHLIGHTS);
}
