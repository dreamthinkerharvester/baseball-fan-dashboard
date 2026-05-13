// Phase 1.5 — Search results list (행 형태). 카드 X. 정보 밀집 우선.

'use client';

import clsx from 'clsx';

import { TEAMS } from '@/lib/constants';

import type { PlayerSearchResult } from '@/types';

export interface ResultsListProps {
  results: readonly PlayerSearchResult[];
  isLoading: boolean;
  totalMatched?: number;
  onSelect: (playerId: string) => void;
  className?: string;
}

export function ResultsList({
  results,
  isLoading,
  totalMatched,
  onSelect,
  className,
}: ResultsListProps) {
  if (isLoading && results.length === 0) {
    return (
      <p className={clsx('py-8 text-center text-body text-text-muted', className)}>
        검색 중…
      </p>
    );
  }

  if (results.length === 0) {
    return (
      <p className={clsx('py-8 text-center text-body text-text-muted', className)}>
        해당 조건의 선수가 없습니다.
      </p>
    );
  }

  const overflow =
    totalMatched != null && totalMatched > results.length
      ? totalMatched - results.length
      : 0;

  return (
    <ul
      className={clsx(
        'flex flex-col divide-y divide-text-dim/15 rounded-card border border-text-dim/15 bg-bg-card',
        className,
      )}
      aria-label="검색 결과"
    >
      {results.map(({ player, keyStat }) => {
        const team = TEAMS[player.teamCode];
        return (
          <li key={player.id}>
            <button
              type="button"
              onClick={() => onSelect(player.id)}
              className="flex h-12 w-full items-center gap-3 px-3 text-left transition hover:bg-bg-panel focus-visible:outline-grade-elite"
            >
              <span
                className="inline-flex h-7 min-w-[34px] items-center justify-center rounded-badge px-1 text-caption font-bold text-text-primary"
                style={{ backgroundColor: team.primaryColor }}
                aria-label={`팀: ${team.name}`}
              >
                {team.shortName}
              </span>
              <span
                className="inline-flex h-6 w-9 items-center justify-center rounded-badge border border-text-dim/40 text-caption font-bold text-text-muted"
                aria-label={`포지션: ${player.position}`}
              >
                {player.position}
              </span>
              <span className="flex-1 truncate text-body font-semibold text-text-primary">
                {player.name}
                {player.uniformNumber ? (
                  <span className="ml-2 text-caption text-text-muted">
                    #{player.uniformNumber}
                  </span>
                ) : null}
              </span>
              <span className="text-caption font-mono text-text-muted">
                {keyStat ?? '—'}
              </span>
              <span aria-hidden className="text-text-dim">
                ›
              </span>
            </button>
          </li>
        );
      })}
      {overflow > 0 ? (
        <li className="px-3 py-2 text-caption text-text-muted">
          외 {overflow}명 — 검색어/필터를 좁혀주세요
        </li>
      ) : null}
    </ul>
  );
}
