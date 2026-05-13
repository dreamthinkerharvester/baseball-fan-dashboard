'use client';

import { useEffect, useMemo, useState } from 'react';

interface RosterPlayer {
  id: string;
  name: string;
  position: string;
  isPitcher: boolean;
  uniformNumber?: number;
}

interface Props {
  roster: RosterPlayer[];
  onSelect: (id: string) => void;
}

const RECENT_KEY = 'storybook:recent-players';
const MAX_RECENT = 5;

export function PlayerSearchBox({ roster, onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [recent, setRecent] = useState<RosterPlayer[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      if (raw) setRecent(JSON.parse(raw) as RosterPlayer[]);
    } catch {
      // ignore
    }
  }, []);

  const matches = useMemo(() => {
    if (query.trim().length === 0) return [];
    const q = query.trim().toLowerCase();
    return roster
      .filter((p) => p.name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, roster]);

  const handleSelect = (p: RosterPlayer) => {
    onSelect(p.id);
    setQuery(p.name);
    setRecent((prev) => {
      const next = [p, ...prev.filter((x) => x.id !== p.id)].slice(0, MAX_RECENT);
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="기아 선수명 입력 (예: 김도영)"
          className="w-full bg-[#1a1a2e] border border-white/10 rounded-md px-4 py-3 text-base focus:outline-none focus:border-[#E63946]"
          autoComplete="off"
        />
        {matches.length > 0 && (
          <ul className="absolute z-20 left-0 right-0 mt-1 bg-[#16213e] border border-white/10 rounded-md max-h-64 overflow-auto">
            {matches.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(p)}
                  className="w-full text-left px-4 py-2 hover:bg-white/5 flex justify-between"
                >
                  <span>{p.name}</span>
                  <span className="text-white/50 text-sm">
                    {p.position}{p.uniformNumber ? ` · #${p.uniformNumber}` : ''}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {recent.length > 0 && (
        <div className="text-xs sm:text-sm text-white/60 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="shrink-0">최근 사용:</span>
          {recent.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleSelect(p)}
              className="underline hover:text-white min-h-[32px] px-1"
            >
              {p.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
