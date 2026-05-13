// kia-roster.ts — KIA 타이거즈 선수 명단 1회성 수집 스크립트.
// 현재는 manually curated data/players.json 의 KIA 엔트리에 의존하는 placeholder.
// Phase 2: KBO 공식 페이지(https://www.koreabaseball.com/Player/Search.aspx)에서 실 ID + 정확한 등번호 sync.
//
// Usage: pnpm crawl:kia-roster

import { promises as fs } from 'node:fs';
import path from 'node:path';

interface PlayerSeed {
  id: string;
  name: string;
  teamCode: string;
  position: string;
  uniformNumber?: number;
  isPitcher: boolean;
}

const PLAYERS_JSON = path.join(process.cwd(), 'data', 'players.json');

async function main(): Promise<void> {
  const raw = await fs.readFile(PLAYERS_JSON, 'utf8');
  const players = JSON.parse(raw) as PlayerSeed[];
  const kia = players.filter((p) => p.teamCode === 'KIA');

  console.log(`[kia-roster] KIA 선수 ${kia.length}명 확인:`);
  for (const p of kia) {
    console.log(`  - ${p.name} (${p.position}, #${p.uniformNumber ?? '?'}, id=${p.id})`);
  }

  if (kia.length < 10) {
    console.warn(`[kia-roster] WARNING: KIA 선수가 ${kia.length}명입니다. 최소 25명 이상 필요. data/players.json 수동 보완 필요.`);
    process.exitCode = 1;
    return;
  }

  console.log(`[kia-roster] OK — Phase 1 사용 가능`);
}

main().catch((err) => {
  console.error('[kia-roster] FAILED', err);
  process.exitCode = 1;
});
