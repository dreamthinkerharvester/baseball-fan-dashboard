// Storybook M5: Naver News Clips — Design Ref §4.

import { promises as fs } from 'node:fs';
import path from 'node:path';

import type { NewsClip } from '@/types';

const NAVER_NEWS_URL = 'https://openapi.naver.com/v1/search/news.json';
const CACHE_DIR =
  process.env.STORYBOOK_CACHE_DIR ?? path.join(process.cwd(), 'data', 'storybook', 'cache');
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const BLOCK_KEYWORDS = ['음주', '음주운전', '스캔들', '폭행', '성범죄', '도박', '마약'];
const PREFERRED_PUBLISHERS = [
  '스포츠동아',
  '스포츠경향',
  '마이데일리',
  'OSEN',
  '엑스포츠뉴스',
];

interface NaverNewsItem {
  title: string;
  originallink?: string;
  link?: string;
  description: string;
  pubDate: string;
}

interface NaverNewsResponse {
  items: NaverNewsItem[];
}

interface NewsCacheEntry {
  cachedAt: string;
  clips: NewsClip[];
}

export async function fetchNewsClips(
  playerName: string,
  yearRange: { from: number; to: number },
  options: { limit?: number; useCache?: boolean } = {},
): Promise<NewsClip[]> {
  const { limit = 10, useCache = true } = options;
  const cacheKey = `news_${playerName}_${yearRange.from}-${yearRange.to}`;

  if (useCache) {
    const cached = await readCache(cacheKey);
    if (cached) return cached.clips.slice(0, limit);
  }

  const clientId = process.env.NAVER_NEWS_CLIENT_ID;
  const clientSecret = process.env.NAVER_NEWS_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return [];
  }

  const primaryQuery = `"${playerName}" ${yearRange.from}`;
  let items = await callNaver(primaryQuery, clientId, clientSecret);

  if (items.length < 5) {
    const fallback = await callNaver(`${playerName} 활약`, clientId, clientSecret);
    items = mergeUnique(items, fallback);
  }

  const clips = filterClips(items).slice(0, limit);
  await writeCache(cacheKey, clips);
  return clips;
}

async function callNaver(
  query: string,
  clientId: string,
  clientSecret: string,
): Promise<NaverNewsItem[]> {
  const url = `${NAVER_NEWS_URL}?query=${encodeURIComponent(query)}&display=20&start=1&sort=sim`;
  try {
    const res = await fetch(url, {
      headers: {
        'X-Naver-Client-Id': clientId,
        'X-Naver-Client-Secret': clientSecret,
        Accept: 'application/json',
      },
    });
    if (!res.ok) return [];
    const body = (await res.json()) as NaverNewsResponse;
    return body.items ?? [];
  } catch {
    return [];
  }
}

export function filterClips(items: NaverNewsItem[]): NewsClip[] {
  return items
    .filter(
      (item) =>
        !BLOCK_KEYWORDS.some(
          (kw) => item.title.includes(kw) || (item.description ?? '').includes(kw),
        ),
    )
    .map((item) => {
      const url = item.originallink || item.link || '';
      return {
        title: stripHtml(item.title),
        publisher: extractPublisher(url),
        date: parsePubDate(item.pubDate),
        url,
      };
    })
    .filter((c) => c.url.length > 0)
    .sort((a, b) => {
      const aPref = PREFERRED_PUBLISHERS.indexOf(a.publisher);
      const bPref = PREFERRED_PUBLISHERS.indexOf(b.publisher);
      if (aPref !== -1 && bPref === -1) return -1;
      if (bPref !== -1 && aPref === -1) return 1;
      return 0;
    });
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').trim();
}

export function extractPublisher(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    const tld = host.split('.')[0] ?? host;
    const map: Record<string, string> = {
      donga: '동아일보',
      sportsdonga: '스포츠동아',
      khan: '스포츠경향',
      sports: '스포츠경향',
      mydaily: '마이데일리',
      osen: 'OSEN',
      xportsnews: '엑스포츠뉴스',
      yna: '연합뉴스',
      news1: '뉴스1',
      newsis: '뉴시스',
      chosun: '조선일보',
      hani: '한겨레',
      mk: '매일경제',
    };
    return map[tld] ?? host;
  } catch {
    return 'Unknown';
  }
}

export function parsePubDate(pubDate: string): string {
  // "Sat, 28 Sep 2024 10:30:00 +0900" → "2024-09-28"
  const d = new Date(pubDate);
  if (Number.isNaN(d.getTime())) return pubDate.slice(0, 10);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function mergeUnique(a: NaverNewsItem[], b: NaverNewsItem[]): NaverNewsItem[] {
  const seen = new Set<string>();
  const merged: NaverNewsItem[] = [];
  for (const item of [...a, ...b]) {
    const key = item.originallink || item.link || item.title;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(item);
    }
  }
  return merged;
}

async function readCache(key: string): Promise<NewsCacheEntry | null> {
  try {
    const abs = path.join(CACHE_DIR, 'news', `${key}.json`);
    const text = await fs.readFile(abs, 'utf8');
    const entry = JSON.parse(text) as NewsCacheEntry;
    const age = Date.now() - new Date(entry.cachedAt).getTime();
    if (age > CACHE_TTL_MS) return null;
    return entry;
  } catch {
    return null;
  }
}

async function writeCache(key: string, clips: NewsClip[]): Promise<void> {
  try {
    const dir = path.join(CACHE_DIR, 'news');
    await fs.mkdir(dir, { recursive: true });
    const entry: NewsCacheEntry = { cachedAt: new Date().toISOString(), clips };
    await fs.writeFile(path.join(dir, `${key}.json`), JSON.stringify(entry, null, 2), 'utf8');
  } catch {
    // 캐시 실패는 silent — 다음 조회 시 재시도
  }
}
