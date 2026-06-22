// Build-time snapshot of the KIA recent-10-games aggregation.
// Workers can't run the live fan-out (subrequest limit), so the route serves
// this snapshot. Runs in prebuild (Node, after gen-cf-data populates cfdata).

import { promises as fs } from 'node:fs';
import path from 'node:path';

import { computeRecentGames } from '@/services/recent-games';

async function main() {
  const out = path.join(process.cwd(), 'public', 'cfdata', '_recent-games.json');
  const data = await computeRecentGames();
  await fs.mkdir(path.dirname(out), { recursive: true });
  await fs.writeFile(out, JSON.stringify(data) + '\n', 'utf8');
  console.log(
    `[gen-recent-games] ${data.games.length} games → public/cfdata/_recent-games.json`,
  );
}

main().catch((e) => {
  console.error('[gen-recent-games] failed:', e);
  process.exit(1);
});
