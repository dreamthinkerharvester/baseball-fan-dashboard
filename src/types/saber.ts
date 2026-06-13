// Design Ref: kia-fan-service §3.1 — Myth-Buster 갭 스코어 + 세이버 용어 사전 타입.
// 갭 스코어 = 클래식 리그 순위 − 세이버 리그 순위.
//   양수(+) = 클래식 순위보다 세이버 순위가 높음 → "체감보다 실제 기여가 높은 선수"
//   음수(−) = "체감보다 실제 기여가 낮은 선수"

import type { TeamCode } from './team';

export interface SaberRankingEntry {
  playerId: string;
  name: string;
  teamCode: TeamCode;
  isPitcher: boolean;
  /** 클래식 대표 지표: 타자 = 타율, 투수 = ERA. */
  classicMetric: 'avg' | 'era';
  classicValue: number;
  /** 규정 충족자 기준 리그 순위 (1부터). */
  classicRank: number;
  /** 세이버 대표 지표: 타자 = wRC+, 투수 = FIP. */
  saberMetric: 'wrcPlus' | 'fip';
  saberValue: number;
  saberRank: number;
  /** classicRank − saberRank. */
  gapScore: number;
  /** 규정 타석/이닝 충족 여부 (현재 산출 대상은 항상 true). */
  qualified: boolean;
}

export interface SaberRankings {
  updatedAt: string; // ISO
  season: number;
  /** 리그 전체 규정 충족자 수 (순위 분모 — UI "리그 N명 중" 표기용). */
  qualifiedBatters: number;
  qualifiedPitchers: number;
  /** KIA 선수만 저장 (산출은 리그 전체 기준). */
  entries: SaberRankingEntry[];
}

/** 세이버 용어 인라인 교육 오버레이 사전 항목 (src/lib/saber-glossary.ts에서 정의). */
export interface SaberGlossaryItem {
  key: 'wrcPlus' | 'fip' | 'babip' | 'kPct' | 'bbPct' | 'war' | 'woba' | 'ops';
  label: string;
  /** 한 줄 정의 ("리그평균 100 기준, 득점 기여도"). */
  oneLiner: string;
  /** 정박 기준점 (wRC+ = 100). 동적 기준이면 null. */
  anchor: number | null;
}
