// Design Ref: §5.4 — 라인업 미확정 상태. 9장 placeholder + 안내 + 새로고침.
// Plan FR-12: 빈 데이터 에러로 처리하지 않고 명시적 placeholder.

'use client';

import clsx from 'clsx';

export interface LineupPlaceholderProps {
  /** 새로고침 핸들러. SWR mutate 트리거. */
  onRefresh?: () => void;
  isRefreshing?: boolean;
  /** 표시할 placeholder 카드 수. 기본 9 (DH 포함 시 10). */
  count?: number;
  /** 사용자에게 보여줄 안내 문구 override. */
  message?: string;
  className?: string;
}

export function LineupPlaceholder({
  onRefresh,
  isRefreshing = false,
  count = 9,
  message = '라인업 미확정 — 경기 시작 2시간 전 공개 예정',
  className,
}: LineupPlaceholderProps) {
  return (
    <div className={clsx('space-y-3', className)} aria-busy={isRefreshing}>
      <div className="rounded-card border border-text-dim/30 bg-bg-panel/50 px-3 py-2 text-body text-text-muted">
        <p>{message}</p>
        {onRefresh ? (
          <div className="mt-2">
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="min-h-[36px] rounded-button border border-text-dim/30 px-3 text-caption hover:border-grade-elite/40 disabled:opacity-50"
            >
              {isRefreshing ? '갱신 중…' : '🔄 새로고침'}
            </button>
          </div>
        ) : null}
      </div>

      <ul
        role="list"
        aria-label="라인업 placeholder"
        className="grid grid-cols-lineup-mobile gap-2 opacity-50 sm:grid-cols-4 md:grid-cols-lineup-desktop"
      >
        {Array.from({ length: count }, (_, i) => (
          <li key={i}>
            <div className="flex h-[140px] w-full animate-pulse flex-col items-center justify-between rounded-card border-2 border-text-dim/30 bg-bg-card px-2 py-2 sm:h-[170px]">
              <span className="text-caption text-text-dim">{i + 1}</span>
              <span className="h-12 w-12 rounded-full bg-text-dim/20" aria-hidden />
              <span className="text-caption text-text-dim">미확정</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
