// Phase 1.5 — SWR hook for player search.

'use client';

import useSWR from 'swr';

import { fetcher } from '@/lib/api-client';

import type { PlayerSearchResult, SearchFilters } from '@/types';

function buildKey(filters: SearchFilters): string | null {
  const sp = new URLSearchParams();
  if (filters.q) sp.set('q', filters.q);
  if (filters.team) sp.set('team', filters.team);
  if (filters.position) sp.set('position', filters.position);
  // 모든 필터가 비어있어도 결과는 보여줌 (전체 선수 30명 한도).
  return `/api/players/search?${sp.toString()}`;
}

export function usePlayerSearch(filters: SearchFilters) {
  const key = buildKey(filters);
  const { data, error, isLoading } = useSWR<PlayerSearchResult[]>(key, fetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true, // 키워드 입력 중 깜빡임 방지
  });
  return { results: data ?? [], error, isLoading };
}
