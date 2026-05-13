// Design Ref: §9.1 — Service Layer. UI/API Route는 이 모듈만 호출.

import { loadStandings } from '@/lib/data/cache';
import { ok } from '@/types';

import type { ApiResponse, StandingsRow } from '@/types';

export interface StandingsResponse {
  rows: StandingsRow[];
}

export async function getStandings(): Promise<ApiResponse<StandingsResponse>> {
  const r = await loadStandings();
  return ok({ rows: r.data }, { updatedAt: r.fetchedAt, source: 'cache' });
}
