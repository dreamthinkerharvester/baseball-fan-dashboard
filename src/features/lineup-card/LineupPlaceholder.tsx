// Design Ref: §5.4 — 라인업 미확정 상태. 안내 + 새로고침.
// fallback 데이터가 있으면 이 컴포넌트는 호출되지 않음.

'use client';

export interface LineupPlaceholderProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
  message?: string;
}

export function LineupPlaceholder({
  onRefresh,
  isRefreshing = false,
  message = '라인업 미확정 — 경기 시작 2시간 전 공개 예정',
}: LineupPlaceholderProps) {
  return (
    <div
      style={{
        padding: '20px 16px',
        borderRadius: 'var(--md-sys-shape-corner-medium)',
        background: 'var(--md-sys-color-surface-container)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        textAlign: 'center',
      }}
      aria-busy={isRefreshing}
    >
      <span className="mso filled" style={{ fontSize: 40, color: 'var(--md-sys-color-outline)' }}>
        pending
      </span>
      <div style={{ fontSize: 13, color: 'var(--md-sys-color-on-surface-variant)', maxWidth: 280 }}>
        {message}
      </div>
      {onRefresh ? (
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="m3-btn m3-btn-outlined"
          style={{ height: 36, fontSize: 12, opacity: isRefreshing ? 0.5 : 1 }}
        >
          {isRefreshing ? '갱신 중…' : '새로고침'}
        </button>
      ) : null}
    </div>
  );
}
