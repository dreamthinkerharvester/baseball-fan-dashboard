// Design Ref: kia-fan-service §9.1 — 세이버 데이터 Application 레이어.
// saber_rankings.json (Myth-Buster) + KIA 로스터 카드용 세이버 스냅샷 로더.

import {
  cachePaths,
  loadPlayerDetail,
  readJsonCache,
  tryReadJsonCache,
} from '@/lib/data/cache';

import type { Player, SaberRankings } from '@/types';

export interface SaberRankingsResult {
  rankings: SaberRankings | null;
}

export async function getSaberRankings(): Promise<SaberRankingsResult> {
  const r = await tryReadJsonCache<SaberRankings>('saber_rankings.json');
  return { rankings: r?.data ?? null };
}

/** 카드·로스터 테이블 표시용 선수별 세이버+클래식 스냅샷 (KIA 로스터 전체). */
export interface SaberCardEntry {
  playerId: string;
  name: string;
  position: string;
  uniformNumber: number | null;
  isPitcher: boolean;
  /** 출전 경기수 — 로스터 테이블 "출전순" 정렬 기준 (FR-신규). */
  games: number;
  // 타자
  wrcPlus: number | null;
  woba: number | null;
  avg: number | null;
  ops: number | null;
  hr: number | null;
  rbi: number | null;
  // 투수
  fip: number | null;
  era: number | null;
  whip: number | null;
  wl: string | null;
  svHold: string | null;
  // 공통
  war: number | null;
  babip: number | null;
  kPct: number | null;
  bbPct: number | null;
  /** 최근 폼 한 줄 ("최근 5G .357 1HR" / "06.06 삼성전 5이닝 0자책"). */
  recentForm: string | null;
  lastGameDate: string | null;
}

export interface SaberCardsResult {
  entries: SaberCardEntry[];
}

export async function getSaberCards(): Promise<SaberCardsResult> {
  const players = (await readJsonCache<Player[]>(cachePaths.players)).data;
  const kia = players.filter((p) => p.teamCode === 'KIA');
  const entries: SaberCardEntry[] = [];
  for (const p of kia) {
    const detail = await loadPlayerDetail(p.id);
    if (!detail) continue;
    const cur = (detail.data.currentSeason ?? {}) as Record<string, unknown>;
    const w = intOr0(cur.w);
    const l = intOr0(cur.l);
    const sv = intOr0(cur.sv);
    const hold = intOr0(cur.hold);
    entries.push({
      playerId: p.id,
      name: p.name,
      position: p.position,
      uniformNumber: p.uniformNumber ?? null,
      isPitcher: p.isPitcher,
      games: intOr0(cur.games),
      wrcPlus: numOrNull(cur.wrcPlus),
      woba: numOrNull(cur.woba),
      avg: numOrNull(cur.avg),
      ops: numOrNull(cur.ops),
      hr: typeof cur.hr === 'number' ? cur.hr : null,
      rbi: typeof cur.rbi === 'number' ? cur.rbi : null,
      fip: numOrNull(cur.fip),
      era: numOrNull(cur.era),
      whip: numOrNull(cur.whip),
      wl: p.isPitcher ? `${w}-${l}` : null,
      svHold: p.isPitcher ? (sv > 0 ? `${sv}S` : hold > 0 ? `${hold}H` : '-') : null,
      war: numOrNull(cur.war),
      babip: numOrNull(cur.babip),
      kPct: numOrNull(cur.kPct),
      bbPct: numOrNull(cur.bbPct),
      recentForm: typeof cur.recentForm === 'string' ? cur.recentForm : null,
      lastGameDate: typeof cur.lastGameDate === 'string' ? cur.lastGameDate : null,
    });
  }
  return { entries };
}

function numOrNull(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) && v !== 0 ? v : null;
}

function intOr0(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : 0;
}
