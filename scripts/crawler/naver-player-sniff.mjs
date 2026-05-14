#!/usr/bin/env node
// Sniff Naver mobile player page for career/recent stats APIs.
// Usage: node scripts/crawler/naver-player-sniff.mjs <playerCode>

import { chromium } from 'playwright';

const playerCode = process.argv[2] ?? '52605'; // 김도영

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
  if (!/api-gw\.sports\.naver|sports\.naver/.test(url)) return;
  try {
    const body = await resp.text();
    if (body.length < 200) return;
    responses.push({ url, status: resp.status(), len: body.length, snippet: body.slice(0, 250) });
  } catch { /* */ }
});

// Try common player URL patterns
const URLS = [
  `https://m.sports.naver.com/player/index?playerId=${playerCode}&category=kbo`,
  `https://m.sports.naver.com/kbaseball/player/${playerCode}`,
  `https://m.sports.naver.com/player/${playerCode}`,
];

for (const url of URLS) {
  console.log(`\n=== ${url}`);
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 25000 });
    await page.waitForTimeout(2000);
    console.log(`  final url: ${page.url()}`);
    console.log(`  title: ${await page.title()}`);
  } catch (e) {
    console.log(`  failed: ${e.message}`);
  }
}

console.log(`\n[player-sniff] ${responses.length} JSON responses:\n`);
for (const r of responses) {
  console.log(`${r.status} ${r.url} (${r.len}B)`);
  console.log(`   ${r.snippet.replace(/\s+/g, ' ').slice(0, 200)}\n`);
}

await browser.close();
