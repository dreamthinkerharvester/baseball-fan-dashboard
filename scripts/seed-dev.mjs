#!/usr/bin/env node
// Dev-time seed: copies tests/fixtures/* into data/ for local UI testing without crawler.
// Production cron writes to data/ directly — this script only fills gaps for empty paths.
//
// Run via:
//   pnpm seed:dev          # idempotent
//   pnpm dev:seed          # seed + dev start

import { promises as fs } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'tests/fixtures');
const DST = path.join(ROOT, 'data');

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function copyIfMissing(relSrc, relDst = relSrc) {
  const src = path.join(SRC, relSrc);
  const dst = path.join(DST, relDst);
  if (await exists(dst)) {
    console.log(`✓ keep   ${relDst}`);
    return;
  }
  if (!(await exists(src))) {
    console.log(`✗ skip   ${relSrc} (not in fixtures)`);
    return;
  }
  await fs.mkdir(path.dirname(dst), { recursive: true });
  await fs.copyFile(src, dst);
  console.log(`+ seeded ${relDst}`);
}

async function copyTreeIfMissing(relSrcDir, relDstDir = relSrcDir) {
  const src = path.join(SRC, relSrcDir);
  if (!(await exists(src))) return;
  const stack = [{ s: src, d: path.join(DST, relDstDir) }];
  while (stack.length > 0) {
    const { s, d } = stack.pop();
    const entries = await fs.readdir(s, { withFileTypes: true });
    await fs.mkdir(d, { recursive: true });
    for (const e of entries) {
      const sp = path.join(s, e.name);
      const dp = path.join(d, e.name);
      if (e.isDirectory()) {
        stack.push({ s: sp, d: dp });
      } else if (!(await exists(dp))) {
        await fs.copyFile(sp, dp);
        console.log(`+ seeded ${path.relative(DST, dp)}`);
      }
    }
  }
}

async function main() {
  console.log(`seed-dev: ${SRC} → ${DST}\n`);
  // Master files (already in data/ for prod, but seed anyway if missing)
  await copyIfMissing('teams.json');
  await copyIfMissing('players.json');
  // Time-series caches: only seed if dev environment has nothing
  await copyIfMissing('standings.json');
  await copyTreeIfMissing('games');
  await copyTreeIfMissing('lineups');
  await copyTreeIfMissing('players');
  await copyTreeIfMissing('html');
  console.log(`\n✓ seed-dev done — run \`pnpm dev\``);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
