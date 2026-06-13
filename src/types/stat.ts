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
  /** 네이버 스포츠 API 출처 (구 스탯티즈). 데이터 없으면 null. */
  wrcPlus: number | null;
  // Design Ref: kia-fan-service §3.1 — 세이버 확장 필드. 미수집 = null → UI "집계 중".
  woba: number | null;
  war: number | null;
  babip: number | null;
  /** K% = 삼진 / 타석 (0~100). */
  kPct: number | null;
  /** BB% = 볼넷 / 타석 (0~100). */
  bbPct: number | null;
  updatedAt: string; // ISO
}

export interface PitcherSeasonStat {
  playerId: string;
  season: number;
  games: number;
  ip: number;
  era: number;
  /** FIP = (13·HR + 3·(BB+HBP) − 2·K)/IP + 리그상수. 자체 산출. 미산출 = null. */
  fip: number | null;
  whip: number;
  k9: number;
  bb9: number;
  // Design Ref: kia-fan-service §3.1 — 세이버 확장 필드.
  war: number | null;
  babip: number | null;
  kPct: number | null;
  bbPct: number | null;
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
