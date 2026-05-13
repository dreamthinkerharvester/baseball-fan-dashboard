import type { AxiosInstance, AxiosError } from 'axios';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchHtml, fetchSequential, summarizeError } from '../../scripts/crawler/http';

class AxiosErr extends Error {
  isAxiosError = true;
  response?: { status: number };
  code?: string;
  constructor(message: string, opts: { status?: number; code?: string } = {}) {
    super(message);
    if (opts.status != null) this.response = { status: opts.status };
    if (opts.code) this.code = opts.code;
  }
}
// Make axios.isAxiosError(err) recognize our class
import axios from 'axios';
vi.spyOn(axios, 'isAxiosError').mockImplementation(
  (val: unknown): val is AxiosError =>
    !!val && typeof val === 'object' && 'isAxiosError' in (val as Record<string, unknown>),
);

function makeMockAxios(behaviors: Array<{ ok: true; data: string } | { ok: false; err: Error }>): {
  instance: AxiosInstance;
  callCount: () => number;
} {
  let i = 0;
  const get = vi.fn(async () => {
    const b = behaviors[i++];
    if (!b) throw new Error('mock exhausted');
    if (b.ok) return { data: b.data, status: 200 };
    throw b.err;
  });
  return { instance: { get } as unknown as AxiosInstance, callCount: () => i };
}

describe('summarizeError', () => {
  it('detects 429 as RATE_LIMITED', () => {
    expect(summarizeError(new AxiosErr('rate limited', { status: 429 })).code).toBe('RATE_LIMITED');
  });
  it('detects 403 as BLOCKED', () => {
    expect(summarizeError(new AxiosErr('forbidden', { status: 403 })).code).toBe('BLOCKED');
  });
  it('detects timeout', () => {
    expect(summarizeError(new AxiosErr('timeout', { code: 'ECONNABORTED' })).code).toBe('TIMEOUT');
  });
  it('detects generic HTTP_ERROR', () => {
    expect(summarizeError(new AxiosErr('boom', { status: 500 })).code).toBe('HTTP_ERROR');
  });
  it('detects NETWORK without status', () => {
    expect(summarizeError(new AxiosErr('eof')).code).toBe('NETWORK');
  });
  it('falls back to UNKNOWN for plain Error', () => {
    expect(summarizeError(new Error('plain')).code).toBe('UNKNOWN');
  });
  it('falls back to UNKNOWN for non-error', () => {
    expect(summarizeError('string err').code).toBe('UNKNOWN');
  });
});

describe('fetchHtml: success path', () => {
  let now = 1_000_000;
  beforeEach(() => {
    now = 1_000_000;
  });

  it('returns success on first try', async () => {
    const { instance } = makeMockAxios([{ ok: true, data: '<html>ok</html>' }]);
    const r = await fetchHtml(
      { url: 'https://example.com', source: 'kbo' },
      { axiosInstance: instance, sleep: vi.fn(), now: () => (now += 50) },
    );
    expect(r.status).toBe('success');
    expect(r.attempts).toBe(1);
    expect(r.body).toBe('<html>ok</html>');
    expect(r.durationMs).toBeGreaterThanOrEqual(0);
  });
});

describe('fetchHtml: retry path', () => {
  it('retries up to retryMax then succeeds', async () => {
    const { instance } = makeMockAxios([
      { ok: false, err: new AxiosErr('boom1') },
      { ok: false, err: new AxiosErr('boom2') },
      { ok: true, data: '<html/>' },
    ]);
    const sleep = vi.fn(async () => {});
    const r = await fetchHtml(
      { url: 'https://x', source: 'kbo', retryMax: 5, retryDelayMs: 10 },
      { axiosInstance: instance, sleep },
    );
    expect(r.status).toBe('success');
    expect(r.attempts).toBe(3);
    // 1차 실패 후 sleep, 2차 실패 후 sleep → 2회 호출
    expect(sleep).toHaveBeenCalledTimes(2);
  });

  it('gives up after retryMax with NETWORK error', async () => {
    const { instance } = makeMockAxios([
      { ok: false, err: new AxiosErr('boom') },
      { ok: false, err: new AxiosErr('boom') },
      { ok: false, err: new AxiosErr('boom') },
    ]);
    const r = await fetchHtml(
      { url: 'https://x', source: 'kbo', retryMax: 3, retryDelayMs: 10 },
      { axiosInstance: instance, sleep: vi.fn(async () => {}) },
    );
    expect(r.status).toBe('failed');
    expect(r.attempts).toBe(3);
    expect(r.errorCode).toBe('NETWORK');
  });

  it('aborts immediately on 429 (no retry)', async () => {
    const { instance } = makeMockAxios([
      { ok: false, err: new AxiosErr('rate', { status: 429 }) },
    ]);
    const sleep = vi.fn(async () => {});
    const r = await fetchHtml(
      { url: 'https://x', source: 'kbo', retryMax: 5 },
      { axiosInstance: instance, sleep },
    );
    expect(r.status).toBe('failed');
    expect(r.attempts).toBe(1);
    expect(r.errorCode).toBe('RATE_LIMITED');
    expect(sleep).not.toHaveBeenCalled();
  });

  it('aborts immediately on 403 (blocked)', async () => {
    const { instance } = makeMockAxios([
      { ok: false, err: new AxiosErr('forbidden', { status: 403 }) },
    ]);
    const r = await fetchHtml(
      { url: 'https://x', source: 'kbo', retryMax: 5 },
      { axiosInstance: instance, sleep: vi.fn(async () => {}) },
    );
    expect(r.status).toBe('failed');
    expect(r.errorCode).toBe('BLOCKED');
  });

  it('respects abort signal', async () => {
    const ctrl = new AbortController();
    ctrl.abort();
    const { instance } = makeMockAxios([{ ok: true, data: 'x' }]);
    const r = await fetchHtml(
      { url: 'https://x', source: 'kbo', signal: ctrl.signal },
      { axiosInstance: instance, sleep: vi.fn(async () => {}) },
    );
    expect(r.status).toBe('failed');
    expect(r.errorCode).toBe('ABORTED');
  });
});

describe('fetchSequential', () => {
  it('processes URLs sequentially with delay between', async () => {
    const { instance } = makeMockAxios([
      { ok: true, data: 'a' },
      { ok: true, data: 'b' },
      { ok: true, data: 'c' },
    ]);
    const sleep = vi.fn(async () => {});
    const results = await fetchSequential(
      [
        { url: 'https://x/1', source: 'kbo' },
        { url: 'https://x/2', source: 'kbo' },
        { url: 'https://x/3', source: 'kbo' },
      ],
      { axiosInstance: instance, sleep },
    );
    expect(results.map((r) => r.body)).toEqual(['a', 'b', 'c']);
    // 3개 요청 사이 2회 inter-request sleep
    expect(sleep).toHaveBeenCalledTimes(2);
  });
});
