// Design Ref: kia-fan-service §5.1 + 2026-06-12 레이아웃 재편 — 정보 밀집형 KIA 대시보드.
// 우선순위: 로스터 세이버 표(출전순) > 체감vs데이터 > 최근경기·일정 > 라인업 카드 > 운세.
// 데스크탑(lg+)은 2열 그리드로 한 화면 정보량 극대화.
//
// 'use client' — SWR 훅 기반 섹션 구성. SEO는 layout.tsx의 metadata로 충분.

'use client';

import { useEffect } from 'react';

import { CommentBoard } from '@/features/comments/CommentBoard';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { OfflineBanner } from '@/components/layout/OfflineBanner';
import { StandingsBanner } from '@/features/league-standings/StandingsBanner';
import { MY_TEAM } from '@/lib/constants';
import { useFirstVisitRefresh } from '@/lib/refresh';
import { clearLegacyMyTeam } from '@/lib/storage';

import {
  GameSchedule,
  LineupSectionMaybe,
  ManagerFortuneSection,
  MatchupHeader,
  MetroAlertSection,
  MythBusterSection,
  RecentTenSection,
  RosterTablesSection,
} from './_dashboard';

export default function HomePage() {
  useFirstVisitRefresh();

  // 구 멀티팀 localStorage 키 청소 (피벗 마이그레이션 — 무해 idempotent)
  useEffect(() => {
    clearLegacyMyTeam();
  }, []);

  return (
    <main
      className="min-h-screen"
      style={{ background: 'var(--md-sys-color-surface)', color: 'var(--md-sys-color-on-surface)' }}
    >
      <Header />
      <OfflineBanner />
      <StandingsBanner myTeam={MY_TEAM} />
      <MetroAlertSection />
      <MatchupHeader />

      {/* ① 주인공 — 출전순 전체 로스터 세이버 표 (타자/투수) */}
      <RosterTablesSection />

      {/* ② 데스크탑 2열: 체감vs데이터 | 최근 10경기 — 모바일은 세로 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 lg:items-start">
        <MythBusterSection />
        <RecentTenSection />
      </div>

      {/* ③ 일정 + 오늘 라인업 카드 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 lg:items-start">
        <GameSchedule />
        <LineupSectionMaybe />
      </div>

      {/* ④ 오늘의 운세 (별자리·사주) */}
      <ManagerFortuneSection />

      <CommentBoard />
      <Footer />
    </main>
  );
}
