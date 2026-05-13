// Design Ref: §3.1, §11 — Raw scraped record → typed Domain object.
// 외부 source (KBO HTML / statiz HTML)의 비정형 데이터를 type-safe Domain으로 정규화.
// 정규화 단계는 source HTML이 바뀔 때 *유일하게* 손봐야 하는 지점이므로 selector logic과 분리.

import { z } from 'zod';

import { TEAMS } from '@/lib/constants';
import { isValidDateString } from '@/lib/date';

import type {
  Game,
  GameStatus,
  StandingsRow,
  TeamCode,
} from '@/types';

// ────────────────────────────────────────────────────────────────────────────
// Team name → code 역색인 (KBO 사이트는 보통 팀 풀네임/약칭으로 표기)
// ────────────────────────────────────────────────────────────────────────────
const NAME_TO_CODE: Record<string, TeamCode> = (() => {
  const map: Record<string, TeamCode> = {};
  for (const team of Object.values(TEAMS)) {
    map[team.name] = team.code;
    map[team.shortName] = team.code;
    map[team.code] = team.code;
  }
  return map;
})();

export function teamNameToCode(name: string): TeamCode | null {
  const normalized = name.trim();
  return NAME_TO_CODE[normalized] ?? null;
}

// ────────────────────────────────────────────────────────────────────────────
// Game status normalization
// ────────────────────────────────────────────────────────────────────────────
const STATUS_MAP: Record<string, GameStatus> = {
  '예정': 'scheduled',
  '경기전': 'scheduled',
  '진행': 'in_progress',
  '경기중': 'in_progress',
  '종료': 'final',
  '경기종료': 'final',
  '취소': 'cancelled',
  '우천취소': 'cancelled',
  '연기': 'postponed',
  '서스펜디드': 'postponed',
};

export function normalizeGameStatus(raw: string): GameStatus {
  const trimmed = raw.replace(/\s+/g, '');
  return STATUS_MAP[trimmed] ?? 'scheduled';
}

// ────────────────────────────────────────────────────────────────────────────
// Raw input schemas (HTML scraping에서 추출한 string 위주의 1차 객체)
// ────────────────────────────────────────────────────────────────────────────

export const RawGameSchema = z.object({
  date: z.string(),
  startTime: z.string(),
  homeTeamName: z.string(),
  awayTeamName: z.string(),
  stadium: z.string().min(1),
  statusText: z.string(),
  homeScoreText: z.string().optional(),
  awayScoreText: z.string().optional(),
  doubleHeader: z.union([z.literal(1), z.literal(2)]).optional(),
  cancelReason: z.string().optional(),
});
export type RawGame = z.infer<typeof RawGameSchema>;

export interface NormalizeError {
  source: string;
  reason: string;
  raw: unknown;
}

/** RawGame → Game. 검증 실패 시 NormalizeError 던짐. */
export function normalizeGame(raw: unknown): Game {
  const parsed = RawGameSchema.parse(raw);
  if (!isValidDateString(parsed.date)) {
    throw err('normalizer', `invalid date: ${parsed.date}`, raw);
  }
  const home = teamNameToCode(parsed.homeTeamName);
  const away = teamNameToCode(parsed.awayTeamName);
  if (!home || !away) {
    throw err('normalizer', `unknown team(s): ${parsed.homeTeamName} / ${parsed.awayTeamName}`, raw);
  }
  const status = normalizeGameStatus(parsed.statusText);
  const homeScore = parseScore(parsed.homeScoreText);
  const awayScore = parseScore(parsed.awayScoreText);
  const id = `${parsed.date.replaceAll('-', '')}-${home}-${away}-${parsed.doubleHeader ?? 1}`;
  return {
    id,
    date: parsed.date,
    startTime: parsed.startTime,
    homeTeam: home,
    awayTeam: away,
    stadium: parsed.stadium.trim(),
    status,
    homeScore,
    awayScore,
    ...(parsed.doubleHeader ? { doubleHeader: parsed.doubleHeader } : {}),
    ...(parsed.cancelReason ? { cancelReason: parsed.cancelReason.trim() } : {}),
  };
}

export const RawStandingsRowSchema = z.object({
  rank: z.union([z.string(), z.number()]),
  teamName: z.string(),
  wins: z.union([z.string(), z.number()]),
  losses: z.union([z.string(), z.number()]),
  draws: z.union([z.string(), z.number()]).optional(),
  winPct: z.union([z.string(), z.number()]).optional(),
  gamesBehind: z.union([z.string(), z.number()]).optional(),
  streak: z.string().optional(),
});
export type RawStandingsRow = z.infer<typeof RawStandingsRowSchema>;

export function normalizeStandingsRow(raw: unknown): StandingsRow {
  const parsed = RawStandingsRowSchema.parse(raw);
  const teamCode = teamNameToCode(parsed.teamName);
  if (!teamCode) {
    throw err('normalizer', `unknown team: ${parsed.teamName}`, raw);
  }
  const wins = toInt(parsed.wins);
  const losses = toInt(parsed.losses);
  const draws = parsed.draws != null ? toInt(parsed.draws) : 0;
  const winPct =
    parsed.winPct != null
      ? toFloat(parsed.winPct)
      : safeWinPct(wins, losses);
  const gamesBehind =
    parsed.gamesBehind != null && String(parsed.gamesBehind).trim() !== '-'
      ? toFloat(parsed.gamesBehind)
      : 0;
  return {
    rank: toInt(parsed.rank),
    teamCode,
    teamName: TEAMS[teamCode].name,
    wins,
    losses,
    draws,
    winPct: round3(winPct),
    gamesBehind,
    ...(parsed.streak ? { streak: parsed.streak.trim() } : {}),
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers (pure, exported for unit testing)
// ────────────────────────────────────────────────────────────────────────────

export function parseScore(value: string | undefined): number | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (trimmed === '' || trimmed === '-') return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

export function toInt(value: string | number): number {
  if (typeof value === 'number') return Math.trunc(value);
  const stripped = value.replace(/[^\d-]/g, '');
  if (stripped === '' || stripped === '-')
    throw err('normalizer', `invalid int: ${value}`, value);
  const n = Number(stripped);
  if (!Number.isFinite(n)) throw err('normalizer', `invalid int: ${value}`, value);
  return Math.trunc(n);
}

export function toFloat(value: string | number): number {
  if (typeof value === 'number') return value;
  const stripped = value.replace(/[^\d.\-]/g, '');
  if (stripped === '' || stripped === '-' || stripped === '.')
    throw err('normalizer', `invalid float: ${value}`, value);
  const n = Number(stripped);
  if (!Number.isFinite(n)) throw err('normalizer', `invalid float: ${value}`, value);
  return n;
}

export function safeWinPct(wins: number, losses: number): number {
  const denom = wins + losses;
  return denom === 0 ? 0 : wins / denom;
}

export function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

function err(source: string, reason: string, raw: unknown): Error & NormalizeError {
  const e = Object.assign(new Error(reason), { source, reason, raw });
  return e;
}
