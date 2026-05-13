// Phase 1.5 — Player search types.

import type { Player, Position } from './player';
import type { TeamCode } from './team';

export interface SearchFilters {
  /** 키워드 (부분 일치, 한글 정규화 후 비교). */
  q: string;
  /** 팀 필터. null = 전체. */
  team: TeamCode | null;
  /** 포지션 필터. null = 전체. */
  position: Position | null;
}

export const EMPTY_FILTERS: SearchFilters = { q: '', team: null, position: null };

export interface PlayerSearchResult {
  player: Player;
  /** 대표 스탯 라벨. 시즌 데이터 없으면 null. */
  keyStat: string | null;
}
