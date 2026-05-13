// Design Ref: §4.1 — Health check + last-crawl visibility.

import { jsonResponse } from '@/lib/api/response';
import { tryReadJsonCache, type LastCrawlMeta } from '@/lib/data/cache';
import { ok } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const meta = await tryReadJsonCache<LastCrawlMeta>('_meta/last-crawl.json');
  return jsonResponse(
    ok({
      status: 'ok',
      now: new Date().toISOString(),
      lastCrawl: meta?.data ?? null,
    }),
    { cacheSeconds: 0 },
  );
}
