// Design Ref: kia-fan-service §4.2 — Myth-Buster 갭 스코어 API.
// 데이터 미생성 시 503 DATA_NOT_READY → UI "집계 중" (부드러운 저하).

import { jsonResponse } from '@/lib/api/response';
import { CACHE_TTL_SEC } from '@/lib/constants';
import { getSaberRankings } from '@/services/saber';
import { err, ok } from '@/types';

export async function GET() {
  try {
    const { rankings } = await getSaberRankings();
    if (!rankings) {
      return jsonResponse(err('STALE_CACHE', '집계 중입니다.', { reason: 'no saber_rankings' }), {
        status: 503,
      });
    }
    return jsonResponse(ok(rankings), { cacheSeconds: CACHE_TTL_SEC.player, swrSeconds: 300 });
  } catch {
    return jsonResponse(err('INTERNAL', '서비스에 일시적인 문제가 있습니다.'), { status: 500 });
  }
}
