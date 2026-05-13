// Design Ref: §4.1 — Lineup by team.

import { type NextRequest } from 'next/server';

import { jsonResponse } from '@/lib/api/response';
import { DateStringSchema, TeamCodeSchema, parseQuery } from '@/lib/api/validation';
import { CACHE_TTL_SEC } from '@/lib/constants';
import { getLineup } from '@/services/lineup';
import { err } from '@/types';

import type { TeamCode } from '@/types';

export async function GET(
  req: NextRequest,
  { params }: { params: { team: string } },
) {
  const teamRes = parseQuery(TeamCodeSchema, params.team, 'INVALID_TEAM');
  if (!teamRes.ok) return jsonResponse(teamRes.response, { status: teamRes.status });

  const dateRaw = req.nextUrl.searchParams.get('date');
  if (dateRaw != null) {
    const dateRes = parseQuery(DateStringSchema, dateRaw, 'INVALID_DATE');
    if (!dateRes.ok) return jsonResponse(dateRes.response, { status: dateRes.status });
  }

  try {
    const body = await getLineup({
      team: teamRes.data as TeamCode,
      ...(dateRaw ? { date: dateRaw } : {}),
    });
    if (body.error?.code === 'NO_GAME') {
      return jsonResponse(body, { status: 404 });
    }
    return jsonResponse(body, { cacheSeconds: CACHE_TTL_SEC.lineup, swrSeconds: 60 });
  } catch {
    return jsonResponse(err('INTERNAL', '서비스에 일시적인 문제가 있습니다.'), { status: 500 });
  }
}
