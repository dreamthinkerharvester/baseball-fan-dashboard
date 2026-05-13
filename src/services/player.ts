// Design Ref: §4 — Player detail.

import { loadPlayerDetail, type PlayerDetailCache } from '@/lib/data/cache';
import { err, ok } from '@/types';

import type { ApiResponse } from '@/types';

export async function getPlayerDetail(id: string): Promise<ApiResponse<PlayerDetailCache>> {
  const cache = await loadPlayerDetail(id);
  if (!cache) return err('PLAYER_NOT_FOUND', '선수 정보를 찾을 수 없습니다.');
  return ok(cache.data, { updatedAt: cache.fetchedAt, source: 'cache' });
}
