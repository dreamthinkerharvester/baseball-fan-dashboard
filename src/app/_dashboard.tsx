// Page composition helpers — keep page.tsx terse.
// Design Ref: §5.1 layout sections.

'use client';

import { ScheduleList } from '@/features/game-schedule/ScheduleList';
import { LineupSection } from '@/features/lineup-card/LineupSection';

import type { TeamCode } from '@/types';

export function GameSchedule({ myTeam }: { myTeam: TeamCode | null }) {
  return <ScheduleList myTeam={myTeam} defaultRange="day" />;
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
