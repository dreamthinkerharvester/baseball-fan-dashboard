// Storybook orchestrator — assembles all data sources into Storybook output.
// Design Ref §4 + §8 (parallel fetch + partial failure tolerance).

import { promises as fs } from 'node:fs';
import path from 'node:path';

import { loadPlayerDetail } from '@/lib/data/cache';

import { buildDraft } from './draft';
import { buildNarrative } from './narrative';
import { fetchNewsClips } from './news';
import { detectPrimeSeason } from './prime';
import { buildToday } from './today';

import type {
  NewsClip,
  PrimeSeason,
  SeasonRecord,
  Storybook,
  StorybookPlayer,
  TodayPerformance,
} from '@/types';

const IMAGE_DIR = process.env.STORYBOOK_IMAGE_DIR ?? path.join(process.cwd(), 'public', 'assets', 'baseball');
const IMAGE_URL_PREFIX = '/assets/baseball';

export async function buildStorybook(
  playerId: string,
  date: string,
): Promise<{ storybook: Storybook | null; status: number }> {
  const cache = await loadPlayerDetail(playerId);
  if (!cache) {
    return { storybook: null, status: 404 };
  }

  const player: StorybookPlayer = {
    id: cache.data.player.id,
    name: cache.data.player.name,
    teamCode: cache.data.player.teamCode,
    position: cache.data.player.position,
    isPitcher: cache.data.player.isPitcher,
  };

  if (player.teamCode !== 'KIA') {
    return { storybook: null, status: 422 };
  }

  const careerSeasons = toSeasonRecords(cache.data.careerSeasons, cache.data.currentSeason);

  const errors: string[] = [];

  const [today, prime, news, narrative, imagePool] = await Promise.all([
    safe(() => buildToday(playerId, date), 'today_failed', errors, defaultToday(date)),
    safe(
      async () => detectPrimeSeason(careerSeasons, player.isPitcher),
      'prime_failed',
      errors,
      null as PrimeSeason | null,
    ),
    safe<NewsClip[]>(
      () => fetchNewsClips(player.name, computeYearRange(careerSeasons)),
      'news_failed',
      errors,
      [],
    ),
    safe(() => buildNarrative(player), 'narrative_failed', errors, []),
    safe(() => listImagePool(), 'image_pool_failed', errors, []),
  ]);

  const draft = buildDraft({ player, today, prime, news, narrative });

  return {
    storybook: {
      player,
      generatedAt: new Date().toISOString(),
      today,
      prime,
      news,
      narrative,
      draft,
      imagePool,
      ...(errors.length > 0 ? { errors } : {}),
    },
    status: 200,
  };
}

async function safe<T>(
  fn: () => Promise<T> | T,
  errKey: string,
  errors: string[],
  fallback: T,
): Promise<T> {
  try {
    return await fn();
  } catch {
    errors.push(errKey);
    return fallback;
  }
}

function defaultToday(date: string): TodayPerformance {
  return { played: false, date, vs: null };
}

function computeYearRange(seasons: SeasonRecord[]): { from: number; to: number } {
  if (seasons.length === 0) {
    const y = new Date().getFullYear();
    return { from: y - 1, to: y };
  }
  const years = seasons.map((s) => s.year);
  return { from: Math.min(...years), to: Math.max(...years) };
}

function toSeasonRecords(
  career: unknown[] | undefined,
  current: unknown,
): SeasonRecord[] {
  const records: SeasonRecord[] = [];
  if (Array.isArray(career)) {
    for (const c of career) {
      const r = mapToSeasonRecord(c);
      if (r) records.push(r);
    }
  }
  const cur = mapToSeasonRecord(current);
  if (cur && !records.some((r) => r.year === cur.year)) {
    records.push(cur);
  }
  return records.sort((a, b) => a.year - b.year);
}

function mapToSeasonRecord(raw: unknown): SeasonRecord | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const year = typeof r.season === 'number' ? r.season : typeof r.year === 'number' ? r.year : null;
  if (year === null) return null;
  const rec: SeasonRecord = { year };
  for (const k of ['war', 'ops', 'avg', 'era', 'fip', 'hr', 'sb', 'rbi', 'k', 'ip', 'ab'] as const) {
    if (typeof r[k] === 'number') rec[k] = r[k] as number;
  }
  return rec;
}

async function listImagePool(): Promise<string[]> {
  try {
    const files = await fs.readdir(IMAGE_DIR);
    return files
      .filter((f) => /\.(jpe?g|png|webp|gif)$/i.test(f))
      .map((f) => `${IMAGE_URL_PREFIX}/${f}`);
  } catch {
    return [];
  }
}
