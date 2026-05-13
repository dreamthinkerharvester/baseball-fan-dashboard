// Design Ref: §5.1 — Sticky 헤더. 마이팀 배지 + 설정 버튼.

'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';

import clsx from 'clsx';

import { TEAMS } from '@/lib/constants';
import { getMyTeam } from '@/lib/storage';

import type { TeamCode } from '@/types';

export interface HeaderProps {
  onOpenSettings?: () => void;
}

export function Header({ onOpenSettings }: HeaderProps) {
  const [myTeam, setMyTeam] = useState<TeamCode | null>(null);

  useEffect(() => {
    setMyTeam(getMyTeam());
  }, []);

  return (
    <header
      className={clsx(
        'sticky top-0 z-30 flex h-12 items-center justify-between',
        'border-b border-text-dim/20 bg-bg-deep/80 px-4 backdrop-blur',
      )}
    >
      <div className="flex items-center gap-2">
        <span aria-hidden className="text-heading">⚾</span>
        <h1 className="text-heading">KBO 카드 대시보드</h1>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href="/players"
          aria-label="선수 검색"
          className="flex h-11 w-11 items-center justify-center rounded-button text-text-muted hover:bg-bg-panel"
        >
          <span aria-hidden>🔍</span>
        </Link>
        {myTeam ? (
          <span
            className="inline-flex h-7 items-center rounded-badge border px-2 text-caption font-bold"
            style={{
              borderColor: TEAMS[myTeam].primaryColor,
              color: TEAMS[myTeam].primaryColor,
            }}
            aria-label={`마이팀: ${TEAMS[myTeam].name}`}
          >
            {TEAMS[myTeam].shortName}
          </span>
        ) : null}
        <button
          type="button"
          aria-label="설정"
          onClick={onOpenSettings}
          className="flex h-11 w-11 items-center justify-center rounded-button text-text-muted hover:bg-bg-panel"
        >
          <span aria-hidden>⚙</span>
        </button>
      </div>
    </header>
  );
}
