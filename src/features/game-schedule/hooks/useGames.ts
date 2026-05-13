// SWR hook — Games schedule by range.

'use client';

import useSWR from 'swr';

import { fetcher } from '@/lib/api-client';

import type { Game } from '@/types';

export type ScheduleRange = 'day' | 'week' | 'month';

export function useGames(range: ScheduleRange = 'day', date?: string) {
  const params = new URLSearchParams({ range });
  if (date) params.set('date', date);
  const key = `/api/games?${params.toString()}`;
  const { data, error, isLoading, mutate } = useSWR<Game[]>(key, fetcher, {
    revalidateOnFocus: false,
    refreshInterval: range === 'day' ? 600_000 : 3_600_000,
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
