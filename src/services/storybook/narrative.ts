// Storybook M6: Player Narrative — Design Ref §5.
// Primary source: Naver tores-profile API (debutInfo + sportsBridgeCareerInfo + sportsBridgePrizeInfo)
// Fallback: namu wiki regex (Phase 1 simple, Phase 2 cheerio)

import { promises as fs } from 'node:fs';
import path from 'node:path';

import { loadPlayerDetail } from '@/lib/data/cache';

import type { NarrativeEvent, StorybookPlayer } from '@/types';

const CACHE_DIR =
  process.env.STORYBOOK_CACHE_DIR ?? path.join(process.cwd(), 'data', 'storybook', 'cache');
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const NAMU_BASE = 'https://namu.wiki/w/';
const NAVER_PROFILE_API = (code: string) =>
  `https://api-gw.sports.naver.com/players/kbo/${code}/tores-profile`;
const YEAR_RE = /(\d{4})\s*년/g;
const MAX_EVENTS = 12;
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

  // 1차: Naver tores-profile
  const naverEvents = await fetchFromNaverProfile(player.id);

  // 2차 보강: careerSeasons에서 highlight 시즌 자동 추출
  const seasonEvents = await buildSeasonHighlights(player.id);

  // 3차 fallback: namu (현재는 0건 반환 — 차단/구조변경 흔함)
  const namuEvents = naverEvents.length < 3 ? await fetchFromNamu(player.name) : [];

  const merged = mergeEvents(naverEvents, seasonEvents, namuEvents);
  await writeCache(player.id, merged);
  return merged;
}

// ────────────────────────────────────────────────────────────────────
// Naver tores-profile
// ────────────────────────────────────────────────────────────────────

interface NaverProfile {
  result?: {
    profile?: {
      name?: string;
      birthDate?: string;
      birthDateKor?: string;
      debutInfo?: Array<{ debut_year?: string; debuts_work?: string }>;
      sportsBridgeCareerInfo?: Array<{ startDate?: string; endDate?: string; contents?: string }>;
      sportsBridgePrizeInfo?: Array<{ year?: string; contents?: string }>;
      sportsBridgeSchool?: Array<{ schoolName?: string; period?: string }>;
      mainSchoolList?: Array<{ name?: string }>;
      site?: Array<{ siteUrl?: string }>;
    };
  };
}

async function fetchFromNaverProfile(playerId: string): Promise<NarrativeEvent[]> {
  try {
    const res = await fetch(NAVER_PROFILE_API(playerId), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
        'Referer': `https://m.sports.naver.com/player/index?playerId=${playerId}&category=kbo`,
        'Accept': 'application/json',
      },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as NaverProfile;
    const p = json?.result?.profile;
    if (!p) return [];

    const url = p.site?.[0]?.siteUrl ?? `https://m.sports.naver.com/player/index?playerId=${playerId}&category=kbo`;
    const events: NarrativeEvent[] = [];

    // 1. 데뷔
    if (p.debutInfo) {
      for (const d of p.debutInfo) {
        const y = Number(d.debut_year);
        if (Number.isFinite(y) && d.debuts_work) {
          events.push({ year: y, text: d.debuts_work, source: 'naver', sourceUrl: url });
        }
      }
    }

    // 2. 국가대표 / 경력
    if (p.sportsBridgeCareerInfo) {
      for (const c of p.sportsBridgeCareerInfo) {
        const y = Number(c.startDate);
        if (!Number.isFinite(y) || !c.contents) continue;
        // 'KIA 타이거즈' 같은 소속 정보는 데뷔에서 이미 다루므로 스킵
        if (/^(KIA|두산|LG|키움|롯데|삼성|한화|SSG|NC|KT) 타이거즈?|베어스|트윈스|히어로즈|자이언츠|라이온즈|이글스|랜더스|다이노스|위즈$/.test(c.contents.trim())) continue;
        events.push({ year: y, text: c.contents, source: 'naver', sourceUrl: url });
      }
    }

    // 3. 수상
    if (p.sportsBridgePrizeInfo) {
      for (const pr of p.sportsBridgePrizeInfo) {
        const y = Number(pr.year);
        if (!Number.isFinite(y) || !pr.contents) continue;
        events.push({ year: y, text: pr.contents, source: 'naver', sourceUrl: url });
      }
    }

    return events;
  } catch {
    return [];
  }
}

// ────────────────────────────────────────────────────────────────────
// Season highlight extraction from careerSeasons
// ────────────────────────────────────────────────────────────────────

async function buildSeasonHighlights(playerId: string): Promise<NarrativeEvent[]> {
  try {
    const cache = await loadPlayerDetail(playerId);
    if (!cache) return [];
    const seasons = (cache.data.careerSeasons ?? []) as Array<Record<string, unknown>>;
    const events: NarrativeEvent[] = [];
    for (const s of seasons) {
      const year = Number(s.year);
      if (!Number.isFinite(year)) continue;
      const text = describeSeason(s);
      if (text) {
        events.push({ year, text, source: 'naver', sourceUrl: undefined });
      }
    }
    return events;
  } catch {
    return [];
  }
}

function describeSeason(s: Record<string, unknown>): string | null {
  const num = (k: string) => (typeof s[k] === 'number' ? (s[k] as number) : 0);
  const hr = num('hr');
  const sb = num('sb');
  const avg = num('avg');
  const ops = num('ops');
  const war = num('war');
  const era = num('era');
  const ip = num('ip');
  const k = num('k');
  const w = num('w');

  // Pitcher
  if (ip > 0 || era > 0) {
    const parts: string[] = [];
    if (ip > 0) parts.push(`${ip.toFixed(1)}이닝`);
    if (era > 0) parts.push(`ERA ${era.toFixed(2)}`);
    if (k > 0) parts.push(`${k}K`);
    if (w > 0) parts.push(`${w}승`);
    if (war >= 3) parts.push(`WAR ${war.toFixed(1)}`);
    return parts.length > 0 ? parts.join(' · ') : null;
  }

  // Hitter
  const parts: string[] = [];
  if (avg > 0) parts.push(`타율 ${avg.toFixed(3).replace(/^0/, '')}`);
  if (hr > 0) parts.push(`${hr}홈런`);
  if (sb > 0) parts.push(`${sb}도루`);
  if (ops > 0) parts.push(`OPS ${ops.toFixed(3).replace(/^0/, '')}`);
  if (war >= 3) parts.push(`WAR ${war.toFixed(1)}`);

  // Add 30-30 / 40-40 callout
  if (hr >= 40 && sb >= 40) parts.unshift('40-40');
  else if (hr >= 30 && sb >= 30) parts.unshift('30-30');

  return parts.length > 0 ? parts.join(' · ') : null;
}

// ────────────────────────────────────────────────────────────────────
// Namu wiki fallback (simple regex)
// ────────────────────────────────────────────────────────────────────

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
  const before = block.slice(0, idx).split(/[.。!?]\s*/).pop() ?? '';
  const afterRaw = block.slice(idx);
  const afterEnd = afterRaw.search(/[.。!?]/);
  const after = afterEnd >= 0 ? afterRaw.slice(0, afterEnd) : afterRaw;
  return `${before}${after}`.replace(/\s+/g, ' ').trim();
}

// ────────────────────────────────────────────────────────────────────
// Merge + dedupe
// ────────────────────────────────────────────────────────────────────

function mergeEvents(...lists: NarrativeEvent[][]): NarrativeEvent[] {
  const merged: NarrativeEvent[] = [];
  const yearTextSeen = new Set<string>();
  for (const list of lists) {
    for (const e of list) {
      const key = `${e.year}|${e.text.slice(0, 30)}`;
      if (yearTextSeen.has(key)) continue;
      yearTextSeen.add(key);
      merged.push(e);
    }
  }
  return merged.sort((a, b) => a.year - b.year).slice(0, MAX_EVENTS);
}

// ────────────────────────────────────────────────────────────────────
// Cache
// ────────────────────────────────────────────────────────────────────

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
