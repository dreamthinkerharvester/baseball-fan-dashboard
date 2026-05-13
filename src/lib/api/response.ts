// Design Ref: §4.1 — Cache-Control 헤더 + JSON Response 헬퍼.

import { NextResponse } from 'next/server';

import type { ApiResponse } from '@/types';

export interface JsonResponseOptions {
  status?: number;
  /** Edge cache 유지 시간 (s-maxage). 0이면 no-cache. */
  cacheSeconds?: number;
  /** 클라이언트 캐시 (max-age). 보통 0. */
  clientCacheSeconds?: number;
  /** s-maxage 동안 + N초간 stale 허용 (stale-while-revalidate). */
  swrSeconds?: number;
}

export function jsonResponse<T>(
  body: ApiResponse<T>,
  opts: JsonResponseOptions = {},
): NextResponse<ApiResponse<T>> {
  const { status = 200, cacheSeconds = 0, clientCacheSeconds = 0, swrSeconds } = opts;
  const cc = cacheSeconds === 0
    ? `no-store`
    : [
        `public`,
        `max-age=${clientCacheSeconds}`,
        `s-maxage=${cacheSeconds}`,
        ...(swrSeconds != null ? [`stale-while-revalidate=${swrSeconds}`] : []),
      ].join(', ');

  const res = NextResponse.json(body, { status });
  res.headers.set('Cache-Control', cc);
  res.headers.set('X-Robots-Tag', 'noindex'); // API 응답은 검색 인덱싱 차단
  return res;
}
