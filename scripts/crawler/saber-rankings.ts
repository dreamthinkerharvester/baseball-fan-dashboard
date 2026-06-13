// Design Ref: kia-fan-service §2.2, §3.1 — Myth-Buster 갭 스코어 산출 + KIA 세이버 캐시 보강.
//
// 파이프라인 (매일 06:30 KST GHA):
//   1) KBO 공식 기록 페이지 → 규정 충족 타자(AVG)·투수(ERA + 원시 카운트)
//   2) 리그 FIP 상수 C = lgERA − (13·ΣHR + 3·Σ(BB+HBP) − 2·ΣSO)/ΣIP  (규정 투수 모집단 근사)
//   3) 타자: 네이버 API로 규정 타자 전원 wRC+ 조회 → 타율 순위 vs wRC+ 순위
//      투수: KBO 원시 카운트로 FIP 산출 → ERA 순위 vs FIP 순위
//   4) 갭 = 클래식 순위 − 세이버 순위. KIA 선수만 data/saber_rankings.json 저장
//   5) KIA 로스터 전원 세이버 필드를 data/players/{id}.json currentSeason에 병합
//      (규정 미달 선수도 카드 표시용으로 보강 — Myth-Buster에는 미포함)

import { cachePaths, readJsonCache, tryReadJsonCache, writeJsonCache } from '@/lib/data/cache';

import { crawlKboRecords, type QualifiedPitcherRow } from './kbo-records';
import { fetchNaverSaberBatch, type NaverSaber } from './naver-saber';

import type { Player, SaberRankingEntry, SaberRankings } from '@/types';

export interface SaberCrawlResult {
  status: 'success' | 'failed';
  rankings?: SaberRankings;
  enrichedPlayers?: number;
  errorMessage?: string;
}

export async function runSaberPipeline(season: number): Promise<SaberCrawlResult> {
  // 1) 클래식 순위 원천 (KBO 공식)
  const records = await crawlKboRecords();
  if (records.status !== 'success' || !records.batters || !records.pitchers) {
    return { status: 'failed', errorMessage: records.errorMessage ?? 'kbo records crawl failed' };
  }
  const { batters, pitchers } = records;

  // 2) 리그 FIP 상수
  const fipConstant = computeFipConstant(pitchers);

  // 3a) 투수 — KBO 원시 카운트만으로 FIP 산출 (네이버 불필요)
  const pitcherFip = new Map<string, number>(
    pitchers.map((p) => [p.playerId, round2(rawFip(p) + fipConstant)]),
  );
  const eraRank = rankBy(pitchers, (p) => p.era, 'asc');
  const fipRank = rankBy(pitchers, (p) => pitcherFip.get(p.playerId) ?? 99, 'asc');

  // 3b) 타자 — 네이버에서 규정 타자 전원 wRC+ 조회
  const batterSaber = await fetchNaverSaberBatch(
    batters.map((b) => b.playerId),
    season,
  );
  const rankedBatters = batters.filter((b) => {
    const s = batterSaber.get(b.playerId);
    return s?.playerType === 'batter' && s.wrcPlus !== null;
  });
  const avgRank = rankBy(rankedBatters, (b) => b.avg, 'desc');
  const wrcRank = rankBy(
    rankedBatters,
    (b) => {
      const s = batterSaber.get(b.playerId);
      return s?.playerType === 'batter' ? (s.wrcPlus ?? 0) : 0;
    },
    'desc',
  );

  // 4) KIA 엔트리 구성
  const entries: SaberRankingEntry[] = [];
  for (const b of rankedBatters) {
    if (b.teamCode !== 'KIA') continue;
    const s = batterSaber.get(b.playerId);
    if (s?.playerType !== 'batter' || s.wrcPlus === null) continue;
    const classicRank = avgRank.get(b.playerId) ?? 0;
    const saberRank = wrcRank.get(b.playerId) ?? 0;
    entries.push({
      playerId: b.playerId,
      name: b.name,
      teamCode: 'KIA',
      isPitcher: false,
      classicMetric: 'avg',
      classicValue: b.avg,
      classicRank,
      saberMetric: 'wrcPlus',
      saberValue: s.wrcPlus,
      saberRank,
      gapScore: classicRank - saberRank,
      qualified: true,
    });
  }
  for (const p of pitchers) {
    if (p.teamCode !== 'KIA') continue;
    const fip = pitcherFip.get(p.playerId);
    const classicRank = eraRank.get(p.playerId) ?? 0;
    const saberRank = fipRank.get(p.playerId) ?? 0;
    if (fip === undefined) continue;
    entries.push({
      playerId: p.playerId,
      name: p.name,
      teamCode: 'KIA',
      isPitcher: true,
      classicMetric: 'era',
      classicValue: p.era,
      classicRank,
      saberMetric: 'fip',
      saberValue: fip,
      saberRank,
      gapScore: classicRank - saberRank,
      qualified: true,
    });
  }

  const rankings: SaberRankings = {
    updatedAt: new Date().toISOString(),
    season,
    qualifiedBatters: rankedBatters.length,
    qualifiedPitchers: pitchers.length,
    entries: entries.sort((a, b) => Math.abs(b.gapScore) - Math.abs(a.gapScore)),
  };
  await writeJsonCache('saber_rankings.json', rankings);

  // 5) KIA 로스터 세이버 캐시 보강 (카드 표시용 — 규정 미달 포함)
  const enrichedPlayers = await enrichKiaPlayerCaches(season, fipConstant, batterSaber);

  return { status: 'success', rankings, enrichedPlayers };
}

/**
 * KIA 로스터 전원의 currentSeason에 세이버 필드 병합.
 * 이미 조회한 규정 타자 데이터는 재사용, 나머지만 추가 조회.
 */
async function enrichKiaPlayerCaches(
  season: number,
  fipConstant: number,
  prefetched: Map<string, NaverSaber>,
): Promise<number> {
  const players = (await readJsonCache<Player[]>(cachePaths.players)).data;
  const kia = players.filter((p) => p.teamCode === 'KIA');
  const missing = kia.filter((p) => !prefetched.has(p.id)).map((p) => p.id);
  const fetched = await fetchNaverSaberBatch(missing, season);
  const all = new Map([...prefetched, ...fetched]);

  let count = 0;
  for (const p of kia) {
    const saber = all.get(p.id);
    if (!saber) continue;
    const cached = await tryReadJsonCache<Record<string, unknown>>(cachePaths.player(p.id));
    if (!cached) continue;
    const detail = cached.data;
    const cur = (detail.currentSeason ?? {}) as Record<string, unknown>;
    if (saber.playerType === 'batter') {
      Object.assign(cur, {
        games: saber.games,
        avg: saber.avg,
        obp: saber.obp,
        slg: saber.slg,
        ops: saber.ops,
        hr: saber.hr,
        rbi: saber.rbi,
        sb: saber.sb,
        wrcPlus: saber.wrcPlus,
        woba: saber.woba,
        war: saber.war,
        babip: saber.babip,
        kPct: saber.kPct,
        bbPct: saber.bbPct,
        recentForm: saber.recentForm,
        lastGameDate: saber.lastGameDate,
        updatedAt: new Date().toISOString(),
      });
    } else {
      Object.assign(cur, {
        games: saber.games,
        era: saber.era,
        whip: saber.whip,
        w: saber.w,
        l: saber.l,
        sv: saber.sv,
        hold: saber.hold,
        fip: saber.fipRaw !== null ? round2(saber.fipRaw + fipConstant) : null,
        war: saber.war,
        babip: saber.babip,
        kPct: saber.kPct,
        bbPct: saber.bbPct,
        recentForm: saber.recentForm,
        lastGameDate: saber.lastGameDate,
        updatedAt: new Date().toISOString(),
      });
    }
    detail.currentSeason = cur;
    await writeJsonCache(cachePaths.player(p.id), detail);
    count++;
  }
  return count;
}

// ────────────────────────────────────────────────────────────────────────────

function rawFip(p: QualifiedPitcherRow): number {
  return (13 * p.hr + 3 * (p.bb + p.hbp) - 2 * p.so) / p.ip;
}

/** 리그 상수 C = lgERA − lg(FIP 분자/IP). 규정 투수 모집단 근사 (Design §11.3 module-1). */
export function computeFipConstant(pitchers: QualifiedPitcherRow[]): number {
  const sum = pitchers.reduce(
    (acc, p) => {
      acc.ip += p.ip;
      acc.er += p.er;
      acc.hr += p.hr;
      acc.bbHbp += p.bb + p.hbp;
      acc.so += p.so;
      return acc;
    },
    { ip: 0, er: 0, hr: 0, bbHbp: 0, so: 0 },
  );
  if (sum.ip <= 0) return 3.2; // KBO 통상 범위 보수적 기본값
  const lgEra = (9 * sum.er) / sum.ip;
  const lgFipRaw = (13 * sum.hr + 3 * sum.bbHbp - 2 * sum.so) / sum.ip;
  return round2(lgEra - lgFipRaw);
}

/** 동률 = 동순위(min rank) 처리. */
function rankBy<T extends { playerId: string }>(
  rows: T[],
  value: (row: T) => number,
  dir: 'asc' | 'desc',
): Map<string, number> {
  const sorted = [...rows].sort((a, b) =>
    dir === 'asc' ? value(a) - value(b) : value(b) - value(a),
  );
  const ranks = new Map<string, number>();
  let prevValue: number | null = null;
  let prevRank = 0;
  sorted.forEach((row, i) => {
    const v = value(row);
    const rank = prevValue !== null && v === prevValue ? prevRank : i + 1;
    ranks.set(row.playerId, rank);
    prevValue = v;
    prevRank = rank;
  });
  return ranks;
}

function round2(x: number): number {
  return Math.round(x * 100) / 100;
}
