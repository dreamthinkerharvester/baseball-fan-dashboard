// Design Ref: §5.4 State 5 — 캐시 stale / localStorage 비활성화 안내.

'use client';

import { useEffect, useState } from 'react';

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
      className={className}
      style={{
        background: 'var(--md-sys-color-tertiary-container)',
        color: 'var(--md-sys-color-on-tertiary-container)',
        borderBottom: '1px solid var(--md-sys-color-outline-variant)',
        padding: '8px 12px',
        fontSize: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <span className="mso" style={{ fontSize: 16 }} aria-hidden>
        info
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        {!storageOk ? (
          <p style={{ margin: 0 }}>시크릿 모드: 마이팀 설정이 탭을 닫으면 사라집니다.</p>
        ) : null}
        {staleHours > 0 ? (
          <p style={{ margin: 0 }} className="tabular">
            데이터 갱신이 약 {staleHours}시간 지연되고 있습니다.
          </p>
        ) : null}
      </div>
    </div>
  );
}
