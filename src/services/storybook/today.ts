// Storybook M3: Today's Performance — Design Ref: §1.2 + §3.
// Strategy: PlayerDetail의 recentTen에서 target date 매칭. 없으면 fallback recent5.

import { loadPlayerDetail } from '@/lib/data/cache';

import type {
  BatterTodayStat,
  PitcherTodayStat,
  TodayPerformance,
  TodayStat,
} from '@/types';

interface RawBatterRecord {
  date: string;
  ab?: number;
  hits?: number;
  hr?: number;
  rbi?: number;
  bb?: number;
  so?: number;
  ops?: number;
  avg?: number;
}

interface RawPitcherRecord {
  date: string;
  ip?: number;
  er?: number;
  k?: number;
  bb?: number;
  h?: number;
  era?: number;
  whip?: number;
}

interface RawSeason {
  avg?: number;
  era?: number;
}

export async function buildToday(
  playerId: string,
  date: string,
): Promise<TodayPerformance> {
  const cache = await loadPlayerDetail(playerId);
  if (!cache) {
    return emptyToday(date);
  }

  const detail = cache.data;
  const isPitcher = detail.player.isPitcher;
  const recent = (detail.recentTen ?? []) as Array<RawBatterRecord | RawPitcherRecord>;
  const todayRecord = recent.find((r) => r.date === date) ?? null;

  if (!todayRecord) {
    return {
      played: false,
      date,
      vs: null,
      fallbackRecent5: toFallback(recent.slice(0, 5), isPitcher),
    };
  }

  const seasonTrend = computeSeasonTrend(detail.currentSeason as RawSeason, isPitcher);

  if (isPitcher) {
    return {
      played: true,
      date,
      vs: null,
      pitcher: toPitcherToday(todayRecord as RawPitcherRecord),
      seasonTrend,
    };
  }

  return {
    played: true,
    date,
    vs: null,
    batter: toBatterToday(todayRecord as RawBatterRecord),
    seasonTrend,
  };
}

function emptyToday(date: string): TodayPerformance {
  return { played: false, date, vs: null };
}

function toBatterToday(r: RawBatterRecord): BatterTodayStat {
  return {
    date: r.date,
    ab: r.ab ?? 0,
    h: r.hits ?? 0,
    hr: r.hr ?? 0,
    rbi: r.rbi ?? 0,
    bb: r.bb ?? 0,
    so: r.so ?? 0,
    avg: r.avg ?? 0,
    ops: r.ops ?? 0,
  };
}

function toPitcherToday(r: RawPitcherRecord): PitcherTodayStat {
  return {
    date: r.date,
    ip: r.ip ?? 0,
    er: r.er ?? 0,
    k: r.k ?? 0,
    bb: r.bb ?? 0,
    h: r.h ?? 0,
    era: r.era ?? 0,
    whip: r.whip ?? 0,
  };
}

function toFallback(
  records: Array<RawBatterRecord | RawPitcherRecord>,
  isPitcher: boolean,
): TodayStat[] {
  return records.map((r) =>
    isPitcher ? toPitcherToday(r as RawPitcherRecord) : toBatterToday(r as RawBatterRecord),
  );
}

function computeSeasonTrend(
  season: RawSeason | undefined,
  isPitcher: boolean,
): TodayPerformance['seasonTrend'] {
  if (!season) return undefined;
  const metric: 'AVG' | 'ERA' = isPitcher ? 'ERA' : 'AVG';
  const value = isPitcher ? season.era : season.avg;
  if (value === undefined) return undefined;
  // before/after: 실제 일일 변화는 외부 박스스코어와 차분이 필요. 본 MVP는 동일값 표시.
  return { before: value, after: value, metric };
}
