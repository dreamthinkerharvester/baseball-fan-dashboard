// KIA roster — autocomplete source for /storybook search box.

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
  const kia = r.data
    .filter((p) => p.teamCode === 'KIA')
    .map((p) => ({
      id: p.id,
      name: p.name,
      position: p.position,
      isPitcher: p.isPitcher,
      uniformNumber: p.uniformNumber,
    }));
  return jsonResponse(ok({ players: kia }, { updatedAt: r.fetchedAt }), {
    cacheSeconds: CACHE_TTL_SEC.teams,
  });
}
