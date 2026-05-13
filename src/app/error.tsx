'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    void import('@/lib/sentry').then(({ captureException }) =>
      captureException(error, { tags: { boundary: 'global' } }),
    );
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen max-w-screen-md flex-col items-center justify-center gap-4 px-4 py-12 text-center">
      <h1 className="text-display">잠시 문제가 발생했어요</h1>
      <p className="text-body text-text-muted">
        새로고침 버튼을 눌러주세요. 문제가 계속되면 잠시 후 다시 시도해주세요.
      </p>
      <button
        onClick={reset}
        className="rounded-button bg-grade-elite px-4 py-2 text-body font-semibold text-text-primary hover:opacity-90"
      >
        다시 시도
      </button>
      {error.digest ? (
        <p className="text-caption text-text-dim">참조: {error.digest}</p>
      ) : null}
    </main>
  );
}
