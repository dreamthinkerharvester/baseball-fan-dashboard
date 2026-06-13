// KIA 타이거즈 HUD header — 게임 HUD 풍 유지, KIA 전용 피벗.
// Design Ref: kia-fan-service §5.1 (FR-02) — KIA 엠블럼 + "현재 N위 · X승 Y패" 한 줄.
// Mobile-first 56px. 검색/스토리북 + 새로고침. (세이버 토글은 module-3에서 추가)

'use client';

import Link from 'next/link';

import { SaberToggle } from '@/features/saber-mode/SaberToggle';
import { teamEmblem } from '@/lib/assets-magu';
import { MY_TEAM, TEAMS } from '@/lib/constants';
import { useGlobalRefresh } from '@/lib/refresh';
import { useStandings } from '@/features/league-standings/hooks/useStandings';

export function Header() {
  const { refresh, isRefreshing, lastRefreshAt } = useGlobalRefresh();
  const { data } = useStandings();
  const kiaRow = data?.rows.find((r) => r.teamCode === MY_TEAM);

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
    backgroundImage: `url(${teamEmblem(MY_TEAM)}), linear-gradient(160deg, var(--magu-kia-red), var(--magu-kia-red-deep))`,
    backgroundSize: 'contain, cover',
    backgroundRepeat: 'no-repeat, no-repeat',
    backgroundPosition: 'center, center',
    imageRendering: 'pixelated',
  };

  // "현재 2위 · 41승 25패" — standings 미로딩 시 시즌 라벨 폴백
  const rankLine = kiaRow
    ? `현재 ${kiaRow.rank}위 · ${kiaRow.wins}승 ${kiaRow.losses}패${kiaRow.draws > 0 ? ` ${kiaRow.draws}무` : ''}`
    : `${TEAMS[MY_TEAM].shortName} · 2026 시즌`;

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
            타이거즈 카드
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
            {rankLine}
          </span>
        </div>
      </div>

      {/* 클래식 스탯 보기 토글 (FR-04 — 상시 노출) */}
      <SaberToggle />

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
