// Design Ref: kia-fan-service §5.4 (FR-04) — "클래식 스탯 보기" 토글 스위치.
// 44px 터치 타깃 (NFR), ON 시 스낵바 안내.

'use client';

import { useToast } from '@/components/ui/Toast';

import { useSaberMode } from './SaberModeContext';

export function SaberToggle() {
  const { hidden, toggle } = useSaberMode();
  const { show } = useToast();
  const revealed = !hidden;

  const onToggle = () => {
    if (hidden) {
      // 숨김 → 공개로 전환되는 순간 안내
      show('클래식 스탯이 표시됩니다. 세이버와 비교해보세요.', 'info');
    }
    toggle();
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={revealed}
      aria-label="클래식 스탯 보기"
      title="클래식 스탯 보기"
      onClick={onToggle}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        minHeight: 44,
        padding: '0 8px',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 0.3,
          color: revealed ? 'var(--magu-gold)' : 'var(--magu-text-3)',
          whiteSpace: 'nowrap',
        }}
      >
        클래식
      </span>
      {/* 스위치 트랙 */}
      <span
        aria-hidden
        style={{
          position: 'relative',
          width: 34,
          height: 18,
          borderRadius: 9999,
          background: revealed
            ? 'linear-gradient(180deg, var(--magu-gold), var(--magu-gold-deep))'
            : 'var(--magu-panel-light)',
          transition: 'background 0.2s ease',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 2,
            left: revealed ? 18 : 2,
            width: 14,
            height: 14,
            borderRadius: 9999,
            background: '#fff',
            boxShadow: '0 1px 2px rgba(0,0,0,.4)',
            transition: 'left 0.2s ease',
          }}
        />
      </span>
    </button>
  );
}
