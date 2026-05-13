// Debug: save hydrated KBO schedule HTML
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const url = 'https://www.koreabaseball.com/Schedule/Schedule.aspx';
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  userAgent:
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/121 Safari/537.36',
  locale: 'ko-KR',
  timezoneId: 'Asia/Seoul',
});
const page = await context.newPage();

await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 });
await page.waitForTimeout(3000);

const html = await page.content();
writeFileSync('D:/dev/kbo-schedule-hydrated.html', html, 'utf8');
console.log(`saved: ${html.length} bytes`);

// Inspect tbody contents
const tbody = await page.locator('table#tblScheduleList tbody').innerHTML().catch(() => 'NOT FOUND');
console.log('tbody first 600 chars:');
console.log(tbody.substring(0, 600));

const rowCount = await page.locator('table#tblScheduleList tbody tr').count();
console.log(`row count: ${rowCount}`);

if (rowCount > 0) {
  const firstRow = await page.locator('table#tblScheduleList tbody tr').first().innerHTML();
  console.log('--- first row ---');
  console.log(firstRow);
}

await browser.close();
