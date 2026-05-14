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
    return roster.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 8);
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
    const exact = roster.find((p) => p.name === q);
    if (exact) {
      handleSelect(exact);
      return;
    }
    const first = matches[0];
    if (first) {
      handleSelect(first);
      return;
    }
    setNotice(`"${q}" — 일치하는 KIA 선수가 없습니다. (전체 ${roster.length}명)`);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="relative flex items-center gap-2">
        <div className="m3-search-bar" style={{ flex: 1 }}>
          <span className="mso" style={{ fontSize: 20 }}>search</span>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setNotice(null);
            }}
            placeholder="기아 선수명 입력 (예: 김도영)"
            autoComplete="off"
            enterKeyHint="search"
            inputMode="search"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="m3-btn m3-btn-icon"
              style={{ width: 32, height: 32 }}
              aria-label="검색어 지우기"
            >
              <span className="mso" style={{ fontSize: 18 }}>close</span>
            </button>
          )}
        </div>
        <button
          type="submit"
          className="m3-btn m3-btn-filled"
          style={{ minWidth: 72 }}
          aria-label="검색"
        >
          검색
        </button>

        {matches.length > 0 && (
          <ul
            style={{
              position: 'absolute',
              zIndex: 20,
              left: 0,
              right: 80,
              top: '100%',
              marginTop: 4,
              background: 'var(--md-sys-color-surface-container-high)',
              border: '1px solid var(--md-sys-color-outline-variant)',
              borderRadius: 'var(--md-sys-shape-corner-medium)',
              maxHeight: 280,
              overflow: 'auto',
              boxShadow: 'var(--md-sys-elevation-2)',
              listStyle: 'none',
              padding: 4,
              margin: 0,
            }}
          >
            {matches.map((p, idx) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(p)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 12px',
                    minHeight: 44,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 8,
                    background: idx === 0 ? 'var(--md-sys-color-surface-container-highest)' : 'transparent',
                    color: 'var(--md-sys-color-on-surface)',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                  }}
                >
                  <span>
                    {p.name}
                    {idx === 0 && (
                      <span
                        className="tabular"
                        style={{
                          marginLeft: 8,
                          fontSize: 10,
                          fontWeight: 700,
                          color: 'var(--md-sys-color-primary)',
                        }}
                      >
                        ↵ 엔터
                      </span>
                    )}
                  </span>
                  <span className="tabular" style={{ fontSize: 12, color: 'var(--md-sys-color-on-surface-variant)' }}>
                    {p.position}
                    {p.uniformNumber ? ` · #${p.uniformNumber}` : ''}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {notice && (
        <p
          role="alert"
          style={{
            margin: 0,
            padding: '8px 12px',
            borderRadius: 8,
            background: 'var(--md-sys-color-error-container)',
            color: 'var(--md-sys-color-on-error-container)',
            fontSize: 12,
          }}
        >
          {notice}
        </p>
      )}

      {recent.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: 0.5, color: 'var(--md-sys-color-on-surface-variant)', textTransform: 'uppercase' }}>
            최근 사용
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {recent.map((p, i) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelect(p)}
                className={`m3-chip m3-chip-sm ${i === 0 ? '' : 'm3-chip-outline'}`}
                style={{ cursor: 'pointer' }}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </form>
  );
}
