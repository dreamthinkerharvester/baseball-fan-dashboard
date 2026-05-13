// Design Ref: §3.1 — Stats. 타자/투수 분리 + 최근 경기.

export interface BatterSeasonStat {
  playerId: string;
  season: number;
  games: number;
  ab: number;
  hits: number;
  hr: number;
  rbi: number;
  avg: number;
  obp: number;
  slg: number;
  ops: number;
  /** 스탯티즈 출처. 데이터 없으면 null. */
  wrcPlus: number | null;
  updatedAt: string; // ISO
}

export interface PitcherSeasonStat {
  playerId: string;
  season: number;
  games: number;
  ip: number;
  era: number;
  /** 스탯티즈 출처. 데이터 없으면 null. */
  fip: number | null;
  whip: number;
  k9: number;
  bb9: number;
  updatedAt: string;
}

/**
 * 단일 경기 출전 기록. 타자/투수 필드 union.
 * Grade 산출 시 wRC+/FIP가 없으면 OPS/ERA로 fallback.
 * null = "측정값이 없음을 명시" (예: 부상 결장 후 복귀 첫 경기 wRC+),
 * undefined = "해당 필드가 적용되지 않음" (예: 타자에게 ip).
 */
export interface RecentGameStat {
  playerId: string;
  date: string; // YYYY-MM-DD
  // 타자
  ab?: number;
  hits?: number;
  hr?: number;
  rbi?: number;
  ops?: number | null;
  wrcPlus?: number | null;
  // 투수
  ip?: number;
  er?: number;
  k?: number;
  bb?: number;
  fip?: number | null;
  era?: number | null;
}
