// SWR 글로벌 갱신 헬퍼.
// 헤더 갱신 버튼 + 첫 진입 자동 갱신에서 사용.
//
// 동작:
// - SWR cache에 등록된 모든 `/api/*` 키를 찾아 cache-buster 쿼리(_t=ts)로 직접 fetch.
// - Vercel Edge cache(s-maxage=600)를 우회해 origin에서 최신 데이터 확보.
// - 받은 데이터로 mutate(key, data, {revalidate:false}) 호출해 SWR 캐시 갱신.
// - 실패 시 mutate(key)로 일반 revalidation에 fallback.

'use client';

import { useCallback, useEffect, useState } from 'react';

import { useSWRConfig } from 'swr';

import type { ApiResponse } from '@/types';

interface SWRCacheLike {
  keys?: () => IterableIterator<unknown>;
}

function collectApiKeys(cache: unknown): string[] {
  const c = cache as SWRCacheLike;
  if (typeof c.keys !== 'function') return [];
  const out: string[] = [];
  for (const k of c.keys()) {
    if (typeof k === 'string' && k.startsWith('/api/')) out.push(k);
  }
  return out;
}

export interface GlobalRefreshState {
  refresh: () => Promise<void>;
  isRefreshing: boolean;
  lastRefreshAt: number | null;
}

export function useGlobalRefresh(): GlobalRefreshState {
  const { cache, mutate } = useSWRConfig();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshAt, setLastRefreshAt] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const apiKeys = collectApiKeys(cache);
      const ts = Date.now();
      await Promise.all(
        apiKeys.map(async (key) => {
          try {
            const sep = key.includes('?') ? '&' : '?';
            const bustedUrl = `${key}${sep}_t=${ts}`;
            const res = await fetch(bustedUrl, {
              cache: 'no-store',
              headers: { Accept: 'application/json' },
            });
            const body = (await res.json()) as ApiResponse<unknown>;
            if (body && 'error' in body && body.error) {
              throw new Error(body.error.message);
            }
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            await mutate(key, body.data, { revalidate: false });
          } catch {
            // Fallback: normal revalidation through Edge cache.
            await mutate(key);
          }
        }),
      );
      setLastRefreshAt(Date.now());
    } finally {
      setIsRefreshing(false);
    }
  }, [cache, mutate]);

  return { refresh, isRefreshing, lastRefreshAt };
}

const FIRST_VISIT_KEY = 'bfd:first-visit-refresh-at';
const REFRESH_THROTTLE_MS = 5 * 60 * 1000; // 5분 내 재진입은 스킵

// 페이지 마운트 시 1회 자동 갱신. 5분 throttle (탭 새로고침 폭주 방지).
export function useFirstVisitRefresh(): void {
  const { refresh } = useGlobalRefresh();
  useEffect(() => {
    let cancelled = false;
    let raw: string | null = null;
    try {
      raw = sessionStorage.getItem(FIRST_VISIT_KEY);
    } catch {
      // Safari private mode 등 — sessionStorage 차단 시 무조건 refresh
    }
    const last = raw ? Number(raw) : 0;
    if (Date.now() - last < REFRESH_THROTTLE_MS) return;
    try {
      sessionStorage.setItem(FIRST_VISIT_KEY, String(Date.now()));
    } catch {
      /* noop */
    }
    // SWR 초기 fetch 트리거 후 따라잡도록 약간 지연 — 동일 키에 대해 중복 fetch가 일어나도
    // mutate가 캐시를 덮어쓰므로 결과는 fresh 데이터로 수렴.
    const t = setTimeout(() => {
      if (!cancelled) void refresh();
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [refresh]);
}
