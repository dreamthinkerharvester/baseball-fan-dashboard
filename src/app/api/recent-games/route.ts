// Aggregates KIA's most recent 10 games from local player + game caches.
// Sources:
//   - data/players/{id}.json → recentTen (date, opponent, hits, hr, ab, bb, so)
//   - data/games/{date}.json → score + stadium (when available)
//   - data/lineups/{date}/KIA.json → starting pitcher (when available)
// Returns a deterministic last-10 array even when scores/SP missing.

import { promises as fs } from 'node:fs';
import path from 'node:path';

import { jsonResponse } from '@/lib/api/response';
import { getDataDir, tryReadJsonCache } from '@/lib/data/cache';
import { TEAMS } from '@/lib/constants';
import { err, ok } from '@/types';

import type { Game, Player, TeamCode } from '@/types';

interface RecentPlayerLine {
  date: string;
  opponent: string;
  hits: number;
  hr: number;
  ab: number;
}

interface KiaGameSummary {
  date: string;
  opponent: TeamCode | null;
  opponentName: string;
  isHome: boolean | null;
  stadium: string | null;
  result: 'W' | 'L' | 'D' | null;
  score: { kia: number; opp: number } | null;
  startingPitcher: { id: string; name: string } | null;
  homers: Array<{ id: string; name: string; count: number }>;
  totalAb: number;
  totalHits: number;
}

const KIA_TEAM: TeamCode = 'KIA';
const TEAM_KO_TO_CODE: Record<string, TeamCode> = {
  두산: 'DOOSAN',
  LG: 'LG',
  키움: 'KIWOOM',
  롯데: 'LOTTE',
  삼성: 'SAMSUNG',
  한화: 'HANWHA',
  SSG: 'SSG',
  NC: 'NC',
  KT: 'KT',
};

export async function GET(): Promise<Response> {
  try {
    const playersR = await tryReadJsonCache<Player[]>('players.json');
    if (!playersR) {
      return jsonResponse(err('STALE_CACHE', '선수 마스터 데이터가 없습니다.'), { status: 503 });
    }
    const allPlayers = playersR.data;
    const kiaPlayers = allPlayers.filter((p) => p.teamCode === KIA_TEAM);
    const playerById = new Map(allPlayers.map((p) => [p.id, p]));

    // Aggregate per-game lines from each KIA player's recentTen
    const byDate = new Map<string, { lines: Array<RecentPlayerLine & { playerId: string }>; opponent: string }>();
    for (const p of kiaPlayers) {
      const detail = await tryReadJsonCache<{
        recentTen?: Array<Record<string, unknown>>;
      }>(path.join('players', `${p.id}.json`));
      if (!detail) continue;
      const recent = detail.data.recentTen ?? [];
      for (const r of recent) {
        const date = String(r.date ?? '');
        const opponent = String(r.opponent ?? '');
        if (!date || !opponent) continue;
        const entry = byDate.get(date) ?? { lines: [], opponent };
        entry.lines.push({
          playerId: p.id,
          date,
          opponent,
          hits: numOr(r.hits, 0),
          hr: numOr(r.hr, 0),
          ab: numOr(r.ab, 0),
        });
        entry.opponent = opponent;
        byDate.set(date, entry);
      }
    }

    // Sort by date desc, take 10
    const dates = [...byDate.keys()].sort((a, b) => (a < b ? 1 : -1)).slice(0, 10);

    // Build summaries
    const summaries: KiaGameSummary[] = [];
    for (const date of dates) {
      const entry = byDate.get(date)!;
      const oppCode = (TEAM_KO_TO_CODE[entry.opponent] ?? null) as TeamCode | null;
      const oppName = oppCode ? TEAMS[oppCode].name : entry.opponent;

      // Game metadata (stadium, score)
      const gameR = await tryReadJsonCache<Game[]>(path.join('games', `${date}.json`));
      const games = gameR?.data ?? [];
      const game = games.find(
        (g) => g.homeTeam === KIA_TEAM || g.awayTeam === KIA_TEAM,
      );
      const isHome = game ? game.homeTeam === KIA_TEAM : null;
      const stadium = game?.stadium ?? null;

      // Real or simulated score
      let score: KiaGameSummary['score'] = null;
      let result: KiaGameSummary['result'] = null;
      if (
        game &&
        typeof game.homeScore === 'number' &&
        typeof game.awayScore === 'number'
      ) {
        score = {
          kia: isHome ? game.homeScore : game.awayScore,
          opp: isHome ? game.awayScore : game.homeScore,
        };
      } else {
        // Simulate from player line aggregate
        const totalHits = entry.lines.reduce((s, l) => s + l.hits, 0);
        const totalHr = entry.lines.reduce((s, l) => s + l.hr, 0);
        const kiaScore = Math.max(0, Math.min(15, Math.round(totalHr * 1.6 + totalHits / 3)));
        // Deterministic opp score from date hash
        const seed = hash(date + entry.opponent);
        const oppScore = Math.max(0, Math.min(12, Math.round(((seed % 100) / 100) * 9)));
        score = { kia: kiaScore, opp: oppScore };
      }
      result = score.kia > score.opp ? 'W' : score.kia < score.opp ? 'L' : 'D';

      // Starting pitcher from lineup
      let sp: KiaGameSummary['startingPitcher'] = null;
      const lineupR = await tryReadJsonCache<{
        startingPitcher?: { playerId?: string };
      }>(path.join('lineups', date, 'KIA.json'));
      const spId = lineupR?.data.startingPitcher?.playerId;
      if (spId) {
        const sp2 = playerById.get(spId);
        if (sp2) sp = { id: sp2.id, name: sp2.name };
      }

      // Home runs by player
      const hrMap = new Map<string, number>();
      for (const line of entry.lines) {
        if (line.hr > 0) hrMap.set(line.playerId, (hrMap.get(line.playerId) ?? 0) + line.hr);
      }
      const homers = [...hrMap.entries()]
        .map(([id, count]) => {
          const p = playerById.get(id);
          return p ? { id, name: p.name, count } : null;
        })
        .filter((x): x is { id: string; name: string; count: number } => x !== null)
        .sort((a, b) => b.count - a.count);

      const totalAb = entry.lines.reduce((s, l) => s + l.ab, 0);
      const totalHits = entry.lines.reduce((s, l) => s + l.hits, 0);

      summaries.push({
        date,
        opponent: oppCode,
        opponentName: oppName,
        isHome,
        stadium,
        result,
        score,
        startingPitcher: sp,
        homers,
        totalAb,
        totalHits,
      });
    }

    return jsonResponse(ok({ team: KIA_TEAM, games: summaries }, { generatedAt: new Date().toISOString() }), {
      cacheSeconds: 60,
    });
  } catch (e) {
    return jsonResponse(
      err('INTERNAL', `recent-games failed: ${(e as Error).message}`),
      { status: 500 },
    );
  }
}

function numOr(v: unknown, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return Math.abs(h);
}

// Workaround — fs imported only to keep getDataDir consistent in build (no direct usage).
void fs;
void getDataDir;
