// Players master list — 라인업 슬롯 → 선수 정보 매핑용.

import { jsonResponse } from '@/lib/api/response';
import { CACHE_TTL_SEC } from '@/lib/constants';
import { tryReadJsonCache } from '@/lib/data/cache';
import { err, ok } from '@/types';

import type { Player } from '@/types';

export async function GET() {
  const r = await tryReadJsonCache<Player[]>('players.json');
  if (!r) {
    return jsonResponse(err('STALE_CACHE', '선수 마스터 데이터가 없습니다.'), { status: 503 });
  }
  return jsonResponse(ok(r.data, { updatedAt: r.fetchedAt }), {
    cacheSeconds: CACHE_TTL_SEC.teams,
  });
}
