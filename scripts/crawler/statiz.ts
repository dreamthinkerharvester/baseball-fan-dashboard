// Design Ref: §6 — 스탯티즈 크롤러 (선수 시즌 성적 + wRC+ / FIP).
//
// 🚨 DEPRECATED for MVP (Phase 0 POC 발견, 2026-05-09):
//   statiz.co.kr의 모든 데이터 페이지(`/stats/?m=*`, `/player/?p_no=*`, `/season/`)가
//   *로그인 wall*을 적용 중. 무료 무인증 크롤링 불가능.
//   상세: docs/03-analysis/phase-0-poc-results.md §3
//
// 코드는 fail-safe 동작 (404 retry → cache fallback)하지만,
// 운영자는 cron에 등록하지 말 것. 등급 알고리즘은 OPS/ERA fallback path가 자동 적용됨.
//
// Phase 2 후속 옵션: (B) 자체 wRC+ 산출 (KBO raw stats 기반) or (C) KBReport / MyKBO Stats 같은 대체 소스.

import * as cheerio from 'cheerio';

import { fetchHtml, type FetchResult } from './http';

import type { BatterSeasonStat, PitcherSeasonStat } from '@/types';

export const STATIZ_URLS = {
  batterStats: (season: number) =>
    `http://www.statiz.co.kr/stat.php?mid=stat&re=0&ys=${season}&ye=${season}&pos=batters`,
  pitcherStats: (season: number) =>
    `http://www.statiz.co.kr/stat.php?mid=stat&re=0&ys=${season}&ye=${season}&pos=pitchers`,
  player: (id: string) => `http://www.statiz.co.kr/player.php?opt=4&sopt=1&name=&birth=&pcode=${id}`,
} as const;

export const STATIZ_SELECTORS = {
  table: 'table.table_st tbody tr',
  cell: 'td',
} as const;

export interface CrawlOutcome<T> {
  status: 'success' | 'failed';
  data?: T;
  fetch: FetchResult;
  errorMessage?: string;
}

export async function crawlBatterSeasonStats(
  season: number,
): Promise<CrawlOutcome<BatterSeasonStat[]>> {
  const fetch = await fetchHtml({ url: STATIZ_URLS.batterStats(season), source: 'statiz' });
  if (fetch.status !== 'success' || !fetch.body) {
    return { status: 'failed', fetch, errorMessage: fetch.errorMessage };
  }
  try {
    return { status: 'success', data: parseBatterTable(fetch.body, season), fetch };
  } catch (e: unknown) {
    return { status: 'failed', fetch, errorMessage: (e as Error).message };
  }
}

export async function crawlPitcherSeasonStats(
  season: number,
): Promise<CrawlOutcome<PitcherSeasonStat[]>> {
  const fetch = await fetchHtml({ url: STATIZ_URLS.pitcherStats(season), source: 'statiz' });
  if (fetch.status !== 'success' || !fetch.body) {
    return { status: 'failed', fetch, errorMessage: fetch.errorMessage };
  }
  try {
    return { status: 'success', data: parsePitcherTable(fetch.body, season), fetch };
  } catch (e: unknown) {
    return { status: 'failed', fetch, errorMessage: (e as Error).message };
  }
}

// ────────────────────────────────────────────────────────────────────────────
// HTML parsers — placeholder column mapping
// statiz의 실제 컬럼 순서는 Phase 0에서 확정 후 매핑 보강.
// ────────────────────────────────────────────────────────────────────────────
export function parseBatterTable(html: string, season: number): BatterSeasonStat[] {
  const $ = cheerio.load(html);
  const out: BatterSeasonStat[] = [];
  const updatedAt = new Date().toISOString();
  $(STATIZ_SELECTORS.table).each((_, el) => {
    const cells = $(el).find(STATIZ_SELECTORS.cell);
    const playerId = cells.eq(0).attr('data-player-id') ?? cells.eq(0).text().trim();
    if (!playerId) return;
    const num = (i: number) => {
      const v = Number(cells.eq(i).text().trim());
      return Number.isFinite(v) ? v : 0;
    };
    const wrcPlusCell = cells.eq(15).text().trim();
    const wrcPlus = wrcPlusCell === '' || wrcPlusCell === '-' ? null : Number(wrcPlusCell);
    out.push({
      playerId,
      season,
      games: num(1),
      ab: num(2),
      hits: num(3),
      hr: num(4),
      rbi: num(5),
      avg: num(6),
      obp: num(7),
      slg: num(8),
      ops: num(9),
      wrcPlus: Number.isFinite(wrcPlus as number) ? (wrcPlus as number) : null,
      updatedAt,
    });
  });
  return out;
}

export function parsePitcherTable(html: string, season: number): PitcherSeasonStat[] {
  const $ = cheerio.load(html);
  const out: PitcherSeasonStat[] = [];
  const updatedAt = new Date().toISOString();
  $(STATIZ_SELECTORS.table).each((_, el) => {
    const cells = $(el).find(STATIZ_SELECTORS.cell);
    const playerId = cells.eq(0).attr('data-player-id') ?? cells.eq(0).text().trim();
    if (!playerId) return;
    const num = (i: number) => {
      const v = Number(cells.eq(i).text().trim());
      return Number.isFinite(v) ? v : 0;
    };
    const fipCell = cells.eq(10).text().trim();
    const fip = fipCell === '' || fipCell === '-' ? null : Number(fipCell);
    out.push({
      playerId,
      season,
      games: num(1),
      ip: num(2),
      era: num(3),
      fip: Number.isFinite(fip as number) ? (fip as number) : null,
      whip: num(7),
      k9: num(8),
      bb9: num(9),
      updatedAt,
    });
  });
  return out;
}
