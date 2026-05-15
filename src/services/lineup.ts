// Design Ref: §4 — Lineup detail with NO_GAME / pending / fallback 분기.
// fallback: 오늘 라인업 미확정 시 최근 7일 이내 가장 최신 확정 라인업 반환.

import { loadGames, loadLineup } from '@/lib/data/cache';
import { todayKstString } from '@/lib/date';
import { err, ok } from '@/types';

import type { ApiResponse, Lineup, TeamCode } from '@/types';

export interface LineupQuery {
  team: TeamCode;
  date?: string;
}

export async function getLineup(query: LineupQuery): Promise<ApiResponse<Lineup>> {
  const date = query.date ?? todayKstString();

  // Step 1: 해당 일자에 팀 경기 있는지 확인
  const games = await loadGames(date);
  if (!games) {
    return getLineupFallback(query.team, date);
  }
  const teamHasGame = games.data.some(
    (g) => g.homeTeam === query.team || g.awayTeam === query.team,
  );
  if (!teamHasGame) {
    return getLineupFallback(query.team, date);
  }

  // Step 2: 라인업 캐시 조회
  const lineup = await loadLineup(date, query.team);
  if (!lineup) {
    // 경기는 있지만 라인업 캐시 없음 → fallback 시도
    const fallback = await getLineupFallback(query.team, date);
    if (fallback.data) return fallback;

    // fallback도 없으면 pending placeholder
    const pending: Lineup = {
      gameId: '',
      teamCode: query.team,
      startingPitcher: null,
      battingOrder: [],
      status: 'pending',
      fetchedAt: new Date().toISOString(),
      source: 'cache',
    };
    return ok(pending, { source: 'cache' });
  }
  return ok(lineup.data, { updatedAt: lineup.fetchedAt, source: lineup.data.source });
}

/** 최근 7일 이내 가장 최신 확정 라인업 탐색. */
async function getLineupFallback(team: TeamCode, todayIso: string): Promise<ApiResponse<Lineup>> {
  const today = new Date(todayIso);
  for (let d = 1; d <= 7; d++) {
    const past = new Date(today);
    past.setDate(past.getDate() - d);
    const iso = past.toISOString().slice(0, 10);
    const cached = await loadLineup(iso, team);
    if (cached && cached.data.status === 'confirmed' && cached.data.battingOrder.length > 0) {
      const fallback: Lineup = {
        ...cached.data,
        status: 'fallback',
        fallbackDate: iso,
      };
      return ok(fallback, { source: 'cache' });
    }
  }
  return err('NO_GAME', '최근 라인업 데이터가 없습니다.');
}
