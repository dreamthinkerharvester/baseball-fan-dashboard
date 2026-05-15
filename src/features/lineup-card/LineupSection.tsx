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
        <h2
          id="lineup-section-heading"
          className="font-brand"
          style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: -0.2,
            color: 'var(--md-sys-color-on-surface)',
          }}
        >
          선발 라인업
          <span
            style={{
              marginLeft: 8,
              fontSize: 11,
              fontWeight: 500,
              color: 'var(--md-sys-color-on-surface-variant)',
            }}
          >
            {teamMeta.name}
          </span>
        </h2>
        {lineup?.fetchedAt ? (
          <span
            className="tabular"
            style={{
              fontSize: 11,
              color: 'var(--md-sys-color-on-surface-variant)',
              fontFamily: 'var(--md-ref-typeface-mono)',
            }}
          >
            갱신{' '}
            {new Date(lineup.fetchedAt).toLocaleTimeString('ko-KR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        ) : null}
      </header>

      {isLoading ? (
        <p
          className="py-6 text-center"
          aria-live="polite"
          style={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: 13 }}
        >
          라인업 불러오는 중…
        </p>
      ) : null}

      {error ? (
        <div
          className="flex items-center justify-between p-3"
          style={{
            background: 'var(--md-sys-color-error-container)',
            color: 'var(--md-sys-color-on-error-container)',
            borderRadius: 'var(--md-sys-shape-corner-medium)',
            fontSize: 13,
          }}
        >
          <span>라인업을 불러오지 못했습니다.</span>
          <button
            type="button"
            onClick={handleRefresh}
            className="m3-btn"
            style={{
              height: 36,
              padding: '0 12px',
              fontSize: 12,
              background: 'transparent',
              border: '1px solid var(--md-sys-color-on-error-container)',
              color: 'var(--md-sys-color-on-error-container)',
            }}
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
              <h3
                style={{
                  margin: '0 0 8px',
                  fontSize: 11,
                  fontWeight: 500,
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                  color: 'var(--md-sys-color-on-surface-variant)',
                }}
              >
                선발 투수
              </h3>
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
              <h3
                style={{
                  margin: '0 0 8px',
                  fontSize: 11,
                  fontWeight: 500,
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                  color: 'var(--md-sys-color-on-surface-variant)',
                }}
              >
                타순
              </h3>
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
