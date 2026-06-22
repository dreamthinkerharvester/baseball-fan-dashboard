// Aggregates KIA's most recent 10 games from local game + player caches.
// On Cloudflare Workers the live aggregation would exceed the subrequest limit,
// so we serve a build-time snapshot (public/cfdata/_recent-games.json). In Node
// (dev/build) we compute live so local edits are reflected immediately.

import { jsonResponse } from '@/lib/api/response';
import { tryReadJsonCache } from '@/lib/data/cache';
import { computeRecentGames, type KiaRecentGames } from '@/services/recent-games';
import { ok, err } from '@/types';

const IS_WORKERS =
  typeof navigator !== 'undefined' &&
  (navigator as { userAgent?: string }).userAgent === 'Cloudflare-Workers';

export async function GET(): Promise<Response> {
  try {
    let payload: KiaRecentGames;
    if (IS_WORKERS) {
      const snapshot = await tryReadJsonCache<KiaRecentGames>('_recent-games.json');
      payload = snapshot?.data ?? (await computeRecentGames());
    } else {
      payload = await computeRecentGames();
    }
    return jsonResponse(
      ok(payload, { generatedAt: new Date().toISOString() }),
      { cacheSeconds: 120 },
    );
  } catch (e) {
    return jsonResponse(
      err('INTERNAL', `recent-games failed: ${(e as Error).message}`),
      { status: 500 },
    );
  }
}
