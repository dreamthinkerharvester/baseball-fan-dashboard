#!/usr/bin/env node
// Copy 야구 image pool from docs/02-design/assets/야구 → public/assets/baseball
// Design Ref: kia-player-storybook.design.md §10.2

import { cp, mkdir, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const SRC = 'docs/02-design/assets/야구';
const DEST = 'public/assets/baseball';

async function main() {
  let files = [];
  try {
    files = await readdir(SRC);
  } catch {
    console.warn(`[copy-baseball-assets] source not found: ${SRC} — skipping`);
    return;
  }
  await mkdir(DEST, { recursive: true });
  let count = 0;
  for (const f of files) {
    if (/\.(jpe?g|png|webp|gif)$/i.test(f)) {
      await cp(join(SRC, f), join(DEST, f));
      count++;
    }
  }
  console.log(`[copy-baseball-assets] copied ${count} files → ${DEST}`);
}

main().catch((err) => {
  console.error('[copy-baseball-assets] FAILED', err);
  process.exitCode = 1;
});
