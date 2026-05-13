// Playwright global-setup — fixtures를 BFD_DATA_DIR로 복사해 캐시 의존 라우트가 정상 응답.

import path from 'node:path';

import { seedFromFixtures } from '@/lib/data/seed';

async function globalSetup() {
  process.env.BFD_DATA_DIR = path.join(process.cwd(), '.tmp-e2e-data');
  await seedFromFixtures(process.env.BFD_DATA_DIR);
}

export default globalSetup;
