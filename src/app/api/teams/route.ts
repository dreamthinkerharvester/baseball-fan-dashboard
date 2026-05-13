// Design Ref: §4.1 — 10팀 마스터.

import { jsonResponse } from '@/lib/api/response';
import { TEAMS } from '@/lib/constants';
import { ok } from '@/types';

import type { Team, TeamCode } from '@/types';

export async function GET() {
  const list: Team[] = (Object.keys(TEAMS) as TeamCode[]).map((c) => TEAMS[c]);
  return jsonResponse(ok(list), { cacheSeconds: 86_400 });
}
