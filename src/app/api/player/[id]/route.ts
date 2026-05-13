// Design Ref: §4.1 — Player detail.

import { type NextRequest } from 'next/server';

import { jsonResponse } from '@/lib/api/response';
import { PlayerIdSchema, parseQuery } from '@/lib/api/validation';
import { CACHE_TTL_SEC } from '@/lib/constants';
import { getPlayerDetail } from '@/services/player';
import { err } from '@/types';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const idRes = parseQuery(PlayerIdSchema, params.id, 'INTERNAL');
  if (!idRes.ok) return jsonResponse(idRes.response, { status: idRes.status });

  try {
    const body = await getPlayerDetail(idRes.data as string);
    if (body.error?.code === 'PLAYER_NOT_FOUND') {
      return jsonResponse(body, { status: 404 });
    }
    return jsonResponse(body, { cacheSeconds: CACHE_TTL_SEC.player, swrSeconds: 300 });
  } catch {
    return jsonResponse(err('INTERNAL', '서비스에 일시적인 문제가 있습니다.'), { status: 500 });
  }
}
