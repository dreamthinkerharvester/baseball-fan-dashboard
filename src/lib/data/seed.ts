// Test seed loader — copies tests/fixtures/* into BFD_DATA_DIR for cache layer integration tests.
// Used by: vitest setup, playwright global-setup.
//
// NOT used in production runtime — production loads from /data/*.json directly via cache.ts.

import { promises as fs } from 'node:fs';
import path from 'node:path';

import { getDataDir } from './cache';

const FIXTURES_ROOT = path.join(process.cwd(), 'tests/fixtures');

/** 재귀 디렉토리 복사. node 18+의 fs.cp 사용 (recursive: true). */
export async function seedFromFixtures(targetDir: string = getDataDir()): Promise<void> {
  await fs.rm(targetDir, { recursive: true, force: true });
  await fs.mkdir(targetDir, { recursive: true });
  await fs.cp(FIXTURES_ROOT, targetDir, { recursive: true });
}

/** 단일 파일 시드 (특정 케이스 테스트용). */
export async function seedFixtureFile(
  fixtureRelativePath: string,
  targetRelativePath?: string,
): Promise<void> {
  const src = path.join(FIXTURES_ROOT, fixtureRelativePath);
  const dst = path.join(getDataDir(), targetRelativePath ?? fixtureRelativePath);
  await fs.mkdir(path.dirname(dst), { recursive: true });
  await fs.copyFile(src, dst);
}
