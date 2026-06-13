// Design Ref: kia-fan-service §6 — 미수집 세이버 필드 "집계 중" 공통 뱃지.
// null 값을 빈 칸/에러 대신 투명하게 안내 (PRD §7 Gap 처리 전략).

export function PendingBadge({ note }: { note?: string }) {
  return (
    <span
      title={note ?? '데이터 수집 중입니다'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '1px 6px',
        borderRadius: 4,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 0.3,
        background: 'var(--md-sys-color-surface-container-highest)',
        color: 'var(--md-sys-color-on-surface-variant)',
        border: '1px dashed var(--md-sys-color-outline-variant)',
        whiteSpace: 'nowrap',
      }}
    >
      집계 중
    </span>
  );
}
