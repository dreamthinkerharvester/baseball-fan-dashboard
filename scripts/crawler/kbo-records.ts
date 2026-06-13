// Design Ref: kia-fan-service §2.2, §11 — KBO 공식 기록 페이지 크롤러.
//
// 용도: Myth-Buster 갭 스코어의 "클래식 리그 순위" 원천.
//   - 타자: Record/Player/HitterBasic/Basic1.aspx (규정타석 충족자, AVG 순)
//   - 투수: Record/Player/PitcherBasic/Basic1.aspx (규정이닝 충족자, ERA 순)
//
// 페이지 특성 (2026-06-12 검증):
//   - 테이블은 초기 HTML에 포함 (스케줄과 달리 hydration 불필요)
//   - 단, 페이지네이션이 ASP.NET __doPostBack → Playwright로 페이지 버튼 클릭
//   - 행 링크 href="...playerId=NNNNN" — 네이버 스포츠 API와 동일한 KBO pcode
//
// 투수 테이블은 FIP 자체 산출에 필요한 원시 카운트(HR·BB·HBP·SO·IP·ER)도 수집한다.

import * as cheerio from 'cheerio';

import type { TeamCode } from '@/types';

export const KBO_RECORD_URLS = {
  hitter: 'https://www.koreabaseball.com/Record/Player/HitterBasic/Basic1.aspx',
  pitcher: 'https://www.koreabaseball.com/Record/Player/PitcherBasic/Basic1.aspx',
} as const;

/** KBO 기록 페이지 팀명 표기 → TeamCode. */
const TEAM_NAME_TO_CODE: Record<string, TeamCode> = {
  KIA: 'KIA',
  LG: 'LG',
  KT: 'KT',
  SSG: 'SSG',
  NC: 'NC',
  두산: 'DOOSAN',
  롯데: 'LOTTE',
  삼성: 'SAMSUNG',
  한화: 'HANWHA',
  키움: 'KIWOOM',
};

export interface QualifiedBatterRow {
  playerId: string;
  name: string;
  teamCode: TeamCode;
  avg: number;
}

export interface QualifiedPitcherRow {
  playerId: string;
  name: string;
  teamCode: TeamCode;
  era: number;
  /** 이닝 (소수 변환: 1/3 = 0.333…). */
  ip: number;
  hr: number;
  bb: number;
  hbp: number;
  so: number;
  er: number;
}

export interface KboRecordsOutcome {
  status: 'success' | 'failed';
  batters?: QualifiedBatterRow[];
  pitchers?: QualifiedPitcherRow[];
  errorMessage?: string;
}

/**
 * 규정 충족 타자/투수 전 페이지 크롤.
 * Playwright dynamic import — kbo-playwright.ts와 동일 패턴.
 */
export async function crawlKboRecords(): Promise<KboRecordsOutcome> {
  let chromium: typeof import('playwright').chromium;
  try {
    const mod = await import('playwright');
    chromium = mod.chromium;
  } catch (e) {
    return { status: 'failed', errorMessage: `playwright not installed: ${(e as Error).message}` };
  }

  let browser: import('playwright').Browser | null = null;
  try {
    browser = await chromium.launch({ headless: true, timeout: 30_000 });
    const context = await browser.newContext({
      userAgent:
        process.env.KBO_USER_AGENT ??
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/121 Safari/537.36',
      locale: 'ko-KR',
      timezoneId: 'Asia/Seoul',
    });
    const page = await context.newPage();
    page.setDefaultTimeout(30_000);

    const hitterPages = await collectAllPages(page, KBO_RECORD_URLS.hitter);
    const batters = hitterPages.flatMap((html) => parseHitterTable(html));

    const pitcherPages = await collectAllPages(page, KBO_RECORD_URLS.pitcher);
    const pitchers = pitcherPages.flatMap((html) => parsePitcherTable(html));

    if (batters.length === 0 || pitchers.length === 0) {
      return {
        status: 'failed',
        errorMessage: `empty result — batters=${batters.length}, pitchers=${pitchers.length} (KBO 페이지 구조 변경 의심)`,
      };
    }
    return { status: 'success', batters: dedupe(batters), pitchers: dedupe(pitchers) };
  } catch (e: unknown) {
    return { status: 'failed', errorMessage: (e as Error).message };
  } finally {
    await browser?.close().catch(() => {});
  }
}

/** 1페이지 로드 후 페이저 버튼(btnNo2, btnNo3…)을 차례로 클릭하며 HTML 수집. */
async function collectAllPages(
  page: import('playwright').Page,
  url: string,
): Promise<string[]> {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('table tbody tr', { timeout: 10_000 });
  const htmls: string[] = [await page.content()];

  // 규정 충족자는 ~60명 → 최대 3페이지면 충분. 상한으로 무한 루프 방지.
  for (let no = 2; no <= 4; no++) {
    const btn = page.locator(`a[id*="ucPager_btnNo${no}"]`);
    if ((await btn.count()) === 0) break;
    await btn.first().click();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(800); // postback 재렌더 안정화
    htmls.push(await page.content());
  }
  return htmls;
}

// ────────────────────────────────────────────────────────────────────────────
// parsers — 헤더 텍스트 기반 컬럼 매핑 (KBO가 컬럼 추가/순서 변경해도 견딤)
// ────────────────────────────────────────────────────────────────────────────

interface ParsedTable {
  headers: string[];
  rows: { cells: string[]; playerId: string | null }[];
}

function parseRecordTable(html: string): ParsedTable {
  const $ = cheerio.load(html);
  const table = $('table').filter((_, el) => $(el).find('thead th').length > 5).first();
  const headers = table
    .find('thead th')
    .map((_, el) => $(el).text().trim().toUpperCase())
    .get();
  const rows: ParsedTable['rows'] = [];
  table.find('tbody tr').each((_, tr) => {
    const cells = $(tr)
      .find('td')
      .map((_, td) => $(td).text().trim())
      .get();
    if (cells.length < headers.length - 1) return;
    const href = $(tr).find('a[href*="playerId="]').attr('href') ?? '';
    const m = href.match(/playerId=(\d+)/);
    rows.push({ cells, playerId: m?.[1] ?? null });
  });
  return { headers, rows };
}

function col(headers: string[], name: string): number {
  return headers.findIndex((h) => h === name);
}

export function parseHitterTable(html: string): QualifiedBatterRow[] {
  const { headers, rows } = parseRecordTable(html);
  const iName = col(headers, '선수명');
  const iTeam = col(headers, '팀명');
  const iAvg = col(headers, 'AVG');
  if (iName < 0 || iTeam < 0 || iAvg < 0) return [];
  const out: QualifiedBatterRow[] = [];
  for (const { cells, playerId } of rows) {
    const at = (i: number): string => cells[i] ?? '';
    const teamCode = TEAM_NAME_TO_CODE[at(iTeam)];
    const avg = Number(at(iAvg));
    if (!playerId || !teamCode || !Number.isFinite(avg)) continue;
    out.push({ playerId, name: at(iName), teamCode, avg });
  }
  return out;
}

export function parsePitcherTable(html: string): QualifiedPitcherRow[] {
  const { headers, rows } = parseRecordTable(html);
  const idx = {
    name: col(headers, '선수명'),
    team: col(headers, '팀명'),
    era: col(headers, 'ERA'),
    ip: col(headers, 'IP'),
    hr: col(headers, 'HR'),
    bb: col(headers, 'BB'),
    hbp: col(headers, 'HBP'),
    so: col(headers, 'SO'),
    er: col(headers, 'ER'),
  };
  if (idx.name < 0 || idx.era < 0 || idx.ip < 0) return [];
  const out: QualifiedPitcherRow[] = [];
  for (const { cells, playerId } of rows) {
    const at = (i: number): string => cells[i] ?? '';
    const teamCode = TEAM_NAME_TO_CODE[at(idx.team)];
    const era = Number(at(idx.era));
    const ip = parseInnings(at(idx.ip));
    if (!playerId || !teamCode || !Number.isFinite(era) || ip <= 0) continue;
    out.push({
      playerId,
      name: at(idx.name),
      teamCode,
      era,
      ip,
      hr: int(at(idx.hr)),
      bb: int(at(idx.bb)),
      hbp: int(at(idx.hbp)),
      so: int(at(idx.so)),
      er: int(at(idx.er)),
    });
  }
  return out;
}

/** "53 1/3" | "53.1(표기 안 함)" | "53" → 소수 이닝. */
export function parseInnings(raw: string): number {
  const m = raw.match(/^(\d+)(?:\s+(\d)\/(\d))?$/);
  if (!m) {
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  }
  const whole = Number(m[1]);
  const frac = m[2] ? Number(m[2]) / Number(m[3]) : 0;
  return whole + frac;
}

function int(v: string | undefined): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function dedupe<T extends { playerId: string }>(rows: T[]): T[] {
  const seen = new Set<string>();
  return rows.filter((r) => {
    if (seen.has(r.playerId)) return false;
    seen.add(r.playerId);
    return true;
  });
}
