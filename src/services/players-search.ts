// Phase 1.5 — Player search service.
// Layer: Service. UI에서 직접 호출 금지 (API route 경유).

import { tryReadJsonCache } from '@/lib/data/cache';

import type {
  BatterSeasonStat,
  PitcherSeasonStat,
  Player,
  PlayerSearchResult,
  SearchFilters,
} from '@/types';

interface PlayerDetailFile {
  player: Player;
  currentSeason: BatterSeasonStat | PitcherSeasonStat | null;
}

/** 한글/영문 비교용 정규화. NFC + lowercase + trim. */
export function normalizeQuery(s: string): string {
  return s.normalize('NFC').toLowerCase().trim();
}

/** 동기 필터 (테스트 가능). */
export function filterPlayers(
  players: readonly Player[],
  filters: SearchFilters,
): Player[] {
  const q = normalizeQuery(filters.q);
  return players.filter((p) => {
    if (filters.team && p.teamCode !== filters.team) return false;
    if (filters.position && p.position !== filters.position) return false;
    if (q && !normalizeQuery(p.name).includes(q)) return false;
    return true;
  });
}

/** 시즌 스탯에서 대표 라벨 산출. 데이터 없으면 null. */
export function formatKeyStat(
  player: Player,
  season: BatterSeasonStat | PitcherSeasonStat | null,
): string | null {
  if (!season) return null;
  if (player.isPitcher) {
    const s = season as PitcherSeasonStat;
    return `ERA ${s.era.toFixed(2)}`;
  }
  const s = season as BatterSeasonStat;
  // 0.892 → .892 (KBO 관행)
  return `OPS ${s.ops.toFixed(3).replace(/^0\./, '.')}`;
}

/** keyStat 부착. 시즌 파일 없으면 keyStat=null. */
export async function attachKeyStats(
  players: readonly Player[],
): Promise<PlayerSearchResult[]> {
  const results = await Promise.all(
    players.map(async (player) => {
      const cache = await tryReadJsonCache<PlayerDetailFile>(
        `players/${player.id}.json`,
      );
      const keyStat = formatKeyStat(player, cache?.data.currentSeason ?? null);
      return { player, keyStat };
    }),
  );
  return results;
}
