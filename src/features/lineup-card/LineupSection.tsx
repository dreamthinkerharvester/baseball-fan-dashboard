// Design Ref: §5.4 — 마이팀 라인업 섹션. 헤더 + (Grid OR Placeholder).
// Player click 상태는 본 컴포넌트가 관리 → PlayerModal 트리거.

'use client';

import { useEffect, useMemo, useState } from 'react';

import useSWR from 'swr';

import { PlayerModal } from '@/features/player-modal/PlayerModal';
import { fetcher } from '@/lib/api-client';
import { TEAMS } from '@/lib/constants';

import { useLineup } from './hooks/useLineup';
import { LineupGrid } from './LineupGrid';
import { LineupPlaceholder } from './LineupPlaceholder';
import { PlayerCard } from './PlayerCard';

import type { LineupSlot, Player, TeamCode } from '@/types';

export interface LineupSectionProps {
  team: TeamCode;
  date?: string;
}

export function LineupSection({ team, date }: LineupSectionProps) {
  const teamMeta = TEAMS[team];
  const { data: lineup, error, isLoading, refresh } = useLineup(team, date);
  const { data: players } = useSWR<Player[]>('/api/players', fetcher);
  const [openPlayerId, setOpenPlayerId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setRefreshing(false);
  }, [lineup]);

  const playerLookup = useMemo(() => {
    const map = new Map<string, Player>();
    if (!players) return map;
    for (const p of players) map.set(p.id, p);
    return map;
  }, [players]);

  function handleRefresh() {
    setRefreshing(true);
    refresh();
  }

  return (
    <section
      aria-labelledby="lineup-section-heading"
      aria-busy={isLoading || refreshing}
      className="space-y-3 px-4 py-4"
    >
      <header className="flex items-baseline justify-between gap-2">
        <h2 id="lineup-section-heading" className="text-heading">
          마이팀 라인업
          <span className="ml-2 text-caption font-normal text-text-muted">
            {teamMeta.name}
          </span>
        </h2>
        {lineup?.fetchedAt ? (
          <span className="text-caption text-text-dim">
            갱신 {new Date(lineup.fetchedAt).toLocaleTimeString('ko-KR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        ) : null}
      </header>

      {isLoading ? (
        <p className="py-6 text-center text-body text-text-muted" aria-live="polite">
          라인업 불러오는 중…
        </p>
      ) : null}

      {error ? (
        <div className="flex items-center justify-between rounded-card border border-grade-rare/40 bg-grade-rare/10 p-3">
          <span className="text-body text-grade-rare">라인업을 불러오지 못했습니다.</span>
          <button
            type="button"
            onClick={handleRefresh}
            className="min-h-[36px] rounded-button border border-grade-rare/40 px-3"
          >
            다시
          </button>
        </div>
      ) : null}

      {lineup && lineup.status === 'pending' ? (
        <LineupPlaceholder onRefresh={handleRefresh} isRefreshing={refreshing} />
      ) : null}

      {lineup && lineup.status === 'confirmed' ? (
        <div className="space-y-4">
          {/* 선발 투수 — full width 카드 */}
          {lineup.startingPitcher ? (
            <div>
              <h3 className="mb-2 text-caption text-text-muted">선발 투수</h3>
              <PlayerCard
                variant="starter"
                slot={lineup.startingPitcher}
                player={playerLookup.get(lineup.startingPitcher.playerId) ?? null}
                keyStat={keyStatForPitcher(lineup.startingPitcher)}
                onClick={() =>
                  setOpenPlayerId(lineup.startingPitcher!.playerId)
                }
              />
            </div>
          ) : null}

          {/* 타순 9~10장 */}
          {lineup.battingOrder.length > 0 ? (
            <div>
              <h3 className="mb-2 text-caption text-text-muted">타순</h3>
              <LineupGrid
                slots={lineup.battingOrder}
                playerLookup={playerLookup}
                keyStatFor={keyStatForBatter}
                onPlayerClick={(id) => setOpenPlayerId(id)}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {/* 카드 클릭 시 모달 */}
      {openPlayerId ? (
        <PlayerModal
          playerId={openPlayerId}
          open={openPlayerId !== null}
          onClose={() => setOpenPlayerId(null)}
        />
      ) : null}
    </section>
  );
}

function keyStatForBatter(slot: LineupSlot): string | null {
  // 등급 산출 basis에서 OPS 또는 wRC+ 추출 (간단 fallback)
  // 추후 PlayerCard에서 실제 시즌 stat fetch도 가능 — MVP는 percentile 표시
  return `${slot.gradePercentile}%`;
}

function keyStatForPitcher(slot: LineupSlot): string | null {
  return `${slot.gradePercentile}%`;
}
