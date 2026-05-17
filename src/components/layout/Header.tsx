// Magu Magu HUD header — 마구마구/메이플 풍 게임 HUD.
// Mobile-first 56px. 마이팀 엠블럼 + 브랜드 + 검색/스토리북 + 새로고침/설정.

'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';

import { TEAMS } from '@/lib/constants';
import { teamEmblem } from '@/lib/assets-magu';
import { useGlobalRefresh } from '@/lib/refresh';
import { getMyTeam } from '@/lib/storage';

import type { TeamCode } from '@/types';

export interface HeaderProps {
  onOpenSettings?: () => void;
}

export function Header({ onOpenSettings }: HeaderProps) {
  const [myTeam, setMyTeam] = useState<TeamCode | null>(null);
  const { refresh, isRefreshing, lastRefreshAt } = useGlobalRefresh();

  useEffect(() => {
    setMyTeam(getMyTeam());
  }, []);

  const refreshLabel = isRefreshing
    ? '최신 데이터 갱신 중'
    : lastRefreshAt
      ? `갱신 (마지막 ${formatTimeShort(lastRefreshAt)})`
      : '최신 데이터 갱신';

  const logoStyle: React.CSSProperties = {
    width: 40,
    height: 40,
    borderRadius: 10,
    flexShrink: 0,
    boxShadow: 'var(--magu-shadow-out)',
    backgroundImage: myTeam
      ? `url(${teamEmblem(myTeam)}), linear-gradient(160deg, #1A2440, #0F1730)`
      : 'linear-gradient(160deg, var(--magu-kia-red), var(--magu-kia-red-deep))',
    backgroundSize: 'contain, cover',
    backgroundRepeat: 'no-repeat, no-repeat',
    backgroundPosition: 'center, center',
    imageRendering: 'pixelated',
  };

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 8px',
        background:
          'linear-gradient(180deg, rgba(15,20,33,.92), rgba(15,20,33,.7))',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderBottom: '1px solid rgba(255,255,255,.05)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
        <div aria-hidden style={logoStyle} />
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1, minWidth: 0 }}>
          <h1
            className="font-brand-magu"
            style={{
              margin: 0,
              fontSize: 16,
              color: 'var(--magu-text-1)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            마구마구 카드
          </h1>
          <span
            style={{
              marginTop: 3,
              fontSize: 9,
              letterSpacing: 0.5,
              color: 'var(--magu-gold)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {myTeam ? `${TEAMS[myTeam].shortName} · 2026 시즌` : '2026 시즌'}
          </span>
        </div>
      </div>

      <Link
        href="/players"
        aria-label="선수 검색"
        style={hudBtnStyle}
      >
        <span className="mso" style={{ fontSize: 18, color: 'var(--magu-text-1)' }}>search</span>
      </Link>
      <Link
        href="/storybook"
        aria-label="스토리북"
        className="hidden sm:inline-flex"
        style={hudBtnStyle}
      >
        <span className="mso filled" style={{ fontSize: 18, color: 'var(--magu-gold)' }}>auto_stories</span>
      </Link>

      <button
        type="button"
        aria-label={refreshLabel}
        title={refreshLabel}
        onClick={() => { void refresh(); }}
        disabled={isRefreshing}
        style={{ ...hudBtnStyle, opacity: isRefreshing ? 0.6 : 1 }}
      >
        <span
          className="mso"
          style={{
            fontSize: 18,
            color: 'var(--magu-text-1)',
            animation: isRefreshing ? 'spin 800ms linear infinite' : undefined,
            display: 'inline-block',
          }}
        >
          refresh
        </span>
      </button>
      <button
        type="button"
        aria-label="설정"
        onClick={onOpenSettings}
        style={hudBtnStyle}
      >
        <span className="mso" style={{ fontSize: 18, color: 'var(--magu-text-1)' }}>settings</span>
      </button>
    </header>
  );
}

const hudBtnStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 8,
  background: 'linear-gradient(180deg, var(--magu-panel-light), var(--magu-panel))',
  border: 'none',
  cursor: 'pointer',
  flexShrink: 0,
  display: 'grid',
  placeItems: 'center',
  boxShadow: 'var(--magu-shadow-out)',
  textDecoration: 'none',
};

function formatTimeShort(ts: number): string {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}
