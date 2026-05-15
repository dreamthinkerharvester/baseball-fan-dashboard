// Design Ref: §5.4 Page 1 + m3-comp team-logo pattern.
// 10팀 그리드 + 1-tap 온보딩 + "그냥 둘러보기".

'use client';

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
        <h1
          id="team-select-heading"
          className="font-brand"
          style={{
            margin: 0,
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: -0.5,
            color: 'var(--md-sys-color-on-surface)',
          }}
        >
          응원하는 팀을 선택해주세요
        </h1>
        <p
          style={{
            marginTop: 8,
            fontSize: 13,
            color: 'var(--md-sys-color-on-surface-variant)',
          }}
        >
          1번 클릭으로 마이팀이 설정됩니다. 언제든 헤더 ⚙ 에서 변경 가능.
        </p>
      </header>

      <ul
        role="list"
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5"
        style={{ listStyle: 'none', padding: 0, margin: 0 }}
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
                className="flex w-full flex-col items-center justify-center gap-2"
                style={{
                  minHeight: 104,
                  padding: 12,
                  background: active
                    ? 'var(--md-sys-color-primary-container)'
                    : 'var(--md-sys-color-surface-container)',
                  borderRadius: 'var(--md-sys-shape-corner-medium)',
                  border: 'none',
                  boxShadow: active
                    ? 'var(--md-sys-elevation-2), 0 0 0 2px var(--md-sys-color-primary)'
                    : 'var(--md-sys-elevation-1)',
                  cursor: 'pointer',
                  transition:
                    'transform var(--md-sys-motion-duration-short3) var(--md-sys-motion-easing-standard), box-shadow var(--md-sys-motion-duration-short3) var(--md-sys-motion-easing-standard)',
                }}
              >
                <span
                  className="font-brand"
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 9999,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: team.primaryColor,
                    color: '#fff',
                    fontSize: 16,
                    fontWeight: 700,
                    letterSpacing: 0.2,
                    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.16)',
                  }}
                >
                  {team.shortName.slice(0, 2)}
                </span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: active
                      ? 'var(--md-sys-color-on-primary-container)'
                      : 'var(--md-sys-color-on-surface)',
                  }}
                >
                  {team.shortName}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    color: active
                      ? 'var(--md-sys-color-on-primary-container)'
                      : 'var(--md-sys-color-on-surface-variant)',
                  }}
                >
                  {team.name}
                </span>
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
            className="m3-btn m3-btn-text"
            style={{ minHeight: 44 }}
          >
            그냥 둘러보기
          </button>
        </div>
      ) : null}
    </section>
  );
}
