// Design Ref: §5.4 State 5 — 캐시 stale / localStorage 비활성화 안내.

'use client';

import { useEffect, useState } from 'react';

import clsx from 'clsx';

import { isStorageAvailable } from '@/lib/storage';

export interface OfflineBannerProps {
  /** stale cache age (hours). 0이면 안 보임. */
  staleHours?: number;
  className?: string;
}

export function OfflineBanner({ staleHours = 0, className }: OfflineBannerProps) {
  const [storageOk, setStorageOk] = useState(true);

  useEffect(() => {
    setStorageOk(isStorageAvailable());
  }, []);

  if (storageOk && staleHours <= 0) return null;

  return (
    <div
      role="status"
      className={clsx(
        'border-b border-grade-special/40 bg-grade-special/10 px-4 py-2 text-caption text-grade-special',
        className,
      )}
    >
      {!storageOk ? (
        <p>시크릿 모드: 마이팀 설정이 탭을 닫으면 사라집니다.</p>
      ) : null}
      {staleHours > 0 ? (
        <p>데이터 갱신이 약 {staleHours}시간 지연되고 있습니다.</p>
      ) : null}
    </div>
  );
}
