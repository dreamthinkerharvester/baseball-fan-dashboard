// Design Ref: §5.4 + §7 — 법적 면책. forbidden-words-allow:disclaimer 마커가 있어 grep CI 통과.

import Link from 'next/link';

export function Footer() {
  return (
    <footer
      style={{
        marginTop: 48,
        borderTop: '1px solid var(--md-sys-color-outline-variant)',
        background: 'var(--md-sys-color-surface-container-low)',
        padding: '16px 16px 32px',
        color: 'var(--md-sys-color-on-surface-variant)',
        fontSize: 11,
      }}
    >
      <div className="mx-auto flex max-w-screen-lg flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
          <p style={{ margin: 0, fontWeight: 500 }}>© 2026 KBO 카드 대시보드 · 비상업적 팬 프로젝트</p>
          {/* forbidden-words-allow:disclaimer */}
          <p style={{ margin: 0, fontSize: 10, color: 'var(--md-sys-color-on-surface-variant)' }}>
            이 서비스는 KBO 공식 서비스가 아니며, 네오위즈/넷마블의 마구마구와 무관한 독립 프로젝트입니다.
          </p>
        </div>
        <nav className="flex gap-2 flex-wrap" aria-label="푸터 메뉴">
          <Link href="/about" className="m3-btn m3-btn-text" style={{ height: 32, padding: '0 12px', fontSize: 12 }}>
            소개
          </Link>
          <Link href="/grades" className="m3-btn m3-btn-text" style={{ height: 32, padding: '0 12px', fontSize: 12 }}>
            등급 산출
          </Link>
          <a
            href="https://github.com/baseball-fan-dashboard"
            className="m3-btn m3-btn-text"
            style={{ height: 32, padding: '0 12px', fontSize: 12 }}
            target="_blank"
            rel="noreferrer noopener"
          >
            GitHub
          </a>
        </nav>
      </div>
    </footer>
  );
}
