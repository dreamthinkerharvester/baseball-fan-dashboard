// KIA recent-10-games aggregation. Reads game + player + lineup caches.
// This fans out over many cache files, which is fine in Node (build/dev) but
// exceeds the Cloudflare Workers subrequest budget at runtime — so on Workers
// the route serves a build-time precomputed snapshot (public/cfdata/_recent-games.json,
// written by scripts/gen-recent-games.ts) instead of calling this live.

import path from 'node:path';

import { listDataDir, tryReadJsonCache } from '@/lib/data/cache';
import { TEAMS } from '@/lib/constants';

import type { Game, Player, TeamCode } from '@/types';

export interface KiaGameSummary {
  date: string;
  opponent: TeamCode | null;
  opponentName: string;
  isHome: boolean | null;
  stadium: string | null;
  result: 'W' | 'L' | 'D' | null;
  score: { kia: number; opp: number } | null;
  startingPitcher: { id: string; name: string } | null;
  homers: Array<{ id: string; name: string; count: number }>;
}

export interface KiaRecentGames {
  team: TeamCode;
  games: KiaGameSummary[];
}

const KIA: TeamCode = 'KIA';

export async function computeRecentGames(): Promise<KiaRecentGames> {
  // ── 1. Collect all game dates from data/games/ ────────────────────────
  const files = await listDataDir('games');
  const gameDates = files
    .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .map((f) => f.replace('.json', ''))
    .sort()
    .reverse();

  // ── 2. Find last 10 KIA final games ───────────────────────────────────
  const kiaGames: Array<{ date: string; game: Game }> = [];
  for (const d of gameDates) {
    if (kiaGames.length >= 10) break;
    const r = await tryReadJsonCache<Game[]>(path.join('games', `${d}.json`));
    if (!r) continue;
    const g = r.data.find(
      (g) => (g.homeTeam === KIA || g.awayTeam === KIA) && g.status === 'final',
    );
    // KBO 크롤러가 시작 전 경기를 final 0-0으로 파싱하는 케이스 방어 —
    // 야구에서 0-0 final은 극히 드물고, 당일 재크롤 시 실제 스코어로 덮어써짐.
    const phantomFinal = g && (g.homeScore ?? 0) === 0 && (g.awayScore ?? 0) === 0;
    if (g && !phantomFinal) kiaGames.push({ date: d, game: g });
  }

  if (kiaGames.length === 0) {
    return { team: KIA, games: [] };
  }

  // ── 3. Load KIA player master + detail for HR agg ────────────────────
  const playersR = await tryReadJsonCache<Player[]>('players.json');
  const allPlayers = playersR?.data ?? [];
  const kiaPlayers = allPlayers.filter((p) => p.teamCode === KIA);
  const playerById = new Map(allPlayers.map((p) => [p.id, p]));

  // Build date→HR map from player recentTen
  const dateHrMap = new Map<string, Map<string, number>>(); // date → playerId → count
  const dateAbMap = new Map<string, Map<string, number>>();
  for (const p of kiaPlayers) {
    const detail = await tryReadJsonCache<{
      recentTen?: Array<Record<string, unknown>>;
    }>(path.join('players', `${p.id}.json`));
    if (!detail) continue;
    for (const row of detail.data.recentTen ?? []) {
      const date = String(row.date ?? '');
      const hr = typeof row.hr === 'number' ? row.hr : 0;
      const ab = typeof row.ab === 'number' ? row.ab : 0;
      if (!date) continue;
      if (!dateHrMap.has(date)) dateHrMap.set(date, new Map());
      if (!dateAbMap.has(date)) dateAbMap.set(date, new Map());
      if (hr > 0) dateHrMap.get(date)!.set(p.id, (dateHrMap.get(date)!.get(p.id) ?? 0) + hr);
      dateAbMap.get(date)!.set(p.id, (dateAbMap.get(date)!.get(p.id) ?? 0) + ab);
    }
  }

  // ── 4. Build summaries ────────────────────────────────────────────────
  const summaries: KiaGameSummary[] = [];
  for (const { date, game } of kiaGames) {
    const isHome = game.homeTeam === KIA;
    const oppCode = (isHome ? game.awayTeam : game.homeTeam) as TeamCode;
    const opp = TEAMS[oppCode];
    const kiaScore = isHome ? (game.homeScore ?? 0) : (game.awayScore ?? 0);
    const oppScore = isHome ? (game.awayScore ?? 0) : (game.homeScore ?? 0);
    const result: 'W' | 'L' | 'D' =
      kiaScore > oppScore ? 'W' : kiaScore < oppScore ? 'L' : 'D';

    // Starting pitcher from lineup
    let sp: KiaGameSummary['startingPitcher'] = null;
    const lineupR = await tryReadJsonCache<{ startingPitcher?: { playerId?: string } }>(
      path.join('lineups', date, 'KIA.json'),
    );
    const spId = lineupR?.data.startingPitcher?.playerId;
    if (spId) {
      const spPlayer = playerById.get(spId);
      if (spPlayer) sp = { id: spPlayer.id, name: spPlayer.name };
    }

    // HR hitters for this date
    const hrDateMap = dateHrMap.get(date) ?? new Map<string, number>();
    const homers = [...hrDateMap.entries()]
      .map(([id, count]) => {
        const p = playerById.get(id);
        return p ? { id, name: p.name, count } : null;
      })
      .filter((x): x is { id: string; name: string; count: number } => x !== null)
      .sort((a, b) => b.count - a.count);

    summaries.push({
      date,
      opponent: oppCode,
      opponentName: opp?.name ?? oppCode,
      isHome,
      stadium: game.stadium ?? null,
      result,
      score: { kia: kiaScore, opp: oppScore },
      startingPitcher: sp,
      homers,
    });
  }

  return { team: KIA, games: summaries };
}
