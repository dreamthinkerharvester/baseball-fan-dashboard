#!/usr/bin/env node
// Fetch latest news per KIA player from the Naver News Open API and write
// data/news/{id}.json (read by the editorial player detail page /players/[id]).
//
// Mirrors the logic of src/services/storybook/news.ts (HTML strip, publisher
// extraction, NSFW keyword block) but writes the standard per-player cache.
//
// Requires NAVER_NEWS_CLIENT_ID / NAVER_NEWS_CLIENT_SECRET (Naver Developers
// Console → 검색 API). Without keys it logs and exits 0 — the page then falls
// back to an outbound Naver search link, so the build never breaks.
//
// Usage: node scripts/crawler/naver-fetch-news.mjs [teamCode=KIA]

import { readFile, writeFile, mkdir } from 'node:fs/promises';

const TEAM_CODE = process.argv[2] ?? 'KIA';
const NAVER_NEWS_URL = 'https://openapi.naver.com/v1/search/news.json';
const PER_PLAYER_LIMIT = 6;
const REQUEST_GAP_MS = 250; // polite spacing between API calls

const BLOCK_KEYWORDS = ['음주', '음주운전', '스캔들', '폭행', '성범죄', '도박', '마약'];
const PREFERRED_PUBLISHERS = ['스포츠동아', '스포츠경향', '마이데일리', 'OSEN', '엑스포츠뉴스'];

const clientId = process.env.NAVER_NEWS_CLIENT_ID;
const clientSecret = process.env.NAVER_NEWS_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.log(
    '[naver-fetch-news] NAVER_NEWS_CLIENT_ID/SECRET 미설정 — 뉴스 크롤 건너뜀 (페이지는 외부 링크로 폴백).',
  );
  process.exit(0);
}

const players = JSON.parse(await readFile('data/players.json', 'utf8'));
const target = players.filter((p) => p.teamCode === TEAM_CODE);
console.log(`[naver-fetch-news] ${TEAM_CODE} target: ${target.length} players`);

await mkdir('data/news', { recursive: true });

let ok = 0;
let empty = 0;
for (const p of target) {
  try {
    const teamName = '타이거즈';
    let items = await callNaver(`"${p.name}" ${teamName}`);
    if (items.length < 4) {
      const fallback = await callNaver(`${p.name} KIA`);
      items = mergeUnique(items, fallback);
    }
    const clips = filterClips(items).slice(0, PER_PLAYER_LIMIT);
    const cache = {
      playerId: p.id,
      playerName: p.name,
      items: clips,
      fetchedAt: new Date().toISOString(),
    };
    await writeFile(`data/news/${p.id}.json`, JSON.stringify(cache, null, 2) + '\n', 'utf8');
    if (clips.length > 0) ok++;
    else empty++;
    console.log(`  ${clips.length > 0 ? '✓' : '·'} ${p.id} ${p.name} — ${clips.length} clips`);
  } catch (e) {
    console.log(`  ✗ ${p.id} ${p.name} — ${e?.message ?? e}`);
  }
  await sleep(REQUEST_GAP_MS);
}
console.log(`[naver-fetch-news] done — ${ok} with news, ${empty} empty.`);

// ────────────────────────────────────────────────────────────────────────────
async function callNaver(query) {
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
    const body = await res.json();
    return body.items ?? [];
  } catch {
    return [];
  }
}

function filterClips(items) {
  return items
    .filter(
      (item) =>
        !BLOCK_KEYWORDS.some(
          (kw) => item.title?.includes(kw) || (item.description ?? '').includes(kw),
        ),
    )
    .map((item) => {
      const url = item.originallink || item.link || '';
      return {
        title: stripHtml(item.title ?? ''),
        publisher: extractPublisher(url),
        date: parsePubDate(item.pubDate ?? ''),
        url,
      };
    })
    .filter((c) => c.url.length > 0 && c.title.length > 0)
    .sort((a, b) => {
      const aPref = PREFERRED_PUBLISHERS.indexOf(a.publisher);
      const bPref = PREFERRED_PUBLISHERS.indexOf(b.publisher);
      if (aPref !== -1 && bPref === -1) return -1;
      if (bPref !== -1 && aPref === -1) return 1;
      return (b.date ?? '').localeCompare(a.date ?? '');
    });
}

function stripHtml(s) {
  return s
    .replace(/<[^>]*>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .trim();
}

function extractPublisher(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    const tld = host.split('.')[0] ?? host;
    const map = {
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
      spotvnews: 'SPOTV뉴스',
      sportalkorea: '스포탈코리아',
    };
    return map[tld] ?? host;
  } catch {
    return 'Unknown';
  }
}

function parsePubDate(pubDate) {
  const d = new Date(pubDate);
  if (Number.isNaN(d.getTime())) return pubDate.slice(0, 10);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function mergeUnique(a, b) {
  const seen = new Set();
  const merged = [];
  for (const item of [...a, ...b]) {
    const key = item.originallink || item.link || item.title;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(item);
    }
  }
  return merged;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
