// Design Ref: §4.1 — Games schedule (date or range).

import { type NextRequest } from 'next/server';

import { jsonResponse } from '@/lib/api/response';
import { DateStringSchema, RangeSchema, parseQuery } from '@/lib/api/validation';
import { CACHE_TTL_SEC } from '@/lib/constants';
import { getGames } from '@/services/games';
import { err } from '@/types';

export async function GET(req: NextRequest) {
  const dateRaw = req.nextUrl.searchParams.get('date');
  const rangeRaw = req.nextUrl.searchParams.get('range');

  if (dateRaw != null) {
    const r = parseQuery(DateStringSchema, dateRaw, 'INVALID_DATE');
    if (!r.ok) return jsonResponse(r.response, { status: r.status });
  }
  if (rangeRaw != null) {
    const r = parseQuery(RangeSchema, rangeRaw, 'INTERNAL');
    if (!r.ok) return jsonResponse(r.response, { status: r.status });
  }

  try {
    const range = (rangeRaw ?? 'day') as 'day' | 'week' | 'month';
    const body = await getGames({
      ...(dateRaw ? { date: dateRaw } : {}),
      range,
    });
    const ttl = range === 'day' ? CACHE_TTL_SEC.games : CACHE_TTL_SEC.gamesRange;
    return jsonResponse(body, { cacheSeconds: ttl, swrSeconds: 60 });
  } catch {
    return jsonResponse(err('INTERNAL', '서비스에 일시적인 문제가 있습니다.'), { status: 500 });
  }
}
