// Phase 0 POC option A — Playwright-based KBO 스케줄 hydration.
//
// 배경: kbo.ts의 fetchHtml은 초기 HTML만 가져오므로 schedule tbody가 비어있음.
//       JSON 엔드포인트는 401 차단. 유일한 대안이 헤드리스 브라우저 hydration.
//
// 사용:
//   pnpm crawl:schedule:browser   # cron entry
//   또는 STATIZ_PROBE는 별도 — 이건 KBO 한정
//
// 비용: 한 요청 ~3-5초 + 메모리 ~150MB. cron에 적합.
//       Vercel cron timeout 60초 내 포함 가능 (3-5초로 충분).

import { todayKstString } from '@/lib/date';

import { KBO_URLS, parseSchedule } from './kbo';
import type { CrawlOutcome } from './kbo';

import type { Game } from '@/types';

export interface PlaywrightCrawlOptions {
  /** 페이지 로드 후 추가 대기 (ms). hydration 완료 보장. default 2000. */
  hydrationWaitMs?: number;
  /** Playwright 브라우저 launch timeout. default 30000. */
  launchTimeoutMs?: number;
  /** 페이지 navigate timeout. default 30000. */
  navigationTimeoutMs?: number;
  /** 헤드리스 모드 (default true; 디버그 시 false). */
  headless?: boolean;
}

/**
 * KBO 스케줄을 Playwright로 가져와 hydrated HTML에서 게임 추출.
 *
 * playwright는 devDependency이므로 dynamic import — 운영 시 OPT_IN 시만 실제 로드.
 */
export async function crawlScheduleViaPlaywright(
  date: string = todayKstString(),
  options: PlaywrightCrawlOptions = {},
): Promise<CrawlOutcome<Game[]>> {
  const start = Date.now();
  const {
    hydrationWaitMs = 2000,
    launchTimeoutMs = 30_000,
    navigationTimeoutMs = 30_000,
    headless = true,
  } = options;

  // dynamic import — playwright가 production deps에 없어도 빌드 안 깨짐
  let chromium: typeof import('playwright').chromium;
  try {
    const mod = await import('playwright');
    chromium = mod.chromium;
  } catch (e) {
    return mkFail(
      `playwright not installed — run \`pnpm add -D playwright\` and \`pnpm exec playwright install chromium\`. Detail: ${(e as Error).message}`,
      start,
    );
  }

  let browser: import('playwright').Browser | null = null;
  try {
    browser = await chromium.launch({ headless, timeout: launchTimeoutMs });
    const context = await browser.newContext({
      userAgent:
        process.env.KBO_USER_AGENT ??
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/121 Safari/537.36',
      locale: 'ko-KR',
      timezoneId: 'Asia/Seoul',
    });
    const page = await context.newPage();
    page.setDefaultTimeout(navigationTimeoutMs);

    const url = KBO_URLS.schedule(date);
    await page.goto(url, { waitUntil: 'networkidle' });
    // tbody에 row가 추가될 때까지 대기 (또는 fallback timeout)
    try {
      await page.waitForSelector('table#tblScheduleList tbody tr', {
        timeout: Math.min(5_000, hydrationWaitMs * 2),
      });
    } catch {
      // 빈 결과(경기 없음)도 정상 — placeholder text 또는 0 rows 모두 허용
    }
    await page.waitForTimeout(hydrationWaitMs);

    const html = await page.content();
    const games = parseSchedule(html, date);
    return {
      status: 'success',
      data: games,
      fetch: {
        status: 'success',
        url,
        source: 'kbo',
        attempts: 1,
        durationMs: Date.now() - start,
        body: html,
      },
    };
  } catch (e: unknown) {
    return mkFail((e as Error).message, start);
  } finally {
    await browser?.close().catch(() => {});
  }
}

function mkFail(message: string, start: number): CrawlOutcome<Game[]> {
  return {
    status: 'failed',
    fetch: {
      status: 'failed',
      url: KBO_URLS.schedule(todayKstString()),
      source: 'kbo',
      attempts: 1,
      durationMs: Date.now() - start,
      errorMessage: message,
    },
    errorMessage: message,
  };
}
