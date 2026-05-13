// Storybook M6: Player Narrative — Design Ref §5.

import { promises as fs } from 'node:fs';
import path from 'node:path';

import type { NarrativeEvent, StorybookPlayer } from '@/types';

const CACHE_DIR =
  process.env.STORYBOOK_CACHE_DIR ?? path.join(process.cwd(), 'data', 'storybook', 'cache');
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const NAMU_BASE = 'https://namu.wiki/w/';
const YEAR_RE = /(\d{4})\s*년/g;
const MAX_EVENTS = 10;
const MAX_TEXT_LEN = 100;

interface NarrativeCacheEntry {
  cachedAt: string;
  events: NarrativeEvent[];
}

export async function buildNarrative(
  player: Pick<StorybookPlayer, 'id' | 'name'>,
): Promise<NarrativeEvent[]> {
  const cached = await readCache(player.id);
  if (cached) return cached.events;

  const namuEvents = await fetchFromNamu(player.name);
  if (namuEvents.length >= 3) {
    await writeCache(player.id, namuEvents);
    return namuEvents;
  }

  const kboEvents = await fetchFromKboFallback();
  const merged = mergeEvents(namuEvents, kboEvents);
  await writeCache(player.id, merged);
  return merged;
}

async function fetchFromNamu(playerName: string): Promise<NarrativeEvent[]> {
  const url = `${NAMU_BASE}${encodeURIComponent(playerName)}`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Storybook Narrative Builder)' },
    });
    if (!res.ok) return [];
    const html = await res.text();
    return extractEventsFromHtml(html, url);
  } catch {
    return [];
  }
}

export function extractEventsFromHtml(html: string, sourceUrl: string): NarrativeEvent[] {
  // 간이 추출: <p> 또는 <li> 안에서 "YYYY년 ..." 패턴 매칭.
  // 정밀 파싱 (cheerio)은 Phase 2 — 본 MVP는 정규식 기반.
  const blocks = html
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .split(/<(?:p|li|h2|h3|div)[^>]*>/i)
    .map((b) => b.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').trim())
    .filter((b) => b.length > 0 && b.length < 500);

  const seen = new Map<number, NarrativeEvent>();

  for (const block of blocks) {
    const matches = [...block.matchAll(YEAR_RE)];
    if (matches.length === 0) continue;

    for (const m of matches) {
      const year = Number(m[1]);
      if (year < 1990 || year > new Date().getFullYear() + 1) continue;
      if (seen.has(year)) continue;

      const sentence = nearestSentence(block, m.index ?? 0);
      if (sentence.length < 5) continue;

      seen.set(year, {
        year,
        text: sentence.slice(0, MAX_TEXT_LEN),
        source: 'namu',
        sourceUrl,
      });
    }
  }

  return [...seen.values()].sort((a, b) => a.year - b.year).slice(0, MAX_EVENTS);
}

function nearestSentence(block: string, idx: number): string {
  // Find sentence boundary (.) before/after idx
  const before = block.slice(0, idx).split(/[.。!?]\s*/).pop() ?? '';
  const afterRaw = block.slice(idx);
  const afterEnd = afterRaw.search(/[.。!?]/);
  const after = afterEnd >= 0 ? afterRaw.slice(0, afterEnd) : afterRaw;
  return `${before}${after}`.replace(/\s+/g, ' ').trim();
}

async function fetchFromKboFallback(): Promise<NarrativeEvent[]> {
  // KBO 공식 페이지는 정적 정보 위주 (career 통계). 자유 텍스트 부족 → 빈 배열 반환.
  // Phase 2: cheerio + KBO 페이지 정밀 파싱.
  return [];
}

function mergeEvents(a: NarrativeEvent[], b: NarrativeEvent[]): NarrativeEvent[] {
  const seen = new Set<number>();
  const merged: NarrativeEvent[] = [];
  for (const e of [...a, ...b]) {
    if (!seen.has(e.year)) {
      seen.add(e.year);
      merged.push(e);
    }
  }
  return merged.sort((x, y) => x.year - y.year).slice(0, MAX_EVENTS);
}

async function readCache(playerId: string): Promise<NarrativeCacheEntry | null> {
  try {
    const abs = path.join(CACHE_DIR, 'narrative', `${playerId}.json`);
    const text = await fs.readFile(abs, 'utf8');
    const entry = JSON.parse(text) as NarrativeCacheEntry;
    const age = Date.now() - new Date(entry.cachedAt).getTime();
    if (age > CACHE_TTL_MS) return null;
    return entry;
  } catch {
    return null;
  }
}

async function writeCache(playerId: string, events: NarrativeEvent[]): Promise<void> {
  try {
    const dir = path.join(CACHE_DIR, 'narrative');
    await fs.mkdir(dir, { recursive: true });
    const entry: NarrativeCacheEntry = {
      cachedAt: new Date().toISOString(),
      events,
    };
    await fs.writeFile(path.join(dir, `${playerId}.json`), JSON.stringify(entry, null, 2), 'utf8');
  } catch {
    // ignore
  }
}
