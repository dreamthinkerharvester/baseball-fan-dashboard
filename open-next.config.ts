import { defineCloudflareConfig } from '@opennextjs/cloudflare';

// Default config: no incremental cache layer configured. Pages are either
// statically prerendered at build (e.g. /players/[id] via generateStaticParams)
// or rendered per-request. Data freshness comes from redeploys (the crawler
// commits data/ → CF rebuild regenerates /cfdata assets).
export default defineCloudflareConfig();
