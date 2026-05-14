// Design Ref: §5.1 + m3-comp Screen1 MobileHeader.

'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';

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
      className="m3-sticky-header"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 12px',
        minHeight: 56,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
        <span
          aria-hidden
          className="mso filled"
          style={{ fontSize: 24, color: 'var(--md-sys-color-primary)' }}
        >
          sports_baseball
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1, minWidth: 0 }}>
          <h1
            className="font-brand"
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: -0.2,
              color: 'var(--md-sys-color-on-surface)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            KBO 카드 대시보드
          </h1>
          <span style={{ fontSize: 11, color: 'var(--md-sys-color-on-surface-variant)' }}>
            Material 3 · KIA Seed
          </span>
        </div>
      </div>

      <Link
        href="/storybook"
        aria-label="스토리북"
        className="m3-btn m3-btn-icon"
        style={{ width: 44, height: 44 }}
      >
        <span className="mso filled" style={{ fontSize: 22, color: 'var(--md-sys-color-tertiary)' }}>
          auto_stories
        </span>
      </Link>
      <Link
        href="/players"
        aria-label="선수 검색"
        className="m3-btn m3-btn-icon"
        style={{ width: 44, height: 44 }}
      >
        <span className="mso" style={{ fontSize: 22 }}>search</span>
      </Link>

      {myTeam ? (
        <span
          className="m3-chip m3-chip-sm"
          style={{
            background: 'var(--md-sys-color-primary-container)',
            color: 'var(--md-sys-color-on-primary-container)',
            fontWeight: 700,
            height: 32,
            padding: '0 10px',
          }}
          aria-label={`마이팀: ${TEAMS[myTeam].name}`}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 99,
              background: TEAMS[myTeam].primaryColor,
            }}
          />
          {TEAMS[myTeam].shortName}
        </span>
      ) : null}

      <button
        type="button"
        aria-label="설정"
        onClick={onOpenSettings}
        className="m3-btn m3-btn-icon"
        style={{ width: 44, height: 44 }}
      >
        <span className="mso" style={{ fontSize: 22 }}>settings</span>
      </button>
    </header>
  );
}
