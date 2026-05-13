// SWR hook — Standings.

'use client';

import useSWR from 'swr';

import { fetcher } from '@/lib/api-client';

import type { StandingsRow } from '@/types';

export interface UseStandings {
  data: { rows: StandingsRow[] } | undefined;
  isLoading: boolean;
  error: Error | undefined;
  refresh: () => void;
}

export function useStandings(): UseStandings {
  const { data, error, isLoading, mutate } = useSWR<{ rows: StandingsRow[] }>(
    '/api/standings',
    fetcher,
    { revalidateOnFocus: false, refreshInterval: 600_000 }, // 10분 자동 재검증
  );
  return {
    data,
    error,
    isLoading,
    refresh: () => {
      void mutate();
    },
  };
}
