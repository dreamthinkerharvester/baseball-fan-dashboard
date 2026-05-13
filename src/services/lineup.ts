// Design Ref: §4 — Lineup detail with NO_GAME / pending 분기.

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
    return err('NO_GAME', '해당 일자에 경기가 없습니다.');
  }
  const teamHasGame = games.data.some(
    (g) => g.homeTeam === query.team || g.awayTeam === query.team,
  );
  if (!teamHasGame) {
    return err('NO_GAME', '해당 일자에 경기가 없습니다.');
  }
  // Step 2: 라인업 캐시 조회
  const lineup = await loadLineup(date, query.team);
  if (!lineup) {
    // 경기는 있지만 라인업 캐시 없음 = pending placeholder 응답
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
