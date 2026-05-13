// Design Ref: §6.4, §7 — HTTP fetch with retry / delay / User-Agent / robots etiquette.
// Plan R1 (Score 20) — 가장 위험한 가정. 본 모듈에 모든 회복탄력성 패턴 집중.

import axios, { AxiosError, type AxiosInstance } from 'axios';

import { CRAWL_DEFAULTS } from '@/lib/constants';

export interface FetchOptions {
  url: string;
  source: 'kbo' | 'statiz';
  /** 추가 쿼리 파라미터. */
  params?: Record<string, string | number>;
  /** 재시도 최대 횟수. .env CRAWL_RETRY_MAX > default. */
  retryMax?: number;
  /** 요청 사이 딜레이 ms. .env CRAWL_RETRY_DELAY_MS > default. */
  retryDelayMs?: number;
  /** axios timeout ms. */
  timeoutMs?: number;
  /** 1회성 throw 대신 결과 객체 반환 (테스트/배치에서 선호). */
  signal?: AbortSignal;
}

export interface FetchResult {
  status: 'success' | 'failed';
  url: string;
  source: 'kbo' | 'statiz';
  attempts: number;
  durationMs: number;
  /** 성공 시 HTML body. */
  body?: string;
  /** 실패 시 마지막 에러 요약. */
  errorMessage?: string;
  errorCode?: string;
}

export type Sleep = (ms: number) => Promise<void>;

const defaultSleep: Sleep = (ms) =>
  new Promise<void>((resolve) => {
    if (ms <= 0) {
      resolve();
      return;
    }
    setTimeout(resolve, ms);
  });

export interface HttpClientDeps {
  axiosInstance?: AxiosInstance;
  sleep?: Sleep;
  now?: () => number;
}

/**
 * 단일 URL fetch with retry/backoff. 외부 의존성(axios/sleep/now) 주입 가능 → 단위 테스트.
 *
 * 재시도 전략:
 *   - 1차 실패 후 retryDelayMs 후 재시도
 *   - 2차 실패 후 retryDelayMs * 2 후 재시도 (linear backoff)
 *   - retryMax 도달 시 status='failed' 반환 (throw 안 함)
 */
export async function fetchHtml(
  options: FetchOptions,
  deps: HttpClientDeps = {},
): Promise<FetchResult> {
  const ax = deps.axiosInstance ?? axios.create();
  const sleep = deps.sleep ?? defaultSleep;
  const now = deps.now ?? Date.now;
  const start = now();

  const retryMax = options.retryMax ?? toIntEnv('CRAWL_RETRY_MAX', CRAWL_DEFAULTS.retryMax);
  const baseDelay =
    options.retryDelayMs ?? toIntEnv('CRAWL_RETRY_DELAY_MS', CRAWL_DEFAULTS.retryDelayMs);
  const timeoutMs = options.timeoutMs ?? 15_000;

  const userAgent =
    options.source === 'kbo'
      ? process.env.KBO_USER_AGENT ?? CRAWL_DEFAULTS.userAgent
      : process.env.STATIZ_USER_AGENT ?? CRAWL_DEFAULTS.userAgent;

  let attempts = 0;
  let lastErrorMessage: string | undefined;
  let lastErrorCode: string | undefined;

  while (attempts < retryMax) {
    if (options.signal?.aborted) {
      return {
        status: 'failed',
        url: options.url,
        source: options.source,
        attempts,
        durationMs: now() - start,
        errorMessage: 'aborted',
        errorCode: 'ABORTED',
      };
    }

    attempts += 1;
    try {
      const res = await ax.get<string>(options.url, {
        params: options.params,
        timeout: timeoutMs,
        headers: {
          'User-Agent': userAgent,
          Accept: 'text/html,application/xhtml+xml',
          'Accept-Language': 'ko-KR,ko;q=0.9',
        },
        responseType: 'text',
        // 다음 retry 전 backoff에 신호 전달
        signal: options.signal,
        validateStatus: (s) => s >= 200 && s < 400,
      });
      if (typeof res.data !== 'string') {
        throw new Error(`Expected string body, got ${typeof res.data}`);
      }
      return {
        status: 'success',
        url: options.url,
        source: options.source,
        attempts,
        durationMs: now() - start,
        body: res.data,
      };
    } catch (e: unknown) {
      const summary = summarizeError(e);
      lastErrorMessage = summary.message;
      lastErrorCode = summary.code;
      // 차단(403/429) 감지 시 즉시 실패 (재시도 무의미 + 추가 차단 위험)
      if (summary.code === 'RATE_LIMITED' || summary.code === 'BLOCKED') {
        return {
          status: 'failed',
          url: options.url,
          source: options.source,
          attempts,
          durationMs: now() - start,
          errorMessage: summary.message,
          errorCode: summary.code,
        };
      }
      if (attempts >= retryMax) break;
      await sleep(baseDelay * attempts);
    }
  }

  return {
    status: 'failed',
    url: options.url,
    source: options.source,
    attempts,
    durationMs: now() - start,
    errorMessage: lastErrorMessage ?? 'unknown error',
    errorCode: lastErrorCode ?? 'UNKNOWN',
  };
}

/** 여러 URL을 순차 + delay로 fetch. KBO/statiz가 병렬 요청에 민감하므로 의도적 직렬 처리. */
export async function fetchSequential(
  list: FetchOptions[],
  deps: HttpClientDeps = {},
): Promise<FetchResult[]> {
  const sleep = deps.sleep ?? defaultSleep;
  const interRequestDelay = toIntEnv('CRAWL_RETRY_DELAY_MS', CRAWL_DEFAULTS.retryDelayMs);
  const results: FetchResult[] = [];
  for (let i = 0; i < list.length; i += 1) {
    const opts = list[i];
    if (!opts) continue;
    results.push(await fetchHtml(opts, deps));
    if (i < list.length - 1) {
      await sleep(interRequestDelay);
    }
  }
  return results;
}

// ────────────────────────────────────────────────────────────────────────────
// internal
// ────────────────────────────────────────────────────────────────────────────
function toIntEnv(key: string, fallback: number): number {
  const raw = process.env[key];
  if (raw == null) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : fallback;
}

interface ErrorSummary {
  message: string;
  code: 'RATE_LIMITED' | 'BLOCKED' | 'TIMEOUT' | 'NETWORK' | 'HTTP_ERROR' | 'UNKNOWN';
}

export function summarizeError(e: unknown): ErrorSummary {
  if (axios.isAxiosError(e)) {
    const ax = e as AxiosError;
    const status = ax.response?.status;
    if (status === 429) return { message: `429 Too Many Requests`, code: 'RATE_LIMITED' };
    if (status === 403) return { message: `403 Forbidden`, code: 'BLOCKED' };
    if (status != null) return { message: `HTTP ${status}`, code: 'HTTP_ERROR' };
    if (ax.code === 'ECONNABORTED' || ax.code === 'ETIMEDOUT') {
      return { message: 'timeout', code: 'TIMEOUT' };
    }
    return { message: ax.message, code: 'NETWORK' };
  }
  if (e instanceof Error) {
    return { message: e.message, code: 'UNKNOWN' };
  }
  return { message: String(e), code: 'UNKNOWN' };
}
