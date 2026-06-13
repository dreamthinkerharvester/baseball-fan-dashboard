// SWR hook — Myth-Buster 갭 스코어 (Design Ref: kia-fan-service §4.2).
// 503/STALE_CACHE(집계 중)는 에러가 아닌 "데이터 준비 안 됨" 상태로 구분.

'use client';

import useSWR from 'swr';

import { ApiClientError, fetcher } from '@/lib/api-client';

import type { SaberRankings } from '@/types';

export interface UseSaberRankings {
  data: SaberRankings | undefined;
  isLoading: boolean;
  /** 파이프라인 미실행 등 — "집계 중" UI. */
  notReady: boolean;
  error: Error | undefined;
}

export function useSaberRankings(): UseSaberRankings {
  const { data, error, isLoading } = useSWR<SaberRankings>('/api/saber-rankings', fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 3_600_000,
  });
  const notReady =
    error instanceof ApiClientError && (error.status === 503 || error.code === 'STALE_CACHE');
  return { data, isLoading, notReady, error: notReady ? undefined : error };
}
