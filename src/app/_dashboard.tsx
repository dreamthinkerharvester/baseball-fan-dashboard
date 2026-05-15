// Page composition helpers — keep page.tsx terse.
// Design Ref: §5.1 layout sections + 사용자 피드백 (KiaRecent10 + MetroAlert).

'use client';

import { ScheduleList } from '@/features/game-schedule/ScheduleList';
import { LineupSection } from '@/features/lineup-card/LineupSection';
import { KiaRecent10 } from '@/features/recent-games/KiaRecent10';
import { MetroGameAlert } from '@/features/recent-games/MetroGameAlert';
import { TeamMatchupPanel } from '@/features/team-header/TeamMatchupPanel';

import type { TeamCode } from '@/types';

export function GameSchedule({ myTeam }: { myTeam: TeamCode | null }) {
  return <ScheduleList myTeam={myTeam} defaultRange="day" />;
}

export function MatchupHeader({ myTeam }: { myTeam: TeamCode | null }) {
  if (!myTeam) return null;
  return <TeamMatchupPanel team={myTeam} />;
}

export function MetroAlertSection({ myTeam }: { myTeam: TeamCode | null }) {
  return <MetroGameAlert myTeam={myTeam} />;
}

export function RecentTenSection({ myTeam }: { myTeam: TeamCode | null }) {
  if (myTeam !== 'KIA') return null;
  return <KiaRecent10 />;
}

export function LineupSectionMaybe({ myTeam }: { myTeam: TeamCode | null }) {
  if (!myTeam) {
    return (
      <section className="px-4 py-6 text-center text-body text-text-muted">
        마이팀을 설정하면 라인업 카드가 표시됩니다.
        <span className="ml-1 text-text-dim">(헤더 ⚙ 클릭)</span>
      </section>
    );
  }
  return <LineupSection team={myTeam} />;
}

export function TeamSelectionEntry() {
  return null;
}
