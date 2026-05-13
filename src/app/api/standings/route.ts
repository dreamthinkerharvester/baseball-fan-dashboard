// Design Ref: §4.1 — Standings (Edge Cache 10min + SWR 60s).

import { jsonResponse } from '@/lib/api/response';
import { CACHE_TTL_SEC } from '@/lib/constants';
import { getStandings } from '@/services/standings';
import { err } from '@/types';

export async function GET() {
  try {
    const body = await getStandings();
    return jsonResponse(body, { cacheSeconds: CACHE_TTL_SEC.standings, swrSeconds: 60 });
  } catch (e: unknown) {
    if (isENOENT(e)) {
      return jsonResponse(
        err('STALE_CACHE', '데이터 갱신이 지연되고 있습니다.', { reason: 'no cache file' }),
        { status: 503 },
      );
    }
    return jsonResponse(err('INTERNAL', '서비스에 일시적인 문제가 있습니다.'), { status: 500 });
  }
}

function isENOENT(e: unknown): boolean {
  return typeof e === 'object' && e !== null && 'code' in e && (e as { code?: unknown }).code === 'ENOENT';
}
