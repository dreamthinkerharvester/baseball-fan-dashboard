// Design Ref: §4 — Player detail.

import { loadPlayerDetail, tryReadJsonCache, type PlayerDetailCache } from '@/lib/data/cache';
import { MY_TEAM } from '@/lib/constants';
import { err, ok } from '@/types';

import type { ApiResponse, Player } from '@/types';

export async function getPlayerDetail(id: string): Promise<ApiResponse<PlayerDetailCache>> {
  const cache = await loadPlayerDetail(id);
  if (!cache) return err('PLAYER_NOT_FOUND', '선수 정보를 찾을 수 없습니다.');
  return ok(cache.data, { updatedAt: cache.fetchedAt, source: 'cache' });
}

/** KIA 로스터 (마스터 데이터). 상세페이지 정적 생성/네비게이션 소스. */
export async function getKiaRoster(): Promise<Player[]> {
  const r = await tryReadJsonCache<Player[]>('players.json');
  if (!r) return [];
  return r.data.filter((p) => p.teamCode === MY_TEAM);
}
