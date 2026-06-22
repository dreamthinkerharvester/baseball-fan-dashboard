// Generates the static-asset data layer for the Cloudflare (OpenNext) build.
// Workers has no runtime filesystem, so we ship data/*.json as static assets
// under public/cfdata/ and read them via the ASSETS binding at runtime
// (see src/lib/data/cache.ts). Also emits:
//   - public/cfdata/_manifest.json  → { files: {rel: isoMtime}, dirs: {sub: [names]} }
//   - src/lib/data/_generated/crayon-manifest.json → [ "assets/players-crayon/..png" ]
//
// Run in prebuild. Safe to run anywhere (no network, no API keys).

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = path.join(ROOT, 'data');
const OUT_DIR = path.join(ROOT, 'public', 'cfdata');
const CRAYON_DIR = path.join(ROOT, 'public', 'assets', 'players-crayon');
const GEN_DIR = path.join(ROOT, 'src', 'lib', 'data', '_generated');

// data subtrees that are NOT app-read JSON (raw html scrapes, gitignored caches)
const SKIP_DIRS = new Set(['html', 'storybook']);

/** Recursively list files under dir, returning paths relative to `base`. */
async function walk(dir, base, acc = []) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const e of entries) {
    const abs = path.join(dir, e.name);
    const rel = path.relative(base, abs).split(path.sep).join('/');
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue;
      await walk(abs, base, acc);
    } else {
      acc.push(rel);
    }
  }
  return acc;
}

async function main() {
  // ── 1. Copy data/*.json → public/cfdata, build manifest ──────────────────
  await fs.rm(OUT_DIR, { recursive: true, force: true });
  await fs.mkdir(OUT_DIR, { recursive: true });

  const rels = (await walk(DATA_DIR, DATA_DIR)).filter((r) => r.endsWith('.json'));
  const files = {};
  const dirs = {};

  for (const rel of rels) {
    const src = path.join(DATA_DIR, rel);
    const dest = path.join(OUT_DIR, rel);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.copyFile(src, dest);

    // Data freshness signal. fs mtime = last crawl write locally, or checkout
    // time on a fresh CF build (~deploy time) — both meaningful for the UI.
    let iso;
    try {
      iso = (await fs.stat(src)).mtime.toISOString();
    } catch {
      iso = new Date().toISOString();
    }
    files[rel] = iso;

    const sub = rel.includes('/') ? rel.slice(0, rel.lastIndexOf('/')) : '.';
    (dirs[sub] ??= []).push(rel.slice(rel.lastIndexOf('/') + 1));
  }

  await fs.writeFile(
    path.join(OUT_DIR, '_manifest.json'),
    JSON.stringify({ files, dirs }, null, 0) + '\n',
    'utf8',
  );

  // ── 2. Crayon asset manifest (committed, tiny — replaces existsSync) ──────
  await fs.mkdir(GEN_DIR, { recursive: true });
  const crayon = (await walk(CRAYON_DIR, path.join(ROOT, 'public')))
    .filter((r) => r.endsWith('.png'))
    .sort();
  await fs.writeFile(
    path.join(GEN_DIR, 'crayon-manifest.json'),
    JSON.stringify(crayon, null, 0) + '\n',
    'utf8',
  );

  console.log(
    `[gen-cf-data] ${rels.length} data files → public/cfdata, ${crayon.length} crayon assets → manifest`,
  );
}

main().catch((e) => {
  console.error('[gen-cf-data] failed:', e);
  process.exit(1);
});
