// Phase 1.5 — Search page main panel. URL state ↔ filters 동기화.

'use client';

import { useCallback, useState } from 'react';

import { useRouter } from 'next/navigation';

import { EMPTY_FILTERS } from '@/types';

import { FilterChips } from './FilterChips';
import { usePlayerSearch } from './hooks/usePlayerSearch';
import { ResultsList } from './ResultsList';
import { SearchInput } from './SearchInput';

import type { SearchFilters } from '@/types';

export function PlayerSearchPanel() {
  const router = useRouter();
  const [filters, setFilters] = useState<SearchFilters>(EMPTY_FILTERS);

  const { results, isLoading } = usePlayerSearch(filters);

  const handleQueryChange = useCallback((q: string) => {
    setFilters((prev) => ({ ...prev, q }));
  }, []);

  const handleSelect = useCallback(
    (id: string) => {
      router.push(`/players/${id}`);
    },
    [router],
  );

  return (
    <section className="flex flex-col gap-4 px-4 py-4">
      <h2
        className="font-brand"
        style={{
          margin: 0,
          fontSize: 26,
          fontWeight: 700,
          letterSpacing: -0.5,
          color: 'var(--md-sys-color-on-surface)',
        }}
      >
        선수 검색
      </h2>
      <SearchInput value={filters.q} onChange={handleQueryChange} />
      <FilterChips filters={filters} onChange={setFilters} />
      <ResultsList
        results={results}
        isLoading={isLoading}
        onSelect={handleSelect}
      />
    </section>
  );
}
