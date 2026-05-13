// Design Ref: §3, §9 — Single source of truth for static lookups.

import type { Team, TeamCode, Grade } from '@/types';

/** KBO 10팀 마스터. 팀 컬러는 공식 가이드 기반. */
export const TEAMS: Record<TeamCode, Team> = {
  LG: { code: 'LG', name: 'LG 트윈스', shortName: 'LG', primaryColor: '#C30452' },
  KT: { code: 'KT', name: 'KT 위즈', shortName: 'KT', primaryColor: '#000000' },
  SSG: { code: 'SSG', name: 'SSG 랜더스', shortName: 'SSG', primaryColor: '#CE0E2D' },
  NC: { code: 'NC', name: 'NC 다이노스', shortName: 'NC', primaryColor: '#315288' },
  KIA: { code: 'KIA', name: 'KIA 타이거즈', shortName: 'KIA', primaryColor: '#EA0029' },
  DOOSAN: { code: 'DOOSAN', name: '두산 베어스', shortName: '두산', primaryColor: '#131230' },
  LOTTE: { code: 'LOTTE', name: '롯데 자이언츠', shortName: '롯데', primaryColor: '#041E42' },
  SAMSUNG: { code: 'SAMSUNG', name: '삼성 라이온즈', shortName: '삼성', primaryColor: '#074CA1' },
  HANWHA: { code: 'HANWHA', name: '한화 이글스', shortName: '한화', primaryColor: '#FF6600' },
  KIWOOM: { code: 'KIWOOM', name: '키움 히어로즈', shortName: '키움', primaryColor: '#570514' },
};

export const TEAM_CODES: readonly TeamCode[] = Object.freeze([
  'LG',
  'KT',
  'SSG',
  'NC',
  'KIA',
  'DOOSAN',
  'LOTTE',
  'SAMSUNG',
  'HANWHA',
  'KIWOOM',
]);

/** Type guard. localStorage 검증 등에 사용. */
export function isTeamCode(value: unknown): value is TeamCode {
  return typeof value === 'string' && TEAM_CODES.includes(value as TeamCode);
}

/**
 * Design §9 — Grade percentile thresholds.
 * percentile >= threshold → that grade.
 * 평가는 elite → rare → special → normal 순서.
 */
export const GRADE_PERCENTILES: Record<Exclude<Grade, 'normal'>, number> = {
  elite: 90,
  rare: 70,
  special: 40,
};

/** Grade → CSS 변수명 매핑. globals.css의 --grade-* 변수와 정합. */
export const GRADE_COLORS: Record<Grade, string> = {
  elite: 'var(--grade-elite)',
  rare: 'var(--grade-rare)',
  special: 'var(--grade-special)',
  normal: 'var(--grade-normal)',
};

/** Grade → 표시 라벨 (UI 배지). */
export const GRADE_LABELS: Record<Grade, string> = {
  elite: 'ELITE',
  rare: 'RARE',
  special: 'SPECIAL',
  normal: 'NORMAL',
};

/** Edge Cache TTL (초 단위). Design §4.1과 정합. */
export const CACHE_TTL_SEC = {
  health: 0,
  teams: 86_400, // 24h
  standings: 600, // 10min
  games: 600, // 10min
  gamesRange: 3_600, // 1h (week/month)
  lineup: 300, // 5min
  player: 3_600, // 1h
} as const;

/** localStorage key. */
export const STORAGE_KEYS = {
  myTeam: 'baseball_myteam',
} as const;

/** Crawler defaults. .env로 override. */
export const CRAWL_DEFAULTS = {
  retryMax: 3,
  retryDelayMs: 4_000,
  userAgent: 'baseball-fan-dashboard/0.1',
} as const;

/** 등급 산출 시 최근 N경기 기준. */
export const GRADE_RECENT_GAMES = 10;

/** 등급 산출에 필요한 최소 경기 수. 미만이면 누적 시즌 스탯으로 fallback. */
export const GRADE_MIN_GAMES_FOR_RECENT = 5;
