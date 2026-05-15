// Design Ref: §5.4 PlayerModal + m3-comp Screen2 bottom-sheet.
// HTML <dialog> for native focus trap + Escape, M3 surface tokens.

'use client';

import { useCallback, useEffect, useRef, type ReactNode } from 'react';

import clsx from 'clsx';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
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

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
    } else if (!open && el.open) {
      el.close();
    }
  }, [open]);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    const handler = () => onClose();
    el.addEventListener('close', handler);
    return () => el.removeEventListener('close', handler);
  }, [onClose]);

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

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    dragStartY.current = e.touches[0]?.clientY ?? null;
  };
  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (dragStartY.current == null) return;
    const endY = e.changedTouches[0]?.clientY ?? dragStartY.current;
    if (endY - dragStartY.current > 80) onClose();
    dragStartY.current = null;
  };

  const isSheet = variant === 'bottom-sheet';

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
      style={isSheet ? { marginBottom: 0, marginTop: 'auto' } : undefined}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        onTouchStart={isSheet ? handleTouchStart : undefined}
        onTouchEnd={isSheet ? handleTouchEnd : undefined}
        className="mx-auto w-full max-w-screen-md pb-safe"
        style={{
          background: 'var(--md-sys-color-surface-container-high)',
          color: 'var(--md-sys-color-on-surface)',
          borderTopLeftRadius: isSheet
            ? 'var(--md-sys-shape-corner-extra-large)'
            : 'var(--md-sys-shape-corner-large)',
          borderTopRightRadius: isSheet
            ? 'var(--md-sys-shape-corner-extra-large)'
            : 'var(--md-sys-shape-corner-large)',
          borderBottomLeftRadius: isSheet ? 0 : 'var(--md-sys-shape-corner-large)',
          borderBottomRightRadius: isSheet ? 0 : 'var(--md-sys-shape-corner-large)',
          minHeight: isSheet ? '60vh' : 'auto',
          marginTop: isSheet ? 'auto' : '32px',
          boxShadow: 'var(--md-sys-elevation-3)',
          overflow: 'hidden',
        }}
      >
        {isSheet && (
          <div
            aria-hidden
            style={{
              width: 32,
              height: 4,
              borderRadius: 2,
              background: 'var(--md-sys-color-outline-variant)',
              margin: '12px auto 0',
            }}
          />
        )}
        {children}
      </div>
    </dialog>
  );
}
