// Design Ref: §5.4 PlayerModal — 4-way 닫기 + focus trap + ARIA dialog.
// HTML <dialog> element 활용 — 브라우저 기본 focus trap + Escape를 활용.

'use client';

import { useCallback, useEffect, useRef, type ReactNode } from 'react';

import clsx from 'clsx';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  /** Bottom-sheet (모바일) vs center (데스크탑). responsive로 자동 결정 가능. */
  variant?: 'bottom-sheet' | 'center';
  ariaLabelledby?: string;
  ariaDescribedby?: string;
  children: ReactNode;
}

export function Dialog({
  open,
  onClose,
  variant = 'bottom-sheet',
  ariaLabelledby,
  ariaDescribedby,
  children,
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const dragStartY = useRef<number | null>(null);

  // open prop ↔ <dialog> showModal/close 동기화
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
    } else if (!open && el.open) {
      el.close();
    }
  }, [open]);

  // <dialog> close 이벤트 → onClose
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    const handler = () => onClose();
    el.addEventListener('close', handler);
    return () => el.removeEventListener('close', handler);
  }, [onClose]);

  // 배경 클릭 닫기 (dialog 자체 클릭 시 onClick 발생 — outside만 필터)
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      const el = e.currentTarget;
      const rect = el.getBoundingClientRect();
      const inside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;
      if (!inside) onClose();
    },
    [onClose],
  );

  // 모바일 스와이프 다운 닫기 (bottom-sheet 한정)
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    dragStartY.current = e.touches[0]?.clientY ?? null;
  };
  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (dragStartY.current == null) return;
    const endY = e.changedTouches[0]?.clientY ?? dragStartY.current;
    if (endY - dragStartY.current > 80) onClose();
    dragStartY.current = null;
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      aria-modal="true"
      aria-labelledby={ariaLabelledby}
      aria-describedby={ariaDescribedby}
      className={clsx(
        'border-0 bg-transparent p-0 backdrop:bg-black/60 backdrop:backdrop-blur-sm',
        'open:animate-[fadein_200ms_ease-out]',
      )}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        onTouchStart={variant === 'bottom-sheet' ? handleTouchStart : undefined}
        onTouchEnd={variant === 'bottom-sheet' ? handleTouchEnd : undefined}
        className={clsx(
          'mx-auto w-full max-w-screen-md bg-bg-panel text-text-primary shadow-2xl',
          variant === 'bottom-sheet'
            ? 'rounded-t-modal pb-safe min-h-[60vh] mt-auto'
            : 'rounded-modal my-8',
        )}
      >
        {children}
      </div>
    </dialog>
  );
}
