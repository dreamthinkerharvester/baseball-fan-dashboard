// 타이거즈 카드 대시보드 — 에셋 헬퍼 (레트로 게임 카드 풍 에셋).
// public/assets-magu/ 하위 PNG 슬롯을 컴포넌트에서 안전하게 참조.

import type { TeamCode } from '@/types';

const BASE = '/assets-magu';

export const teamEmblem = (code: TeamCode): string =>
  `${BASE}/teams/team-${code.toLowerCase()}.jpeg`;

// KIA 라인업 1~9번 선수 SD 일러스트.
// 라인업 슬롯 인덱스(0-based) 또는 명시 slug 둘 다 지원.
const PLAYER_BY_SLOT: readonly string[] = [
  'player-1-kim-doyoung.jpeg',
  'player-2-park-chanho.jpeg',
  'player-3-choi-hyungwoo.jpeg',
  'player-4-choi-jeong.jpeg',
  'player-5-byun-woohyuk.jpeg',
  'player-6-socrates.jpeg',
  'player-7-na-sungbum.jpeg',
  'player-8-han-seungtaek.jpeg',
  'player-9-yoon-dohyun.jpeg',
] as const;

export const playerByLineupSlot = (slotIndex: number): string | null => {
  if (slotIndex < 0 || slotIndex >= PLAYER_BY_SLOT.length) return null;
  return `${BASE}/players/${PLAYER_BY_SLOT[slotIndex]}`;
};

// 등번호 → 선수 SD 매핑 (라인업 외 컴포넌트에서 사용).
// 실제 KIA 등번호와 다를 수 있음 (시안 매핑 우선).
const PLAYER_BY_JERSEY: Record<number, string> = {
  // TODO: 실제 데이터 입수 시 매핑 보정
};
export const playerByJersey = (jersey: number): string | null => {
  const file = PLAYER_BY_JERSEY[jersey];
  return file ? `${BASE}/players/${file}` : null;
};

export const medal = (rank: 1 | 2 | 3): string =>
  `${BASE}/medals/medal-${rank}.jpeg`;

export type IconName =
  | 'baseball' | 'bat' | 'calendar' | 'fire'
  | 'glove' | 'star' | 'subway' | 'trophy';
export const icon = (name: IconName): string =>
  `${BASE}/icons/icon-${name}.jpeg`;

export const badge = (type: 'home' | 'away'): string =>
  `${BASE}/badges/badge-${type}.jpeg`;

export type TileName = 'grass' | 'sand' | 'night-sky';
export const tile = (name: TileName): string =>
  `${BASE}/tiles/tile-${name}.jpeg`;

// 등급별 카드 테두리 스타일 (LineupSection 등에서 import).
export type GradeName = 'elite' | 'gold' | 'silver' | 'bronze';
export const GRADE_BORDER: Record<GradeName, string> = {
  elite: 'var(--magu-gold)',
  gold: '#BB9020',
  silver: '#8C97B5',
  bronze: '#6B4525',
};
export const GRADE_LABEL: Record<GradeName, string> = {
  elite: '레전드',
  gold: 'A',
  silver: 'B',
  bronze: 'C',
};
