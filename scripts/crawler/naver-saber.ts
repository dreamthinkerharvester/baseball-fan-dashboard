// Design Ref: kia-fan-service §2.2 — 네이버 스포츠 선수 기록 API에서 세이버 지표 추출.
//
// POC 결과 (2026-06-12, 김도영 52605 / 양현종 77637 실측):
//   - 타자: wrcPlus·woba·war·babip 직접 제공 + kk/bb/hp/sf/sh/ab → K%·BB% 산출 가능
//   - 투수: war·kp(K%)·bbp(BB%)·hr·bb·hp·kk·bf·inn2 제공 — FIP는 원시 카운트로 자체 산출
//   - Statiz 로그인 장벽(2026-05-09 Phase 0)과 무관하게 무인증 접근 가능
//
// 정중한 크롤링: 호출 간 300ms 딜레이, 모바일 UA + Referer.

const RECORD_API = (id: string) => `https://api-gw.sports.naver.com/players/kbo/${id}/playerend-record`;

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
  Referer: 'https://m.sports.naver.com/',
} as const;

export interface NaverBatterSaber {
  playerType: 'batter';
  season: number;
  games: number;
  avg: number;
  obp: number;
  slg: number;
  ops: number;
  hr: number;
  rbi: number;
  sb: number;
  wrcPlus: number | null;
  woba: number | null;
  war: number | null;
  babip: number | null;
  kPct: number | null;
  bbPct: number | null;
  /** 최근 5경기 요약 ("5G .357 1HR 4타점") — 근황 표시용. */
  recentForm: string | null;
  /** 마지막 출전일 (MM.DD). */
  lastGameDate: string | null;
}

export interface NaverPitcherSaber {
  playerType: 'pitcher';
  season: number;
  games: number;
  era: number;
  whip: number;
  w: number;
  l: number;
  sv: number;
  hold: number;
  war: number | null;
  kPct: number | null;
  bbPct: number | null;
  babip: number | null;
  /** FIP 원시값 = (13·HR + 3·(BB+HBP) − 2·K)/IP — 리그 상수는 saber-rankings에서 더함. */
  fipRaw: number | null;
  ip: number;
  /** 최근 등판 요약 ("06.06 삼성전 5이닝 0자책 4K"). */
  recentForm: string | null;
  lastGameDate: string | null;
}

export type NaverSaber = NaverBatterSaber | NaverPitcherSaber;

interface NaverSeasonRow {
  gyear?: string;
  team?: string;
  gamenum?: number;
  // batter
  hra?: string | number;
  ab?: number;
  bb?: number;
  hp?: number;
  sf?: number;
  sh?: number;
  kk?: number;
  hr?: number;
  hit?: number;
  rbi?: number;
  sb?: number;
  obp?: number;
  slg?: number;
  ops?: number;
  wrcPlus?: number;
  woba?: number;
  war?: number;
  babip?: number;
  // pitcher
  era?: number;
  whip?: number;
  bf?: number;
  inn2?: number;
  kp?: number;
  bbp?: number;
  er?: number;
  w?: number;
  l?: number;
  sv?: number;
  hold?: number;
}

/** 네이버 경기 로그 행 (record.game[]). */
interface NaverGameRow {
  gday?: string; // YYYYMMDD
  opponent?: string;
  // batter
  ab?: number;
  hit?: number;
  hr?: number;
  rbi?: number;
  // pitcher
  inn?: string;
  er?: number;
  kk?: number;
  wls?: string;
}

/** 단일 선수의 현재 시즌 세이버 지표. 실패/데이터 없음 = null. */
export async function fetchNaverSaber(
  playerId: string,
  season: number,
): Promise<NaverSaber | null> {
  let json: unknown;
  try {
    const res = await fetch(RECORD_API(playerId), { headers: HEADERS });
    if (!res.ok) return null;
    json = await res.json();
  } catch {
    return null;
  }
  const result = (json as { result?: Record<string, unknown> })?.result;
  if (!result) return null;

  const record = parseMaybeJson(result.record) as {
    season?: NaverSeasonRow[];
    game?: NaverGameRow[];
  } | null;
  const row = record?.season?.find((s) => s.gyear === String(season));
  if (!row) return null;
  const games = (record?.game ?? []).slice(0, 5); // 최신순 5경기

  const playerType = result.playerType === 'pitcher' ? 'pitcher' : 'batter';
  if (playerType === 'batter') {
    const pa = n(row.ab) + n(row.bb) + n(row.hp) + n(row.sf) + n(row.sh);
    return {
      playerType,
      season,
      games: n(row.gamenum),
      avg: num(row.hra) ?? 0,
      obp: n(row.obp),
      slg: n(row.slg),
      ops: n(row.ops),
      hr: n(row.hr),
      rbi: n(row.rbi),
      sb: n(row.sb),
      wrcPlus: posOrNull(row.wrcPlus),
      woba: posOrNull(row.woba),
      war: numOrNull(row.war),
      babip: posOrNull(row.babip),
      kPct: pa > 0 ? round1((n(row.kk) / pa) * 100) : null,
      bbPct: pa > 0 ? round1((n(row.bb) / pa) * 100) : null,
      recentForm: batterRecentForm(games),
      lastGameDate: lastGameDate(games),
    };
  }
  const ip = n(row.inn2) / 3;
  const ballsInPlay = n(row.bf) - n(row.kk) - n(row.bb) - n(row.hp) - n(row.hr);
  return {
    playerType,
    season,
    games: n(row.gamenum),
    era: n(row.era),
    whip: n(row.whip),
    w: n(row.w),
    l: n(row.l),
    sv: n(row.sv),
    hold: n(row.hold),
    war: numOrNull(row.war),
    kPct: posOrNull(row.kp),
    bbPct: posOrNull(row.bbp),
    babip:
      ballsInPlay > 0 && row.hit != null
        ? round3((n(row.hit) - n(row.hr)) / ballsInPlay)
        : null,
    fipRaw: ip > 0 ? (13 * n(row.hr) + 3 * (n(row.bb) + n(row.hp)) - 2 * n(row.kk)) / ip : null,
    ip,
    recentForm: pitcherRecentForm(games),
    lastGameDate: lastGameDate(games),
  };
}

// ────────────────────────────────────────────────────────────────────────────
// 최근 폼 요약 (근황 한 줄)
// ────────────────────────────────────────────────────────────────────────────

function batterRecentForm(games: NaverGameRow[]): string | null {
  if (games.length === 0) return null;
  const ab = games.reduce((s, g) => s + n(g.ab), 0);
  const hit = games.reduce((s, g) => s + n(g.hit), 0);
  const hr = games.reduce((s, g) => s + n(g.hr), 0);
  const rbi = games.reduce((s, g) => s + n(g.rbi), 0);
  if (ab === 0) return `최근 ${games.length}G 타수 없음`;
  const avg = (hit / ab).toFixed(3).replace(/^0/, '');
  const extra = [hr > 0 ? `${hr}HR` : '', rbi > 0 ? `${rbi}타점` : ''].filter(Boolean).join(' ');
  return `최근 ${games.length}G ${avg} (${hit}/${ab})${extra ? ` ${extra}` : ''}`;
}

function pitcherRecentForm(games: NaverGameRow[]): string | null {
  const last = games[0];
  if (!last) return null;
  const date = fmtGday(last.gday);
  const parts = [
    last.opponent ? `${last.opponent}전` : '',
    last.inn ? `${last.inn}이닝` : '',
    `${n(last.er)}자책`,
    n(last.kk) > 0 ? `${n(last.kk)}K` : '',
    last.wls ? `(${last.wls})` : '',
  ].filter(Boolean);
  return `${date} ${parts.join(' ')}`.trim();
}

function lastGameDate(games: NaverGameRow[]): string | null {
  return games[0] ? fmtGday(games[0].gday) : null;
}

function fmtGday(gday?: string): string {
  if (!gday || gday.length !== 8) return '';
  return `${gday.slice(4, 6)}.${gday.slice(6, 8)}`;
}

/** 여러 선수 순차 조회 (rate-limit 배려 딜레이). */
export async function fetchNaverSaberBatch(
  playerIds: string[],
  season: number,
  delayMs = 300,
): Promise<Map<string, NaverSaber>> {
  const out = new Map<string, NaverSaber>();
  for (const id of playerIds) {
    const saber = await fetchNaverSaber(id, season);
    if (saber) out.set(id, saber);
    await sleep(delayMs);
  }
  return out;
}

// ────────────────────────────────────────────────────────────────────────────
function parseMaybeJson(v: unknown): unknown {
  if (typeof v !== 'string') return v;
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
}

function n(v: unknown): number {
  const x = typeof v === 'string' ? Number(v) : (v as number);
  return Number.isFinite(x) ? x : 0;
}

function num(v: unknown): number | null {
  const x = typeof v === 'string' ? Number(v) : (v as number);
  return Number.isFinite(x) ? x : null;
}

function numOrNull(v: unknown): number | null {
  return num(v);
}

/** 네이버는 미산출 값을 0.0으로 채우는 경우가 있어 0은 null 취급 (wRC+ 0은 비현실). */
function posOrNull(v: unknown): number | null {
  const x = num(v);
  return x !== null && x > 0 ? x : null;
}

function round1(x: number): number {
  return Math.round(x * 10) / 10;
}
function round3(x: number): number {
  return Math.round(x * 1000) / 1000;
}
function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
