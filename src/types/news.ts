// Player news cache shape — populated by scripts/crawler/naver-fetch-news.mjs,
// read by the editorial player detail page (/players/[id]).
// Reuses the storybook NewsClip item shape for consistency.

import type { NewsClip } from './storybook';

export interface PlayerNewsCache {
  playerId: string;
  playerName: string;
  items: NewsClip[];
  /** ISO timestamp written by the crawler. */
  fetchedAt: string;
}
