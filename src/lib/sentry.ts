// Sentry stub. SENTRY_DSN 미설정 시 no-op (개발 환경 안전).
// 실제 프로덕션 통합은 `@sentry/nextjs` 추가 후 sentry.client.config.ts / sentry.server.config.ts 작성.

interface CaptureOptions {
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
}

export function captureException(error: unknown, opts?: CaptureOptions): void {
  // production with SENTRY_DSN: forward to Sentry SDK
  // 현재는 console로 폴백
  if (typeof process !== 'undefined' && process.env.SENTRY_DSN) {
    // 실제 SDK 통합 시 여기에 Sentry.captureException(error, opts) 호출
    console.error('[sentry-stub]', error, opts);
    return;
  }
  if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
    console.error('[sentry-skip]', error, opts);
  }
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
  if (typeof process !== 'undefined' && process.env.SENTRY_DSN) {
    console.log(`[sentry-stub:${level}]`, message);
    return;
  }
  if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
    console.log(`[sentry-skip:${level}]`, message);
  }
}
