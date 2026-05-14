// Design Ref: §5.1, §11 (M14) — 단일 페이지 대시보드.
// myTeam 미설정 → TeamSelectionScreen
// myTeam 설정 → Header + StandingsBanner + ScheduleList + LineupSection + Footer
//
// 'use client' — myTeam 분기는 클라이언트 상태 (localStorage). 전체 페이지를 client component로.
// SSR하지 않으므로 SEO는 layout.tsx의 metadata로 충분.

'use client';

import { useState } from 'react';

import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { OfflineBanner } from '@/components/layout/OfflineBanner';
import { StandingsBanner } from '@/features/league-standings/StandingsBanner';
import { useMyTeam } from '@/features/team-selection/hooks/useMyTeam';
import { MyTeamSettings } from '@/features/team-selection/MyTeamSettings';
import { TeamSelectionScreen } from '@/features/team-selection/TeamSelectionScreen';

import { GameSchedule, LineupSectionMaybe, MatchupHeader } from './_dashboard';


export default function HomePage() {
  const { myTeam, ready, setTeam } = useMyTeam();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [skipMyTeam, setSkipMyTeam] = useState(false);

  // Initial onboarding: localStorage 비어있고 skip 누르지 않은 상태 → 팀 선택 화면
  if (ready && !myTeam && !skipMyTeam) {
    return (
      <main className="min-h-screen">
        <Header onOpenSettings={() => setSettingsOpen(true)} />
        <TeamSelectionScreen
          onSelect={(team) => setTeam(team)}
          onSkip={() => setSkipMyTeam(true)}
        />
        <Footer />
        <MyTeamSettings open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <Header onOpenSettings={() => setSettingsOpen(true)} />
      <OfflineBanner />
      <StandingsBanner myTeam={myTeam} />
      <MatchupHeader myTeam={myTeam} />
      <LineupSectionMaybe myTeam={myTeam} />
      <GameSchedule myTeam={myTeam} />
      <Footer />
      <MyTeamSettings open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </main>
  );
}

// Hydration-safe placeholder when ready=false (avoids SSR mismatch flash)
// (handled by useMyTeam.ready — render nothing until ready is true on client)
