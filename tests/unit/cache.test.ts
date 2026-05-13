import { promises as fs } from 'node:fs';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  cachePaths,
  loadGames,
  loadLineup,
  loadStandings,
  readJsonCache,
  tryReadJsonCache,
  updateLastCrawl,
  writeJsonCache,
} from '@/lib/data/cache';
import { seedFromFixtures } from '@/lib/data/seed';

import type { LastCrawlMeta } from '@/lib/data/cache';

const TMP_DIR = path.join(process.cwd(), '.tmp-cache-test');

beforeEach(async () => {
  process.env.BFD_DATA_DIR = TMP_DIR;
  await fs.rm(TMP_DIR, { recursive: true, force: true });
  await fs.mkdir(TMP_DIR, { recursive: true });
});

afterEach(async () => {
  delete process.env.BFD_DATA_DIR;
  await fs.rm(TMP_DIR, { recursive: true, force: true });
});

describe('cache: write + read round-trip', () => {
  it('writes JSON and reads it back with mtime + ageMs', async () => {
    await writeJsonCache('foo/bar.json', { hello: 'world' });
    const r = await readJsonCache<{ hello: string }>('foo/bar.json');
    expect(r.data).toEqual({ hello: 'world' });
    expect(r.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(r.ageMs).toBeGreaterThanOrEqual(0);
    expect(r.ageMs).toBeLessThan(5_000);
  });

  it('writes pretty-printed (2-space indent + trailing newline)', async () => {
    await writeJsonCache('pretty.json', { a: 1 });
    const text = await fs.readFile(path.join(TMP_DIR, 'pretty.json'), 'utf8');
    expect(text).toBe('{\n  "a": 1\n}\n');
  });
});

describe('cache: tryReadJsonCache', () => {
  it('returns null for missing file', async () => {
    expect(await tryReadJsonCache('does/not/exist.json')).toBeNull();
  });
  it('returns data when file exists', async () => {
    await writeJsonCache('exists.json', [1, 2, 3]);
    const r = await tryReadJsonCache<number[]>('exists.json');
    expect(r?.data).toEqual([1, 2, 3]);
  });
});

describe('cache: typed accessors via fixtures seed', () => {
  beforeEach(async () => {
    await seedFromFixtures();
  });

  it('loadStandings returns 10 rows', async () => {
    const r = await loadStandings();
    expect(r.data).toHaveLength(10);
    expect(r.data[0]?.rank).toBe(1);
  });

  it('loadGames returns games for the day', async () => {
    const r = await loadGames('2026-05-09');
    expect(r).not.toBeNull();
    expect(r!.data.length).toBeGreaterThanOrEqual(5);
    expect(r!.data[0]?.date).toBe('2026-05-09');
  });

  it('loadGames returns null for missing date', async () => {
    expect(await loadGames('1999-01-01')).toBeNull();
  });

  it('loadLineup confirmed', async () => {
    const r = await loadLineup('2026-05-09', 'LG');
    expect(r).not.toBeNull();
    expect(r!.data.status).toBe('confirmed');
    expect(r!.data.battingOrder).toHaveLength(9);
    expect(r!.data.startingPitcher).not.toBeNull();
  });

  it('loadLineup pending', async () => {
    const r = await loadLineup('2026-05-10', 'LG');
    expect(r).not.toBeNull();
    expect(r!.data.status).toBe('pending');
    expect(r!.data.battingOrder).toHaveLength(0);
    expect(r!.data.startingPitcher).toBeNull();
  });
});

describe('cache: updateLastCrawl', () => {
  it('creates meta entry when missing', async () => {
    await updateLastCrawl('kbo', 'standings', { lastSuccess: '2026-05-09T08:30:00+09:00' });
    const r = await readJsonCache<LastCrawlMeta>('_meta/last-crawl.json');
    expect(r.data.kbo?.standings?.lastSuccess).toBe('2026-05-09T08:30:00+09:00');
    expect(r.data.kbo?.standings?.lastError).toBeNull();
  });

  it('updates partial fields preserving others', async () => {
    await updateLastCrawl('kbo', 'lineup', { lastSuccess: '2026-05-09T17:30:00+09:00' });
    await updateLastCrawl('kbo', 'lineup', { lastError: 'timeout' });
    const r = await readJsonCache<LastCrawlMeta>('_meta/last-crawl.json');
    expect(r.data.kbo?.lineup?.lastSuccess).toBe('2026-05-09T17:30:00+09:00');
    expect(r.data.kbo?.lineup?.lastError).toBe('timeout');
  });

  it('cachePaths produce expected strings', () => {
    expect(cachePaths.teams).toBe('teams.json');
    expect(cachePaths.game('2026-05-09')).toBe('games/2026-05-09.json');
    expect(cachePaths.lineup('2026-05-09', 'LG')).toBe('lineups/2026-05-09/LG.json');
    expect(cachePaths.player('78529')).toBe('players/78529.json');
  });
});
