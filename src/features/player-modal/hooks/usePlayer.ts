// SWR hook — 선수 상세 (Season + Career + RecentTen).

'use client';

import useSWR from 'swr';

import { fetcher } from '@/lib/api-client';
import type { PlayerDetailCache } from '@/lib/data/cache';

export function usePlayer(playerId: string | null) {
  const key = playerId ? `/api/player/${playerId}` : null;
  const { data, error, isLoading } = useSWR<PlayerDetailCache>(key, fetcher, {
    revalidateOnFocus: false,
  });
  return { data, error, isLoading };
}
