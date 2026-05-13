// Design Ref: §5.4 Page 3 — Player detail modal. 4-way close + ARIA dialog (Dialog 컴포넌트가 처리).
// Tabs: 시즌 성적 / 역대 기록.

'use client';

import { useState } from 'react';

import { Dialog } from '@/components/ui/Dialog';
import { GradeBadge } from '@/components/ui/GradeBadge';
import { Tabs } from '@/components/ui/Tabs';
import { TEAMS } from '@/lib/constants';

import { CareerStatTab } from './CareerStatTab';
import { usePlayer } from './hooks/usePlayer';
import { SeasonStatTab } from './SeasonStatTab';

import type { Grade, TeamCode } from '@/types';

export interface PlayerModalProps {
  playerId: string;
  open: boolean;
  onClose: () => void;
}

type TabValue = 'season' | 'career';

export function PlayerModal({ playerId, open, onClose }: PlayerModalProps) {
  const [tab, setTab] = useState<TabValue>('season');
  const { data, error, isLoading } = usePlayer(open ? playerId : null);

  const player = data?.player;
  const team = player ? TEAMS[player.teamCode as TeamCode] : null;
  const grade: Grade = (data?.currentGrade?.grade as Grade) ?? 'normal';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      ariaLabelledby="player-modal-title"
      variant="bottom-sheet"
    >
      <div className="flex flex-col gap-4 p-4">
        <header className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {player && team ? (
              <>
                <span
                  className="text-heading"
                  style={{ color: team.primaryColor }}
                >
                  {team.shortName}
                </span>
                <h2 id="player-modal-title" className="text-display">
                  {player.name}
                </h2>
                <span className="text-body text-text-muted">{player.position}</span>
                <GradeBadge grade={grade} size="md" />
              </>
            ) : (
              <h2 id="player-modal-title" className="text-display">
                선수 정보
              </h2>
            )}
          </div>
          <button
            type="button"
            aria-label="닫기"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-button text-text-muted hover:bg-bg-card"
          >
            ✕
          </button>
        </header>

        {isLoading ? (
          <p className="py-8 text-center text-body text-text-muted" aria-live="polite">
            선수 정보 불러오는 중…
          </p>
        ) : null}

        {error ? (
          <div className="rounded-card border border-grade-rare/40 bg-grade-rare/10 p-3 text-body text-grade-rare">
            선수 정보를 불러오지 못했습니다.
          </div>
        ) : null}

        {data && player ? (
          <>
            {data.currentGrade?.basis ? (
              <p
                className="rounded-card border bg-bg-card p-2 text-caption text-text-muted"
                style={{ borderColor: `var(--grade-${grade})` }}
              >
                <span className="font-semibold">등급 산출:</span> {data.currentGrade.basis}
              </p>
            ) : null}

            <Tabs
              items={[
                { value: 'season' as const, label: '시즌 성적' },
                { value: 'career' as const, label: '역대 기록' },
              ]}
              value={tab}
              onChange={setTab}
              ariaLabel="기록 종류"
            />

            <div role="tabpanel" aria-label={tab === 'season' ? '시즌 성적' : '역대 기록'}>
              {tab === 'season' ? (
                <SeasonStatTab
                  isPitcher={player.isPitcher}
                  currentSeason={(data.currentSeason as Record<string, unknown>) ?? {}}
                  recentTen={(data.recentTen as Record<string, unknown>[]) ?? []}
                  grade={grade}
                />
              ) : (
                <CareerStatTab
                  isPitcher={player.isPitcher}
                  careerSeasons={(data.careerSeasons as Record<string, unknown>[]) ?? []}
                />
              )}
            </div>
          </>
        ) : null}
      </div>
    </Dialog>
  );
}
