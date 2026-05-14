#!/usr/bin/env node
// Sniff XHR/fetch responses while loading the Naver lineup page.
// Usage: node scripts/crawler/naver-game-api-sniff.mjs <gameId>

import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';

const gameId = process.argv[2] ?? '20260514OBHT02026';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
  viewport: { width: 390, height: 844 },
});
const page = await ctx.newPage();

const responses = [];

page.on('response', async (resp) => {
  const url = resp.url();
  const ctype = resp.headers()['content-type'] ?? '';
  if (!ctype.includes('json')) return;
  if (!/sports|naver|api|game|lineup/.test(url)) return;
  try {
    const body = await resp.text();
    responses.push({ url, status: resp.status(), len: body.length, snippet: body.slice(0, 300) });
  } catch { /* ignore */ }
});

const url = `https://m.sports.naver.com/game/${gameId}/lineup`;
console.log(`[sniff] ${url}`);
await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(3000);

console.log(`\n[sniff] ${responses.length} JSON responses captured:\n`);
for (const r of responses) {
  console.log(`--- ${r.status} ${r.url} (${r.len} bytes)`);
  console.log(`    ${r.snippet.replace(/\s+/g, ' ').slice(0, 200)}`);
}

// Save full body of largest lineup-related response
const lineup = responses.find((r) => /lineup|preview|relay/i.test(r.url) && r.len > 1000);
if (lineup) {
  const full = await (await ctx.request.get(lineup.url, { headers: { 'User-Agent': 'Mozilla/5.0' } })).text();
  await writeFile('/tmp/naver-lineup-sample.json', full);
  console.log(`\n[sniff] Saved full body → /tmp/naver-lineup-sample.json (${full.length} bytes)`);
}

await browser.close();
