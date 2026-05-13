// Phase 1.5 — Player search API.
// GET /api/players/search?q=&team=&position=
// Response: PlayerSearchResult[] with keyStat per player.

import type { NextRequest } from 'next/server';

import { jsonResponse } from '@/lib/api/response';
import { isTeamCode } from '@/lib/constants';
import { tryReadJsonCache } from '@/lib/data/cache';
import {
  attachKeyStats,
  filterPlayers,
} from '@/services/players-search';
import { err, ok } from '@/types';

import type {
  Player,
  PlayerSearchResult,
  Position,
  SearchFilters,
} from '@/types';

const ALL_POSITIONS: readonly Position[] = [
  'P',
  'C',
  '1B',
  '2B',
  '3B',
  'SS',
  'LF',
  'CF',
  'RF',
  'DH',
];

function isPosition(v: unknown): v is Position {
  return typeof v === 'string' && (ALL_POSITIONS as readonly string[]).includes(v);
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const rawTeam = sp.get('team');
  const rawPos = sp.get('position');
  const filters: SearchFilters = {
    q: sp.get('q') ?? '',
    team: rawTeam && isTeamCode(rawTeam) ? rawTeam : null,
    position: rawPos && isPosition(rawPos) ? rawPos : null,
  };

  const cache = await tryReadJsonCache<Player[]>('players.json');
  if (!cache) {
    return jsonResponse(err('STALE_CACHE', '선수 마스터 데이터가 없습니다.'), {
      status: 503,
    });
  }

  const matched = filterPlayers(cache.data, filters);
  // 결과 30개로 한도 (모바일 스크롤 부담 방지).
  const limited = matched.slice(0, 30);
  const results: PlayerSearchResult[] = await attachKeyStats(limited);

  return jsonResponse(
    ok(results, {
      updatedAt: cache.fetchedAt,
      source: 'cache',
      totalMatched: matched.length,
      returned: limited.length,
    }),
    { cacheSeconds: 60 },
  );
}
