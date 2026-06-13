// Phase 1.5 — Player search page (/players).
// Layout: Header + PlayerSearchPanel + Footer. (StandingsBanner 제외 — 검색 집중)
// kia-fan-service 피벗: MyTeamSettings 제거 (팀 선택 개념 삭제).

'use client';

import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { PlayerSearchPanel } from '@/features/player-search/PlayerSearchPanel';

export default function PlayersSearchPage() {
  return (
    <main className="min-h-screen">
      <Header />
      <PlayerSearchPanel />
      <Footer />
    </main>
  );
}
