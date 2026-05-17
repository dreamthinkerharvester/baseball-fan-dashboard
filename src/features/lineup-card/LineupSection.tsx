// Design Ref: §5.4 — 마이팀 라인업 섹션. 헤더 + (Grid OR Placeholder).
// Player click 상태는 본 컴포넌트가 관리 → PlayerModal 트리거.

'use client';

import { useEffect, useMemo, useState } from 'react';

import useSWR from 'swr';

import { PlayerModal } from '@/features/player-modal/PlayerModal';
import { fetcher } from '@/lib/api-client';
import { icon } from '@/lib/assets-magu';
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
      <header className="flex items-center justify-between gap-2">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 8px 3px 4px',
              borderRadius: 6,
              background: 'linear-gradient(180deg, var(--magu-gold), var(--magu-gold-deep))',
              color: '#2A1A00',
              fontSize: 11,
              fontWeight: 900,
              boxShadow: '0 2px 0 #5C3D00',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={icon('bat')} alt="" width={16} height={16} className="magu-pixel" />
            오늘의 라인업
          </span>
          <h2 id="lineup-section-heading" className="font-brand-magu" style={{ margin: 0, fontSize: 18, color: 'var(--magu-text-1)' }}>
            {teamMeta.shortName} 선발 9인
          </h2>
        </div>
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

      {lineup && lineup.status === 'fallback' && lineup.fallbackDate ? (
        <div
          style={{
            margin: '0 0 8px',
            padding: '6px 10px',
            borderRadius: 8,
            background: 'rgba(255,201,60,.12)',
            border: '1px solid var(--magu-gold)',
            color: 'var(--magu-text-2)',
            fontSize: 11,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span className="mso" style={{ fontSize: 14, color: 'var(--magu-gold)' }}>history</span>
          <span>
            <b style={{ color: 'var(--magu-gold)' }}>{lineup.fallbackDate.slice(5).replace('-', '/')}</b> 라인업 — 오늘 라인업은 경기 2시간 전 공개 예정
          </span>
        </div>
      ) : null}

      {lineup && lineup.status === 'frequency' && lineup.frequencySourceDates ? (
        <div
          style={{
            margin: '0 0 8px',
            padding: '6px 10px',
            borderRadius: 8,
            background: 'rgba(86,170,255,.1)',
            border: '1px solid var(--magu-sky)',
            color: 'var(--magu-text-2)',
            fontSize: 11,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span className="mso" style={{ fontSize: 14, color: 'var(--magu-sky)' }}>insights</span>
          <span>
            최근 <b style={{ color: 'var(--magu-sky)' }}>{lineup.frequencyWindowDays}일 · {lineup.frequencySourceDates.length}경기</b> 빈출 라인업 — 실제 오늘 라인업은 경기 2시간 전 공개
          </span>
        </div>
      ) : null}

      {lineup && (lineup.status === 'confirmed' || lineup.status === 'fallback') ? (
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
