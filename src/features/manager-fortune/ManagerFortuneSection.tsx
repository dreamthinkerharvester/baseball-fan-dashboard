// myTeam 기반 감독 운세 섹션. 데이터가 있는 팀만 렌더, 나머지는 null.

'use client';

import { getManager } from './data/managers';
import { ManagerFortuneCard } from './ManagerFortuneCard';

import type { TeamCode } from '@/types';

export function ManagerFortuneSection({ myTeam }: { myTeam: TeamCode | null }) {
  if (!myTeam) return null;
  const manager = getManager(myTeam);
  if (!manager) return null;
  return <ManagerFortuneCard manager={manager} />;
}
