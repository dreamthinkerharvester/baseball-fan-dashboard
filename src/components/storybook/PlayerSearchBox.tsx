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
  const [notice, setNotice] = useState<string | null>(null);

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
    setNotice(null);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q.length === 0) {
      setNotice('선수 이름을 입력해주세요.');
      return;
    }
    // 1) Exact match (정확히 일치)
    const exact = roster.find((p) => p.name === q);
    if (exact) {
      handleSelect(exact);
      return;
    }
    // 2) First partial match (첫 부분일치)
    if (matches.length > 0) {
      handleSelect(matches[0]);
      return;
    }
    setNotice(`"${q}" — 일치하는 KIA 선수가 없습니다. (전체 ${roster.length}명)`);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="relative">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setNotice(null);
            }}
            placeholder="기아 선수명 입력 후 ↵ 또는 → 클릭"
            className="flex-1 min-w-0 bg-[#1a1a2e] border border-white/10 rounded-md px-4 py-3 text-base focus:outline-none focus:border-[#E63946]"
            autoComplete="off"
            enterKeyHint="search"
            inputMode="search"
          />
          <button
            type="submit"
            className="shrink-0 px-4 py-3 bg-[#E63946] text-white rounded-md font-medium hover:bg-[#d62836] active:bg-[#c0202f] min-h-[44px] min-w-[60px]"
            aria-label="검색"
          >
            검색
          </button>
        </div>
        {matches.length > 0 && (
          <ul className="absolute z-20 left-0 right-0 mt-1 bg-[#16213e] border border-white/10 rounded-md max-h-64 overflow-auto">
            {matches.map((p, idx) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(p)}
                  className={`w-full text-left px-4 py-3 flex justify-between min-h-[44px] ${
                    idx === 0 ? 'bg-white/[0.06]' : ''
                  } hover:bg-white/5 active:bg-white/10`}
                >
                  <span>
                    {p.name}
                    {idx === 0 && (
                      <span className="ml-2 text-[10px] text-[#E63946] font-bold">↵ 엔터</span>
                    )}
                  </span>
                  <span className="text-white/50 text-sm">
                    {p.position}{p.uniformNumber ? ` · #${p.uniformNumber}` : ''}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {notice && (
        <p className="text-xs text-yellow-300" role="alert">
          {notice}
        </p>
      )}

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
    </form>
  );
}
