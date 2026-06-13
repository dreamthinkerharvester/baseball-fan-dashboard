// Design Ref: §6, §11 — Crawler 메인 진입점. CLI: `pnpm crawl:<action>`.
//
// 사용:
//   pnpm crawl:schedule   # 매일 07:00 KST cron
//   pnpm crawl:standings  # 10분 간격
//   pnpm crawl:lineup     # 30분 간격
//   pnpm crawl:stats      # 매일 06:00 (statiz)
//
// 각 액션은:
//   1) 크롤러 호출 → (FetchResult + 정규화된 도메인 객체) 반환
//   2) 성공 시 /data/*.json 작성 + last-crawl 메타 갱신
//   3) 실패 시 마지막 캐시 보존 + Discord 알림 (Critical: 3회 retry 모두 실패)
//   4) GitHub Actions에서 git diff 감지 → auto commit + push → Vercel 자동 배포

import { todayKstString } from '@/lib/date';
import {
  cachePaths,
  updateLastCrawl,
  writeJsonCache,
} from '@/lib/data/cache';

import { crawlSchedule, crawlStandings } from './kbo';
import { crawlScheduleViaPlaywright } from './kbo-playwright';
import { runSaberPipeline } from './saber-rankings';
import { sendDiscord } from '../notify-discord';

type Action = 'schedule' | 'standings' | 'lineup' | 'saber';

async function main(): Promise<number> {
  const action = (process.argv[2] ?? '') as Action;
  switch (action) {
    case 'schedule':
      return await runSchedule();
    case 'standings':
      return await runStandings();
    case 'lineup':
      return await runLineup();
    case 'saber':
      return await runSaber();
    default:
      console.error(`Unknown action: ${action}. Use one of: schedule, standings, lineup, saber`);
      return 2;
  }
}

async function runSchedule(): Promise<number> {
  const date = todayKstString();
  const action = 'schedule';
  // Phase 0 POC 발견: KBO 스케줄 초기 HTML은 빈 tbody (AJAX). Playwright hydration 우회.
  // KBO_SCHEDULE_BROWSER=1 시 Playwright 사용. 미설정 시 fetchHtml (빈 결과 가능).
  const useBrowser = process.env.KBO_SCHEDULE_BROWSER === '1';
  const r = useBrowser
    ? await crawlScheduleViaPlaywright(date)
    : await crawlSchedule(date);
  if (r.status === 'success' && r.data) {
    // KBO 스케줄 페이지는 *전체 월* 게임을 반환 → 각 게임의 실제 date로 분배 저장.
    const byDate = new Map<string, typeof r.data>();
    for (const g of r.data) {
      const list = byDate.get(g.date) ?? [];
      list.push(g);
      byDate.set(g.date, list);
    }
    for (const [d, games] of byDate) {
      await writeJsonCache(cachePaths.game(d), games);
    }
    await updateLastCrawl('kbo', action, { lastSuccess: nowIso(), lastError: null });
    log({
      source: 'kbo',
      action,
      method: useBrowser ? 'playwright' : 'fetch',
      result: 'ok',
      totalGames: r.data.length,
      datesWritten: byDate.size,
      ms: r.fetch.durationMs,
    });
    return 0;
  }
  return await failure('kbo', action, r.errorMessage ?? 'unknown');
}

async function runStandings(): Promise<number> {
  const r = await crawlStandings();
  const action = 'standings';
  if (r.status === 'success' && r.data) {
    await writeJsonCache(cachePaths.standings, r.data);
    await updateLastCrawl('kbo', action, { lastSuccess: nowIso(), lastError: null });
    log({ source: 'kbo', action, result: 'ok', count: r.data.length, ms: r.fetch.durationMs });
    return 0;
  }
  return await failure('kbo', action, r.errorMessage ?? 'unknown');
}

async function runLineup(): Promise<number> {
  // Lineup은 게임별 ID를 알아야 하므로 schedule 캐시 → 각 게임 lineup 크롤.
  // MVP scaffolding: 향후 module-3 후반에 implementation 보강.
  log({ source: 'kbo', action: 'lineup', result: 'skipped', reason: 'requires game ids — TODO M3.5' });
  return 0;
}

// kia-fan-service 피벗: statiz `stats` 액션 제거 (로그인 wall — Phase 0 POC).
// 세이버 수집은 `saber` 액션(KBO 기록 페이지 + 네이버 API)이 대체.

// Design Ref: kia-fan-service §2.2 — Myth-Buster 세이버 파이프라인 (매일 06:30 KST).
// KBO 기록 페이지(클래식 순위) + 네이버 API(wRC+ 등) → saber_rankings.json + KIA 캐시 보강.
async function runSaber(): Promise<number> {
  const action = 'saber';
  const season = new Date().getFullYear();
  const r = await runSaberPipeline(season);
  if (r.status === 'success' && r.rankings) {
    await updateLastCrawl('saber', action, { lastSuccess: nowIso(), lastError: null });
    log({
      source: 'saber',
      action,
      result: 'ok',
      kiaEntries: r.rankings.entries.length,
      qualifiedBatters: r.rankings.qualifiedBatters,
      qualifiedPitchers: r.rankings.qualifiedPitchers,
      enrichedPlayers: r.enrichedPlayers,
    });
    return 0;
  }
  return await failure('saber', action, r.errorMessage ?? 'unknown');
}

async function failure(source: string, action: string, message: string): Promise<number> {
  const at = nowIso();
  await updateLastCrawl(source, action, { lastError: `${at}: ${message}` });
  log({ source, action, result: 'fail', error: message });
  // Critical 알림 (Design §6.4 CRITICAL)
  await sendDiscord({
    severity: 'critical',
    text: `[CRITICAL] ${source}/${action} crawl failed → stale cache fallback.\nReason: ${message}`,
  });
  // 빌드는 실패시키지 않음 (stale cache로 서비스 지속). exit 1은 모니터링 신호.
  return 1;
}

function nowIso(): string {
  return new Date().toISOString();
}

function log(obj: Record<string, unknown>): void {
  // 구조화 JSON 로그 (Design §10.4)
  console.log(JSON.stringify({ ts: nowIso(), level: 'info', ...obj }));
}

main().then((code) => {
  process.exit(code);
});
