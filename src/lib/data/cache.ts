// Design Ref: §3.3 — JSON file cache as MVP storage. Phase 2에서 Supabase 마이그레이션 시 동일 인터페이스 유지.
// Layer: Data (Infrastructure). UI/Service에서 직접 import 금지 (eslint import rule 강제).

import { promises as fs } from 'node:fs';
import path from 'node:path';

import { isoKst } from '@/lib/date';

import type { Game, Lineup, Player, PlayerNewsCache, StandingsRow, Team } from '@/types';

/**
 * 캐시 루트. 환경 변수로 override 가능 (테스트는 fixtures 경로 주입).
 *   - prod build: process.cwd()/data
 *   - dev/test: BFD_DATA_DIR 환경변수
 */
export function getDataDir(): string {
  return process.env.BFD_DATA_DIR ?? path.join(process.cwd(), 'data');
}

export interface CacheReadResult<T> {
  data: T;
  /** 파일 mtime (ISO). UI에서 "데이터 갱신 지연" 판단에 사용. */
  fetchedAt: string;
  /** 현재 시각 대비 age (밀리초). */
  ageMs: number;
}

/** 파일 단일 read with mtime. 존재하지 않으면 throw. */
export async function readJsonCache<T>(relativePath: string): Promise<CacheReadResult<T>> {
  const abs = path.join(getDataDir(), relativePath);
  const [text, stat] = await Promise.all([fs.readFile(abs, 'utf8'), fs.stat(abs)]);
  return {
    data: JSON.parse(text) as T,
    fetchedAt: stat.mtime.toISOString(),
    ageMs: Date.now() - stat.mtime.getTime(),
  };
}

/** 안전 read: 파일 없으면 null. */
export async function tryReadJsonCache<T>(
  relativePath: string,
): Promise<CacheReadResult<T> | null> {
  try {
    return await readJsonCache<T>(relativePath);
  } catch (err: unknown) {
    if (isENOENT(err)) return null;
    throw err;
  }
}

/** 파일 단일 write. 디렉토리 자동 생성. */
export async function writeJsonCache(relativePath: string, data: unknown): Promise<void> {
  const abs = path.join(getDataDir(), relativePath);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

/** _meta/last-crawl.json 부분 갱신. */
export interface LastCrawlEntry {
  lastSuccess: string | null;
  lastError: string | null;
}
export interface LastCrawlMeta {
  [source: string]: { [action: string]: LastCrawlEntry };
}

export async function updateLastCrawl(
  source: string,
  action: string,
  entry: Partial<LastCrawlEntry>,
): Promise<void> {
  const META_PATH = '_meta/last-crawl.json';
  const existing = (await tryReadJsonCache<LastCrawlMeta>(META_PATH))?.data ?? {};
  const sourceData = existing[source] ?? {};
  const prev = sourceData[action] ?? { lastSuccess: null, lastError: null };
  sourceData[action] = { ...prev, ...entry };
  existing[source] = sourceData;
  await writeJsonCache(META_PATH, existing);
}

// ────────────────────────────────────────────────────────────────────────────
// Typed convenience accessors (UI/Service에서 사용하는 표준 진입점)
// ────────────────────────────────────────────────────────────────────────────

export const cachePaths = {
  teams: 'teams.json',
  players: 'players.json',
  standings: 'standings.json',
  game: (date: string) => `games/${date}.json`,
  lineup: (date: string, team: string) => `lineups/${date}/${team}.json`,
  player: (id: string) => `players/${id}.json`,
  news: (id: string) => `news/${id}.json`,
} as const;

export async function loadTeams(): Promise<Team[]> {
  const r = await readJsonCache<Team[]>(cachePaths.teams);
  return r.data;
}

export async function loadStandings(): Promise<CacheReadResult<StandingsRow[]>> {
  return await readJsonCache<StandingsRow[]>(cachePaths.standings);
}

export async function loadGames(date: string): Promise<CacheReadResult<Game[]> | null> {
  return await tryReadJsonCache<Game[]>(cachePaths.game(date));
}

export async function loadLineup(
  date: string,
  team: string,
): Promise<CacheReadResult<Lineup> | null> {
  return await tryReadJsonCache<Lineup>(cachePaths.lineup(date, team));
}

export interface PlayerDetailCache {
  player: Player;
  currentSeason: unknown; // Batter or Pitcher SeasonStat
  careerSeasons: unknown[];
  recentTen: unknown[];
  currentGrade?: { grade: string; percentile: number; basis: string };
}

export async function loadPlayerDetail(
  id: string,
): Promise<CacheReadResult<PlayerDetailCache> | null> {
  return await tryReadJsonCache<PlayerDetailCache>(cachePaths.player(id));
}

export async function loadPlayerNews(
  id: string,
): Promise<CacheReadResult<PlayerNewsCache> | null> {
  return await tryReadJsonCache<PlayerNewsCache>(cachePaths.news(id));
}

export function nowIsoKst(): string {
  return isoKst();
}

// ────────────────────────────────────────────────────────────────────────────
// internal
// ────────────────────────────────────────────────────────────────────────────
function isENOENT(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: unknown }).code === 'ENOENT'
  );
}
