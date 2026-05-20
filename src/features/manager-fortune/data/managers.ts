// Manager profile data — KBO 감독 생년월일 (양력).
// 현재 KIA 이범호 감독만 검증 데이터 포함. 다른 팀은 점진적으로 확장.

import type { TeamCode } from '@/types';

export interface ManagerProfile {
  /** 감독 이름 */
  name: string;
  /** 양력 생년월일 (YYYY-MM-DD) */
  birthDate: string;
}

export const MANAGERS: Partial<Record<TeamCode, ManagerProfile>> = {
  KIA: { name: '이범호', birthDate: '1981-10-28' },
};

export function getManager(team: TeamCode): ManagerProfile | null {
  return MANAGERS[team] ?? null;
}
