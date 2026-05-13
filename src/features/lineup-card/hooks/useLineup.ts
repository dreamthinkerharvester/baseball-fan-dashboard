// SWR hook — 마이팀 라인업. pending(미확정) 상태도 정상 응답이라 error로 보지 않음.

'use client';

import useSWR from 'swr';

import { fetcher } from '@/lib/api-client';

import type { Lineup, TeamCode } from '@/types';

export interface UseLineup {
  data: Lineup | undefined;
  isLoading: boolean;
  error: Error | undefined;
  refresh: () => void;
}

export function useLineup(team: TeamCode | null, date?: string): UseLineup {
  const params = date ? `?date=${date}` : '';
  const key = team ? `/api/lineup/${team}${params}` : null;
  const { data, error, isLoading, mutate } = useSWR<Lineup>(key, fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 5 * 60_000, // 5분 (라인업 갱신 잦음)
  });
  return {
    data,
    error,
    isLoading,
    refresh: () => {
      void mutate();
    },
  };
}
