// Design Ref: §4 — Schedule API range 처리.

import { loadGames } from '@/lib/data/cache';
import { todayKstString } from '@/lib/date';
import { err, ok } from '@/types';

import type { ApiResponse, Game } from '@/types';

export type Range = 'day' | 'week' | 'month';

export interface GamesQuery {
  date?: string; // YYYY-MM-DD (KST)
  range?: Range;
}

export async function getGames(query: GamesQuery): Promise<ApiResponse<Game[]>> {
  const today = todayKstString();
  const baseDate = query.date ?? today;
  const range = query.range ?? 'day';

  if (range === 'day') {
    const r = await loadGames(baseDate);
    if (!r) return ok<Game[]>([], { updatedAt: null as unknown as string, totalGames: 0 });
    return ok(r.data, { updatedAt: r.fetchedAt, source: 'cache', totalGames: r.data.length });
  }

  // week/month: scan files within range
  const dates = generateDateRange(baseDate, range === 'week' ? 7 : 30);
  const games: Game[] = [];
  let latestMtime = 0;
  for (const d of dates) {
    const r = await loadGames(d);
    if (r) {
      games.push(...r.data);
      const t = Date.parse(r.fetchedAt);
      if (t > latestMtime) latestMtime = t;
    }
  }
  games.sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
  return ok(games, {
    updatedAt: latestMtime ? new Date(latestMtime).toISOString() : undefined,
    source: 'cache',
    totalGames: games.length,
  });
}

function generateDateRange(start: string, days: number): string[] {
  const out: string[] = [];
  const startDate = new Date(`${start}T00:00:00+09:00`);
  for (let i = 0; i < days; i += 1) {
    const d = new Date(startDate.getTime());
    d.setUTCDate(d.getUTCDate() + i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

/** Lint hint — `err` re-exported for convenience in route handlers if needed. */
export const _err = err;

// helpers for testing
export const _testing = { generateDateRange };
