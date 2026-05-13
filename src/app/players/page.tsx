// Phase 1.5 — Player search page (/players).
// Layout: Header + PlayerSearchPanel + Footer. (StandingsBanner 제외 — 검색 집중)

'use client';

import { useState } from 'react';

import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { PlayerSearchPanel } from '@/features/player-search/PlayerSearchPanel';
import { MyTeamSettings } from '@/features/team-selection/MyTeamSettings';

export default function PlayersSearchPage() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <main className="min-h-screen">
      <Header onOpenSettings={() => setSettingsOpen(true)} />
      <PlayerSearchPanel />
      <Footer />
      <MyTeamSettings open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </main>
  );
}
