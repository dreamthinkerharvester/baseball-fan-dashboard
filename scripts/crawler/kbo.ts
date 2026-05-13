// Design Ref: §6 — KBO 공식 사이트 크롤러.
//
// Phase 0 POC 결과 (2026-05-09):
//   ✅ 순위 (TeamRank): `table.tData[summary*="순위"]` + 12 컬럼 위치 기반 — 실 HTML 검증 완료
//   ✅ 스케줄 (Schedule): Playwright hydration 후 `td.play` 안의 spans 파싱 — 실 hydrated HTML 검증 완료
//      운영 옵션 A 채택. KBO_SCHEDULE_BROWSER=1 시 kbo-playwright.ts 경유.
//      raw fetch는 빈 tbody 반환 (placeholder fallback).
//   🚨 스탯티즈: 모든 데이터 페이지 로그인 wall — DEPRECATED, OPS path로 우회.
//
// Plan R1 — 차단 위험 최소화: User-Agent 명시, 요청 간 4초 delay, 재시도 3회.

import * as cheerio from 'cheerio';

import { todayKstString } from '@/lib/date';
import {
  RawGameSchema,
  RawStandingsRowSchema,
  normalizeGame,
  normalizeStandingsRow,
} from '@/lib/data/normalizer';

import { fetchHtml, type FetchResult } from './http';

import type { Game, StandingsRow } from '@/types';

// ────────────────────────────────────────────────────────────────────────────
// URL & selector configuration (single source of truth)
// ────────────────────────────────────────────────────────────────────────────
export const KBO_URLS = {
  schedule: (date: string) =>
    `https://www.koreabaseball.com/Schedule/Schedule.aspx?seriesId=&teamId=&date=${date}`,
  scheduleJson: () => `https://www.koreabaseball.com/ws/Schedule.asmx/GetScheduleList`,
  standings: () => `https://www.koreabaseball.com/Record/TeamRank/TeamRank.aspx`,
  lineup: (gameId: string) => `https://www.koreabaseball.com/Game/Lineup/${gameId}`,
} as const;

/** HTML selector. KBO 사이트 구조 변경 시 이 객체만 수정. */
export const KBO_SELECTORS = {
  /**
   * ✅ Schedule — 실 hydrated HTML 검증 (Phase 0 POC option A, Playwright).
   * 9 cells per row:
   *   td.day rowspan=N "05.01(금)"  ← 첫 게임에만 (rowspan으로 그룹화)
   *   td.time   <b>17:00</b>
   *   td.play   <span>NC</span><em><span class="lose">1</span>vs<span class="win">5</span></em><span>LG</span>
   *   td.relay  ...리뷰 링크
   *   td        하이라이트 링크
   *   td        TV
   *   td        라디오
   *   td        구장 ("잠실")
   *   td        비고 ("-")
   */
  schedule: {
    rows: 'table#tblScheduleList tbody tr',
    cells: {
      date: 'td.day',
      time: 'td.time',
      play: 'td.play',
      relay: 'td.relay a',
    },
  },
  /**
   * ✅ Standings — 실 HTML 검증 (Phase 0 POC).
   * 페이지에 class="tData" 테이블이 2개(순위표 + 팀간승패표) — summary 속성으로 좁힘.
   * 12 컬럼: 순위/팀명/경기/승/패/무/승률/게임차/최근10경기/연속/홈/방문
   */
  standings: {
    rows: 'table.tData[summary*="순위"] tbody tr',
    columnIndex: {
      rank: 0,
      teamName: 1,
      games: 2,
      wins: 3,
      losses: 4,
      draws: 5,
      winPct: 6,
      gamesBehind: 7,
      recent10: 8,
      streak: 9,
      home: 10,
      away: 11,
    },
  },
} as const;

// ────────────────────────────────────────────────────────────────────────────
// Public API
// ────────────────────────────────────────────────────────────────────────────

export interface CrawlOutcome<T> {
  status: 'success' | 'failed';
  data?: T;
  fetch: FetchResult;
  errorMessage?: string;
}

export async function crawlSchedule(
  date: string = todayKstString(),
): Promise<CrawlOutcome<Game[]>> {
  const fetch = await fetchHtml({ url: KBO_URLS.schedule(date), source: 'kbo' });
  if (fetch.status !== 'success' || !fetch.body) {
    return { status: 'failed', fetch, errorMessage: fetch.errorMessage };
  }
  try {
    const games = parseSchedule(fetch.body, date);
    return { status: 'success', data: games, fetch };
  } catch (e: unknown) {
    return { status: 'failed', fetch, errorMessage: (e as Error).message };
  }
}

export async function crawlStandings(): Promise<CrawlOutcome<StandingsRow[]>> {
  const fetch = await fetchHtml({ url: KBO_URLS.standings(), source: 'kbo' });
  if (fetch.status !== 'success' || !fetch.body) {
    return { status: 'failed', fetch, errorMessage: fetch.errorMessage };
  }
  try {
    const rows = parseStandings(fetch.body);
    return { status: 'success', data: rows, fetch };
  } catch (e: unknown) {
    return { status: 'failed', fetch, errorMessage: (e as Error).message };
  }
}

// ────────────────────────────────────────────────────────────────────────────
// HTML parsers (exported for unit tests with fixture HTML)
// ────────────────────────────────────────────────────────────────────────────

/**
 * Hydrated KBO 스케줄 HTML 파싱. 한 페이지가 *전체 월*을 보여주므로 결과는 다중 날짜.
 * `dateHint`는 fallback — td.day rowspan으로 발견된 날짜 우선.
 */
export function parseSchedule(html: string, dateHint: string): Game[] {
  const $ = cheerio.load(html);
  const games: Game[] = [];
  const seenIds = new Map<string, number>();
  let currentDate = dateHint;

  $(KBO_SELECTORS.schedule.rows).each((_, el) => {
    const row = $(el);
    const dayCell = row.find(KBO_SELECTORS.schedule.cells.date);
    if (dayCell.length > 0) {
      const dayParsed = parseScheduleDayCell(dayCell.text().trim(), dateHint);
      if (dayParsed) currentDate = dayParsed;
    }

    const play = row.find(KBO_SELECTORS.schedule.cells.play);
    if (play.length === 0) return;
    const parsed = parsePlayCell($, play);
    if (!parsed) return;

    const baseKey = `${currentDate}-${parsed.away}-${parsed.home}`;
    const dhCount = (seenIds.get(baseKey) ?? 0) + 1;
    seenIds.set(baseKey, dhCount);

    // 구장은 마지막 td 직전 (note 바로 앞). 동적으로 마지막에서 두 번째 td 사용.
    const allTds = row.find('td');
    const stadium = allTds.eq(allTds.length - 2).text().trim();
    const time = row.find(KBO_SELECTORS.schedule.cells.time).text().trim();

    try {
      const raw = RawGameSchema.parse({
        date: currentDate,
        startTime: time || '00:00',
        homeTeamName: parsed.home,
        awayTeamName: parsed.away,
        stadium: stadium || '미정',
        statusText: parsed.status,
        ...(parsed.homeScore != null ? { homeScoreText: parsed.homeScore } : {}),
        ...(parsed.awayScore != null ? { awayScoreText: parsed.awayScore } : {}),
        ...(dhCount > 1 ? { doubleHeader: 2 as const } : {}),
      });
      games.push(normalizeGame(raw));
    } catch {
      // 잘못된 행은 skip — selector 변경 시 grace
    }
  });
  return games;
}

/**
 * td.day 텍스트 "MM.DD(요일)" → "YYYY-MM-DD" 보정.
 * year는 dateHint에서 추출.
 */
export function parseScheduleDayCell(text: string, dateHint: string): string | null {
  const m = text.match(/^(\d{1,2})[.\/](\d{1,2})/);
  if (!m) return null;
  const yearMatch = dateHint.match(/^(\d{4})/);
  const year = yearMatch ? yearMatch[1] : new Date().getFullYear().toString();
  const mm = (m[1] ?? '').padStart(2, '0');
  const dd = (m[2] ?? '').padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

/**
 * td.play 셀 (cheerio Cheerio 객체)에서 양 팀 + 점수 추출.
 *   <span>NC</span><em><span class="lose">1</span>vs<span class="win">5</span></em><span>LG</span>
 *   → away=NC, awayScore=1, homeScore=5, home=LG, status=종료
 */
export function parsePlayCell(
  $: cheerio.CheerioAPI,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  play: cheerio.Cheerio<any>,
): {
  away: string;
  home: string;
  status: string;
  homeScore?: string;
  awayScore?: string;
} | null {
  const directSpans = play.children('span');
  if (directSpans.length < 2) {
    return parseGameCell(play.text());
  }
  const away = $(directSpans[0]!).text().trim();
  const home = $(directSpans[directSpans.length - 1]!).text().trim();
  if (!away || !home) return null;

  const em = play.children('em').first();
  const scoreSpans = em.children('span');
  if (scoreSpans.length >= 2) {
    const awayScore = $(scoreSpans[0]!).text().trim();
    const homeScore = $(scoreSpans[scoreSpans.length - 1]!).text().trim();
    if (/^\d+$/.test(awayScore) && /^\d+$/.test(homeScore)) {
      return { away, home, awayScore, homeScore, status: '종료' };
    }
  }
  return { away, home, status: '예정' };
}

/**
 * Plain text fallback (older fixtures 또는 비표준 HTML).
 *   "LG vs KT"           → status=예정
 *   "LG 5 - 3 KT"        → status=종료
 */
export function parseGameCell(text: string): {
  away: string;
  home: string;
  status: string;
  homeScore?: string;
  awayScore?: string;
} | null {
  const compact = text.replace(/\s+/g, ' ').trim();
  if (!compact) return null;
  const scoreMatch = compact.match(/^(\S+)\s+(\d+)\s*-\s*(\d+)\s+(\S+)$/);
  if (scoreMatch) {
    return {
      away: scoreMatch[1] ?? '',
      awayScore: scoreMatch[2],
      homeScore: scoreMatch[3],
      home: scoreMatch[4] ?? '',
      status: '종료',
    };
  }
  const vsMatch = compact.match(/^(\S+)\s+vs\s+(\S+)$/i);
  if (vsMatch) {
    return { away: vsMatch[1] ?? '', home: vsMatch[2] ?? '', status: '예정' };
  }
  return null;
}

export function parseStandings(html: string): StandingsRow[] {
  const $ = cheerio.load(html);
  const rows: StandingsRow[] = [];
  const cols = KBO_SELECTORS.standings.columnIndex;
  $(KBO_SELECTORS.standings.rows).each((_, el) => {
    const cells = $(el).find('td');
    if (cells.length < cols.streak + 1) return;
    const teamName = txt(cells.eq(cols.teamName));
    if (!teamName) return;
    const raw = RawStandingsRowSchema.parse({
      rank: txt(cells.eq(cols.rank)),
      teamName,
      wins: txt(cells.eq(cols.wins)),
      losses: txt(cells.eq(cols.losses)),
      draws: txt(cells.eq(cols.draws)),
      winPct: txt(cells.eq(cols.winPct)),
      gamesBehind: txt(cells.eq(cols.gamesBehind)),
      streak: txt(cells.eq(cols.streak)) || undefined,
    });
    rows.push(normalizeStandingsRow(raw));
  });
  return rows;
}

// cheerio v1은 Element 타입을 default export로 노출하지 않음.
// 함수는 `.text()`만 사용하므로 minimal duck-type으로 충분.
function txt(node: { text: () => string }): string {
  return node.text().trim();
}
