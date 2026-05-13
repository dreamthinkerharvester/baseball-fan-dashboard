import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-screen-md flex-col items-center justify-center gap-4 px-4 py-12 text-center">
      <h1 className="text-display">404</h1>
      <p className="text-body text-text-muted">페이지를 찾을 수 없습니다.</p>
      <Link
        href="/"
        className="rounded-button bg-grade-elite px-4 py-2 text-body font-semibold text-text-primary hover:opacity-90"
      >
        홈으로
      </Link>
    </main>
  );
}
