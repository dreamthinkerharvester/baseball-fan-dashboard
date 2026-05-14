#!/usr/bin/env node
// One-shot inspection: render the Naver mobile game page and dump useful selectors.
// Usage: node scripts/crawler/naver-game-inspect.mjs <gameId>
//   default gameId: 20260514OBHT02026

import { chromium } from 'playwright';

const gameId = process.argv[2] ?? '20260514OBHT02026';

const URLS = [
  `https://m.sports.naver.com/game/${gameId}/relay`,
  `https://m.sports.naver.com/game/${gameId}/lineup`,
  `https://m.sports.naver.com/game/${gameId}/preview`,
  `https://m.sports.naver.com/game/${gameId}/cheer`,
];

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
  viewport: { width: 390, height: 844 },
});
const page = await ctx.newPage();

for (const url of URLS) {
  console.log(`\n========= ${url} =========`);
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 25000 });
  } catch (e) {
    console.log(`  goto failed: ${e.message}`);
    continue;
  }
  await page.waitForTimeout(1500);

  const title = await page.title();
  console.log(`title: ${title}`);

  // Dump key text + image src patterns
  const data = await page.evaluate(() => {
    const out = {};
    out.h1 = [...document.querySelectorAll('h1, h2, h3')].slice(0, 8).map((e) => e.textContent.trim()).filter(Boolean);
    out.imgs = [...document.querySelectorAll('img')]
      .filter((i) => /pstatic|naver/.test(i.src))
      .slice(0, 12)
      .map((i) => ({ src: i.src, alt: i.alt }));

    // Look for lineup-like keywords
    const allText = document.body.innerText;
    out.hasLineupWord = /라인업|선발|타순|선발 라인업/.test(allText);
    out.hasPlayerWord = /김도영|박찬호|나성범|소크라테스|양현종/.test(allText);

    // Sample interesting class names
    const interestingClasses = new Set();
    document.querySelectorAll('[class*="lineup"], [class*="player"], [class*="LineUp"], [class*="Player"]').forEach((el) => {
      const cls = typeof el.className === 'string' ? el.className : (el.className?.baseVal ?? '');
      cls.split(/\s+/).forEach((c) => {
        if (c.match(/lineup|player|batter|pitcher|order/i)) interestingClasses.add(c);
      });
    });
    out.lineupClasses = [...interestingClasses].slice(0, 30);

    return out;
  });

  console.log(JSON.stringify(data, null, 2));

  // Try clicking lineup tab if exists
  const lineupTab = await page.$('text=/라인업|선발/');
  if (lineupTab) {
    console.log('  found lineup link, clicking');
    try {
      await lineupTab.click({ timeout: 3000 });
      await page.waitForTimeout(2000);
      const url2 = page.url();
      console.log(`  navigated to: ${url2}`);
      const players = await page.evaluate(() => {
        const names = ['김도영','박찬호','나성범','소크라테스','양현종','최형우','이우성','김태군','김선빈','이의리','임기영','윤영철','정해영','전상현','최원준'];
        return names.map((n) => ({
          name: n,
          present: document.body.innerText.includes(n),
        }));
      });
      console.log('  KIA player presence:', players.filter((p) => p.present).map((p) => p.name).join(', ') || 'none');
    } catch (e) {
      console.log(`  click failed: ${e.message}`);
    }
  }
}

await browser.close();
