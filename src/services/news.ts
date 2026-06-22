// Player news — reads the JSON cache populated by the Naver news crawler.
// Layer: Service. Gracefully returns an empty cache when no crawl has run yet
// (the detail page falls back to an outbound Naver search link).

import { loadPlayerNews } from '@/lib/data/cache';

import type { PlayerNewsCache } from '@/types';

export async function getPlayerNews(
  id: string,
  playerName: string,
): Promise<PlayerNewsCache> {
  const cache = await loadPlayerNews(id);
  if (cache) return cache.data;
  return { playerId: id, playerName, items: [], fetchedAt: '' };
}

/** Outbound Naver news search URL — always available, used as fallback / "더보기". */
export function naverNewsSearchUrl(playerName: string): string {
  const q = encodeURIComponent(`${playerName} KIA`);
  return `https://search.naver.com/search.naver?where=news&query=${q}`;
}
