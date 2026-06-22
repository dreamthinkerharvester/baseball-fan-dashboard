// Design Ref: §5.4 — 마이팀 라인업 섹션. 헤더 + (Grid OR Placeholder).
// Player click → 선수 상세페이지(/players/[id])로 이동.

'use client';

import { useEffect, useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';
import useSWR from 'swr';

import { fetcher } from '@/lib/api-client';
import { icon } from '@/lib/assets-magu';
import { TEAMS } from '@/lib/constants';

import { useLineup } from './hooks/useLineup';
import { LineupGrid } from './LineupGrid';
import { LineupPlaceholder } from './LineupPlaceholder';
import { PlayerCard } from './PlayerCard';

import type { SaberCardEntry } from '@/services/saber';
import type { LineupSlot, Player, TeamCode } from '@/types';

export interface LineupSectionProps {
  team: TeamCode;
  date?: string;
}

export function LineupSection({ team, date }: LineupSectionProps) {
  const teamMeta = TEAMS[team];
  const { data: lineup, error, isLoading, refresh } = useLineup(team, date);
  const { data: players } = useSWR<Player[]>('/api/players', fetcher);
  // Design Ref: kia-fan-service §5.3 — 카드용 세이버 스냅샷 (로스터 전체 1회 fetch, FR-03)
  const { data: saberCards } = useSWR<{ entries: SaberCardEntry[] }>('/api/saber-cards', fetcher, {
    revalidateOnFocus: false,
  });
  const router = useRouter();
  const openPlayer = (id: string) => router.push(`/players/${id}`);
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

  const saberLookup = useMemo(() => {
    const map = new Map<string, SaberCardEntry>();
    for (const e of saberCards?.entries ?? []) map.set(e.playerId, e);
    return map;
  }, [saberCards]);

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

      {lineup && (lineup.status === 'confirmed' || lineup.status === 'fallback' || lineup.status === 'frequency') ? (
        <div className="space-y-4">
          {/* 선발 투수 — full width 카드 */}
          {lineup.startingPitcher ? (
            <div>
              <SectionLabel>선발 투수</SectionLabel>
              <PlayerCard
                variant="starter"
                slot={lineup.startingPitcher}
                player={playerLookup.get(lineup.startingPitcher.playerId) ?? null}
                keyStat={keyStatForPitcher(lineup.startingPitcher)}
                saber={saberLookup.get(lineup.startingPitcher.playerId) ?? null}
                onClick={() => openPlayer(lineup.startingPitcher!.playerId)}
              />
            </div>
          ) : null}

          {/* 타순 9~10장 */}
          {lineup.battingOrder.length > 0 ? (
            <div>
              <SectionLabel>주전 타순 (자주 나옴)</SectionLabel>
              <LineupGrid
                slots={lineup.battingOrder}
                playerLookup={playerLookup}
                saberLookup={saberLookup}
                keyStatFor={keyStatForBatter}
                onPlayerClick={openPlayer}
              />
            </div>
          ) : null}

          {/* 백업 후보 — frequency 모드에서만 */}
          {lineup.backups && lineup.backups.length > 0 ? (
            <div>
              <SectionLabel>백업 후보 ({lineup.backups.length}명)</SectionLabel>
              <ul role="list" style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: 0, margin: 0, listStyle: 'none' }}>
                {lineup.backups.map((b, i) => {
                  const p = playerLookup.get(b.playerId);
                  return (
                    <li
                      key={`${b.battingOrder}-${b.playerId}-${i}`}
                      onClick={() => openPlayer(b.playerId)}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '22px 28px 1fr auto auto',
                        gap: 6,
                        alignItems: 'center',
                        padding: '4px 8px',
                        background: 'linear-gradient(180deg, var(--magu-panel-deep), #141B30)',
                        border: '1px solid var(--magu-line)',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 11,
                      }}
                    >
                      <span className="font-digit" style={{ color: 'var(--magu-text-3)', fontSize: 10 }}>
                        {b.battingOrder}
                      </span>
                      <span
                        style={{
                          padding: '1px 4px',
                          borderRadius: 3,
                          background: 'var(--magu-panel-light)',
                          color: 'var(--magu-text-2)',
                          fontSize: 9,
                          fontWeight: 900,
                          textAlign: 'center',
                        }}
                      >
                        {b.position}
                      </span>
                      <span style={{ color: 'var(--magu-text-1)', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p?.name ?? `#${b.playerId}`}
                        {p?.uniformNumber ? <span className="font-digit" style={{ color: 'var(--magu-text-3)', fontWeight: 400, marginLeft: 4, fontSize: 10 }}>#{p.uniformNumber}</span> : null}
                      </span>
                      <span className="font-digit" style={{ color: 'var(--magu-gold)', fontSize: 10 }}>
                        {b.gradePercentile}%
                      </span>
                      <span className="font-digit" style={{ color: 'var(--magu-sky)', fontSize: 10, fontWeight: 700 }}>
                        {b.freq.appearances}회
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}

          {/* 선발 투수 풀 — frequency 모드에서 등판 기록 */}
          {lineup.pitcherPool && lineup.pitcherPool.length > 0 ? (
            <div>
              <SectionLabel>최근 선발 투수 ({lineup.pitcherPool.length}명)</SectionLabel>
              <ul role="list" style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: 0, margin: 0, listStyle: 'none' }}>
                {lineup.pitcherPool.map((p, i) => {
                  const player = playerLookup.get(p.playerId);
                  const isCurrent = i === 0;
                  return (
                    <li
                      key={`${p.playerId}-${i}`}
                      onClick={() => openPlayer(p.playerId)}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '22px 1fr auto auto auto',
                        gap: 6,
                        alignItems: 'center',
                        padding: '4px 8px',
                        background: isCurrent
                          ? 'linear-gradient(90deg, rgba(255,201,60,.18), rgba(36,49,82,.6))'
                          : 'linear-gradient(180deg, var(--magu-panel-deep), #141B30)',
                        border: isCurrent ? '1px solid var(--magu-gold)' : '1px solid var(--magu-line)',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 11,
                      }}
                    >
                      <span
                        style={{
                          padding: '1px 4px',
                          borderRadius: 3,
                          background: isCurrent ? 'var(--magu-gold)' : 'var(--magu-panel-light)',
                          color: isCurrent ? '#2A1A00' : 'var(--magu-text-2)',
                          fontSize: 9,
                          fontWeight: 900,
                          textAlign: 'center',
                        }}
                      >
                        P
                      </span>
                      <span style={{ color: 'var(--magu-text-1)', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {player?.name ?? `#${p.playerId}`}
                        {player?.uniformNumber ? <span className="font-digit" style={{ color: 'var(--magu-text-3)', fontWeight: 400, marginLeft: 4, fontSize: 10 }}>#{player.uniformNumber}</span> : null}
                      </span>
                      <span className="font-digit" style={{ color: 'var(--magu-gold)', fontSize: 10 }}>
                        {p.gradePercentile}%
                      </span>
                      <span className="font-digit" style={{ color: 'var(--magu-sky)', fontSize: 10, fontWeight: 700 }}>
                        {p.freq.appearances}선발
                      </span>
                      <span className="font-digit" style={{ color: 'var(--magu-text-3)', fontSize: 9 }}>
                        {p.freq.lastAppearance.slice(5).replace('-', '/')}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3
      style={{
        margin: '12px 0 6px',
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 0.3,
        color: 'var(--magu-text-3)',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
      }}
    >
      <span style={{ width: 3, height: 12, borderRadius: 2, background: 'var(--magu-gold)' }} aria-hidden />
      {children}
    </h3>
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
