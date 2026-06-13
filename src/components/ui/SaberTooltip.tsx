// Design Ref: kia-fan-service §5.3 (FR-05) — 세이버 용어 인라인 교육 툴팁.
// 지표명 탭 → 한 줄 정의 + 이 선수 값 해석. aria-live로 스크린 리더 지원.

'use client';

import { useEffect, useRef, useState } from 'react';

import { glossaryText, SABER_GLOSSARY, type SaberMetricKey } from '@/lib/saber-glossary';

export interface SaberTooltipProps {
  metric: SaberMetricKey;
  /** 해석에 쓸 이 선수의 값. null = 정의만 표시. */
  value?: number | null;
  /** 트리거 라벨 (기본 = 지표명). */
  children?: React.ReactNode;
  /** 라벨 폰트 크기 등 트리거 스타일. */
  triggerStyle?: React.CSSProperties;
}

const AUTO_DISMISS_MS = 5000;

export function SaberTooltip({ metric, value = null, children, triggerStyle }: SaberTooltipProps) {
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const show = () => {
    setOpen((prev) => {
      const next = !prev;
      if (timer.current) clearTimeout(timer.current);
      if (next) timer.current = setTimeout(() => setOpen(false), AUTO_DISMISS_MS);
      return next;
    });
  };

  return (
    <span style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          show();
        }}
        aria-expanded={open}
        aria-label={`${SABER_GLOSSARY[metric].label} 설명 보기`}
        style={{
          background: 'transparent',
          border: 'none',
          padding: 0,
          margin: 0,
          cursor: 'help',
          font: 'inherit',
          color: 'inherit',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 2,
          textDecoration: 'underline dotted',
          textUnderlineOffset: 2,
          ...triggerStyle,
        }}
      >
        {children ?? SABER_GLOSSARY[metric].label}
      </button>
      {/* aria-live 영역 — open 여부와 무관하게 존재해야 SR이 변경을 감지 */}
      <span
        aria-live="polite"
        role="status"
        style={
          open
            ? {
                position: 'absolute',
                bottom: 'calc(100% + 6px)',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 60,
                width: 'max-content',
                maxWidth: 220,
                padding: '8px 10px',
                borderRadius: 8,
                background: 'var(--magu-panel, #243152)',
                border: '1px solid var(--magu-line-light, #4D5A8A)',
                boxShadow: '0 4px 12px rgba(0,0,0,.5)',
                color: 'var(--magu-text-1, #fff)',
                fontSize: 11,
                fontWeight: 400,
                lineHeight: 1.45,
                textAlign: 'left',
                whiteSpace: 'normal',
              }
            : {
                position: 'absolute',
                width: 1,
                height: 1,
                overflow: 'hidden',
                clipPath: 'inset(50%)',
              }
        }
      >
        {open ? glossaryText(metric, value ?? null) : ''}
      </span>
    </span>
  );
}
