// Design Ref: §5.4 Page 1 — 10팀 그리드 + 1-tap 온보딩 + "그냥 둘러보기".

'use client';

import clsx from 'clsx';

import { TEAMS, TEAM_CODES } from '@/lib/constants';

import type { TeamCode } from '@/types';

export interface TeamSelectionScreenProps {
  onSelect: (team: TeamCode) => void;
  onSkip?: () => void;
  /** Settings 모드: 현재 팀 강조 + skip 숨김. */
  highlightCurrent?: TeamCode | null;
}

export function TeamSelectionScreen({
  onSelect,
  onSkip,
  highlightCurrent = null,
}: TeamSelectionScreenProps) {
  return (
    <section
      aria-labelledby="team-select-heading"
      className="mx-auto flex max-w-screen-md flex-col gap-6 px-4 py-8"
    >
      <header className="text-center">
        <h1 id="team-select-heading" className="text-display">
          응원하는 팀을 선택해주세요
        </h1>
        <p className="mt-2 text-body text-text-muted">
          1번 클릭으로 마이팀이 설정됩니다. 언제든 헤더 ⚙ 에서 변경 가능.
        </p>
      </header>

      <ul
        role="list"
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5"
      >
        {TEAM_CODES.map((code) => {
          const team = TEAMS[code];
          const active = highlightCurrent === code;
          return (
            <li key={code}>
              <button
                type="button"
                onClick={() => onSelect(code)}
                aria-label={`${team.name} 선택`}
                aria-pressed={active}
                className={clsx(
                  'flex h-[88px] w-full flex-col items-center justify-center gap-1 rounded-card border-2 bg-bg-card transition-transform',
                  'min-h-[88px] min-w-[88px] hover:scale-[1.03] active:scale-100',
                  active ? 'ring-2 ring-grade-elite' : '',
                )}
                style={{ borderColor: team.primaryColor }}
              >
                <span
                  className="text-heading font-extrabold"
                  style={{ color: team.primaryColor }}
                >
                  {team.shortName}
                </span>
                <span className="text-caption text-text-muted">{team.name}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {onSkip ? (
        <div className="text-center">
          <button
            type="button"
            onClick={onSkip}
            className="min-h-[44px] text-body text-text-muted underline-offset-4 hover:text-text-primary hover:underline"
          >
            그냥 둘러보기
          </button>
        </div>
      ) : null}
    </section>
  );
}
