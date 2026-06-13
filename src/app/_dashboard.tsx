// Page composition helpers — keep page.tsx terse.
// Design Ref: kia-fan-service §5.1 — KIA 고정 피벗. myTeam prop 제거, MY_TEAM 상수 사용.

'use client';

import { ScheduleList } from '@/features/game-schedule/ScheduleList';
import { LineupSection } from '@/features/lineup-card/LineupSection';
import { ManagerFortuneSection as ManagerFortune } from '@/features/manager-fortune/ManagerFortuneSection';
import { MythBusterPanel } from '@/features/myth-buster/MythBusterPanel';
import { KiaRecent10 } from '@/features/recent-games/KiaRecent10';
import { MetroGameAlert } from '@/features/recent-games/MetroGameAlert';
import { RosterTables } from '@/features/roster-table/RosterTable';
import { TeamMatchupPanel } from '@/features/team-header/TeamMatchupPanel';
import { MY_TEAM } from '@/lib/constants';

export function GameSchedule() {
  return <ScheduleList myTeam={MY_TEAM} defaultRange="week" />;
}

export function MatchupHeader() {
  return <TeamMatchupPanel team={MY_TEAM} />;
}

export function MetroAlertSection() {
  return <MetroGameAlert myTeam={MY_TEAM} />;
}

export function RecentTenSection() {
  // 피벗: myTeam 조건 제거 — KIA 전용 서비스에서 상시 렌더 (FR-07)
  return <KiaRecent10 />;
}

export function MythBusterSection() {
  // Design Ref: kia-fan-service §5.1 — 최근 경기와 라인업 사이 배치 (FR-06)
  return <MythBusterPanel />;
}

export function RosterTablesSection() {
  // 2026-06-12 레이아웃 재편 — 출전순 전체 로스터 표 (타자/투수)가 대시보드 주인공
  return <RosterTables />;
}

export function LineupSectionMaybe() {
  return <LineupSection team={MY_TEAM} />;
}

export function ManagerFortuneSection() {
  return <ManagerFortune myTeam={MY_TEAM} />;
}
