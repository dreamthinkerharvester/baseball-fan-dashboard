// Design Ref: §5.4 — 9~10장 카드 그리드. 모바일 3열 / 데스크탑 5열.

'use client';

import clsx from 'clsx';

import { PlayerCard } from './PlayerCard';

import type { LineupSlot, Player } from '@/types';

export interface LineupGridProps {
  slots: ReadonlyArray<LineupSlot>;
  /** playerId → Player 룩업. 없는 선수는 그대로 카드 렌더 (이름 — 표시). */
  playerLookup: Map<string, Player>;
  /** 슬롯별 대표 스탯. */
  keyStatFor?: (slot: LineupSlot) => string | null;
  onPlayerClick?: (playerId: string) => void;
  className?: string;
}

export function LineupGrid({
  slots,
  playerLookup,
  keyStatFor,
  onPlayerClick,
  className,
}: LineupGridProps) {
  return (
    <ul
      role="list"
      className={clsx(
        'grid grid-cols-lineup-mobile gap-2 sm:grid-cols-4 md:grid-cols-lineup-desktop',
        className,
      )}
    >
      {slots.map((slot) => {
        const player = playerLookup.get(slot.playerId) ?? null;
        const stat = keyStatFor ? keyStatFor(slot) : null;
        return (
          <li key={`${slot.battingOrder}-${slot.playerId}`}>
            <PlayerCard
              slot={slot}
              player={player}
              keyStat={stat}
              onClick={() => onPlayerClick?.(slot.playerId)}
            />
          </li>
        );
      })}
    </ul>
  );
}
