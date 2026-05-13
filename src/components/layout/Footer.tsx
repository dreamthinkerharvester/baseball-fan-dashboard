// Design Ref: §5.4 + §7 — 법적 면책. forbidden-words-allow:disclaimer 마커가 있어 grep CI 통과.

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="mt-12 border-t border-text-dim/20 bg-bg-panel px-4 py-4 text-caption text-text-muted">
      <div className="mx-auto flex max-w-screen-lg flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p>© 2026 KBO 카드 대시보드 · 비상업적 팬 프로젝트</p>
          {/* forbidden-words-allow:disclaimer */}
          <p className="text-text-dim">
            이 서비스는 KBO 공식 서비스가 아니며, 네오위즈/넷마블의 마구마구와 무관한 독립 프로젝트입니다.
          </p>
        </div>
        <nav className="flex gap-3">
          <Link href="/about" className="hover:text-text-primary">
            소개
          </Link>
          <Link href="/grades" className="hover:text-text-primary">
            등급 산출
          </Link>
          <a
            href="https://github.com/baseball-fan-dashboard"
            className="hover:text-text-primary"
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
