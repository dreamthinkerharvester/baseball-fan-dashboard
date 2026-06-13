// Design Ref: kia-fan-service §5.3 — 라인업 카드용 KIA 세이버 스냅샷 API.
// 카드 1장당 개별 fetch 대신 로스터 전체를 1회로 (성능 NFR).

import { jsonResponse } from '@/lib/api/response';
import { CACHE_TTL_SEC } from '@/lib/constants';
import { getSaberCards } from '@/services/saber';
import { err, ok } from '@/types';

export async function GET() {
  try {
    const body = await getSaberCards();
    return jsonResponse(ok(body), { cacheSeconds: CACHE_TTL_SEC.player, swrSeconds: 300 });
  } catch {
    return jsonResponse(err('INTERNAL', '서비스에 일시적인 문제가 있습니다.'), { status: 500 });
  }
}
