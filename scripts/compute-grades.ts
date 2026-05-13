// Design Ref: §9, §11 (M7) — 매일 새벽 등급 일괄 산출.
//
// 입력: /data/stats/batters.json + /data/stats/pitchers.json (statiz 크롤 결과)
//       + 라인업 캐시 (/data/lineups/{date}/{team}.json) 의 각 LineupSlot
// 출력: 같은 라인업 파일에 grade / gradePercentile / gradeBasis 인플레이스 갱신
//       + /data/_meta/grade-version.json (산출 시각 + 입력 데이터 갱신 시각)
//
// MVP에서는 단순화: 라인업 파일이 이미 grade 필드를 포함한다고 가정 (크롤러가 채움).
// 본 스크립트는 statiz 데이터로 모집단을 만들어 라인업 파일의 grade를 *재계산* 가능하도록 준비.

import { promises as fs } from 'node:fs';
import path from 'node:path';

import { todayKstString } from '@/lib/date';
import {
  cachePaths,
  getDataDir,
  readJsonCache,
  tryReadJsonCache,
  writeJsonCache,
} from '@/lib/data/cache';
import {
  computeBatterGrade,
  computePitcherGrade,
} from '@/lib/grade';

import type {
  BatterSeasonStat,
  Lineup,
  LineupSlot,
  PitcherSeasonStat,
  RecentGameStat,
} from '@/types';

interface Population {
  batterWrcPlusAsc: number[];
  batterOpsAsc: number[];
  pitcherFipAsc: number[];
  pitcherEraAsc: number[];
}

async function loadPopulation(): Promise<Population> {
  const batters = (await tryReadJsonCache<BatterSeasonStat[]>('stats/batters.json'))?.data ?? [];
  const pitchers = (await tryReadJsonCache<PitcherSeasonStat[]>('stats/pitchers.json'))?.data ?? [];
  return {
    batterWrcPlusAsc: batters
      .map((b) => b.wrcPlus)
      .filter((v): v is number => typeof v === 'number')
      .sort((a, b) => a - b),
    batterOpsAsc: batters.map((b) => b.ops).sort((a, b) => a - b),
    pitcherFipAsc: pitchers
      .map((p) => p.fip)
      .filter((v): v is number => typeof v === 'number')
      .sort((a, b) => a - b),
    pitcherEraAsc: pitchers.map((p) => p.era).sort((a, b) => a - b),
  };
}

interface PlayerCacheBundle {
  recentTen: RecentGameStat[];
  isPitcher: boolean;
  seasonOps?: number;
  seasonWrcPlus?: number | null;
  seasonEra?: number;
  seasonFip?: number | null;
}

async function loadPlayerBundle(playerId: string): Promise<PlayerCacheBundle | null> {
  const cache = await tryReadJsonCache<{
    player: { isPitcher: boolean };
    currentSeason: BatterSeasonStat | PitcherSeasonStat;
    recentTen: RecentGameStat[];
  }>(cachePaths.player(playerId));
  if (!cache) return null;
  const { player, currentSeason, recentTen } = cache.data;
  if (player.isPitcher) {
    const cs = currentSeason as PitcherSeasonStat;
    return {
      recentTen,
      isPitcher: true,
      seasonEra: cs.era,
      seasonFip: cs.fip,
    };
  }
  const cs = currentSeason as BatterSeasonStat;
  return {
    recentTen,
    isPitcher: false,
    seasonOps: cs.ops,
    seasonWrcPlus: cs.wrcPlus,
  };
}

async function recomputeLineup(
  lineupPath: string,
  population: Population,
): Promise<{ updated: number; skipped: number }> {
  const cache = await readJsonCache<Lineup>(lineupPath);
  const lineup = cache.data;
  if (lineup.status !== 'confirmed') return { updated: 0, skipped: lineup.battingOrder.length };

  let updated = 0;
  let skipped = 0;
  const slots: LineupSlot[] = [
    ...(lineup.startingPitcher ? [lineup.startingPitcher] : []),
    ...lineup.battingOrder,
  ];
  for (const slot of slots) {
    const bundle = await loadPlayerBundle(slot.playerId);
    if (!bundle) {
      skipped += 1;
      continue;
    }
    if (bundle.isPitcher) {
      const r = computePitcherGrade({
        recentGames: bundle.recentTen,
        populationFipAsc: population.pitcherFipAsc,
        populationEraAsc: population.pitcherEraAsc,
        ...(bundle.seasonEra != null ? { seasonEra: bundle.seasonEra } : {}),
        ...(bundle.seasonFip != null ? { seasonFip: bundle.seasonFip } : {}),
      });
      slot.grade = r.grade;
      slot.gradePercentile = Math.round(r.percentile);
      slot.gradeBasis = r.basis;
    } else {
      const r = computeBatterGrade({
        recentGames: bundle.recentTen,
        populationWrcPlusAsc: population.batterWrcPlusAsc,
        populationOpsAsc: population.batterOpsAsc,
        ...(bundle.seasonOps != null ? { seasonOps: bundle.seasonOps } : {}),
        ...(bundle.seasonWrcPlus != null ? { seasonWrcPlus: bundle.seasonWrcPlus } : {}),
      });
      slot.grade = r.grade;
      slot.gradePercentile = Math.round(r.percentile);
      slot.gradeBasis = r.basis;
    }
    updated += 1;
  }
  // file path는 cache 모듈이 추상화하므로 relativePath로 다시 write.
  await writeJsonCache(lineupPath, lineup);
  return { updated, skipped };
}

async function main(): Promise<number> {
  const date = process.argv[2] ?? todayKstString();
  const population = await loadPopulation();
  if (
    population.batterWrcPlusAsc.length === 0 &&
    population.batterOpsAsc.length === 0 &&
    population.pitcherFipAsc.length === 0 &&
    population.pitcherEraAsc.length === 0
  ) {
    console.error(`No population data — run pnpm crawl:stats first.`);
    return 1;
  }

  const lineupsRoot = path.join(getDataDir(), 'lineups', date);
  let teamFiles: string[] = [];
  try {
    teamFiles = await fs.readdir(lineupsRoot);
  } catch {
    console.warn(`No lineups for ${date}`);
    return 0;
  }

  let totalUpdated = 0;
  let totalSkipped = 0;
  for (const f of teamFiles) {
    if (!f.endsWith('.json')) continue;
    const relativePath = `lineups/${date}/${f}`;
    const r = await recomputeLineup(relativePath, population);
    totalUpdated += r.updated;
    totalSkipped += r.skipped;
    console.log(
      JSON.stringify({
        ts: new Date().toISOString(),
        action: 'compute-grades',
        team: f.replace('.json', ''),
        date,
        updated: r.updated,
        skipped: r.skipped,
      }),
    );
  }

  await writeJsonCache('_meta/grade-version.json', {
    computedAt: new Date().toISOString(),
    date,
    totalUpdated,
    totalSkipped,
    populationSize: {
      batterWrcPlus: population.batterWrcPlusAsc.length,
      batterOps: population.batterOpsAsc.length,
      pitcherFip: population.pitcherFipAsc.length,
      pitcherEra: population.pitcherEraAsc.length,
    },
  });
  return 0;
}

main().then((code) => process.exit(code));
