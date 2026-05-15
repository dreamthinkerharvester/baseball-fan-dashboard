// Design Ref: §3.1 — Lineup + LineupSlot.

import type { Grade, Position } from './player';
import type { TeamCode } from './team';

export interface LineupSlot {
  /** 1~9 타순. 선발 투수는 0. */
  battingOrder: number;
  playerId: string;
  position: Position;
  grade: Grade;
  /** 0~100 백분위 (UI 툴팁) */
  gradePercentile: number;
  /** 등급 산출 근거 한국어 설명 (FAQ + 모달 툴팁용) */
  gradeBasis: string;
}

export type LineupStatus = 'confirmed' | 'pending' | 'fallback';

export interface Lineup {
  gameId: string;
  teamCode: TeamCode;
  startingPitcher: LineupSlot | null; // pending 상태면 null
  battingOrder: LineupSlot[]; // pending이면 빈 배열
  status: LineupStatus;
  fetchedAt: string; // ISO
  source: 'kbo' | 'statiz' | 'cache';
  /** fallback 상태일 때 실제 라인업 날짜 */
  fallbackDate?: string;
}
