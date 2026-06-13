// Phase 1.5 — Player search filter tests.
// Plan SC-1, SC-2: 키워드 + 팀/포지션 필터 AND 조합 동작.

import { describe, expect, it } from 'vitest';

import {
  filterPlayers,
  formatKeyStat,
  normalizeQuery,
} from '@/services/players-search';

import type {
  BatterSeasonStat,
  PitcherSeasonStat,
  Player,
} from '@/types';

const PLAYERS: Player[] = [
  { id: '1', name: '손주영', teamCode: 'LG', position: 'P', isPitcher: true },
  { id: '2', name: '박해민', teamCode: 'LG', position: 'CF', isPitcher: false },
  { id: '3', name: '김도영', teamCode: 'KIA', position: '3B', isPitcher: false },
  { id: '4', name: '강백호', teamCode: 'KT', position: '1B', isPitcher: false },
  { id: '5', name: '고영표', teamCode: 'KT', position: 'P', isPitcher: true },
];

describe('normalizeQuery', () => {
  it('NFC + lowercase + trim', () => {
    expect(normalizeQuery('  Park ')).toBe('park');
    expect(normalizeQuery('박해민')).toBe('박해민');
    expect(normalizeQuery('')).toBe('');
  });
});

describe('filterPlayers', () => {
  it('returns all when filters are empty', () => {
    expect(filterPlayers(PLAYERS, { q: '', team: null, position: null })).toHaveLength(5);
  });

  it('matches by team', () => {
    const r = filterPlayers(PLAYERS, { q: '', team: 'LG', position: null });
    expect(r.map((p) => p.id)).toEqual(['1', '2']);
  });

  it('matches by position', () => {
    const r = filterPlayers(PLAYERS, { q: '', team: null, position: 'P' });
    expect(r.map((p) => p.id).sort()).toEqual(['1', '5']);
  });

  it('matches by partial name (한글)', () => {
    const r = filterPlayers(PLAYERS, { q: '영', team: null, position: null });
    // 손주영, 김도영, 고영표 → 3건
    expect(r).toHaveLength(3);
  });

  it('AND of all three filters', () => {
    const r = filterPlayers(PLAYERS, { q: '영', team: 'KT', position: 'P' });
    expect(r.map((p) => p.id)).toEqual(['5']);
  });

  it('returns empty when no match', () => {
    const r = filterPlayers(PLAYERS, { q: '없는이름', team: null, position: null });
    expect(r).toEqual([]);
  });
});

describe('formatKeyStat', () => {
  it('returns null when season is null', () => {
    expect(formatKeyStat(PLAYERS[0]!, null)).toBeNull();
  });

  it('formats pitcher ERA with 2 decimals', () => {
    const stat: PitcherSeasonStat = {
      playerId: '1',
      season: 2026,
      games: 8,
      ip: 48.2,
      era: 3.123,
      fip: 3.0,
      whip: 1.18,
      k9: 8.4,
      bb9: 2.1,
      war: null,
      babip: null,
      kPct: null,
      bbPct: null,
      updatedAt: '2026-05-09',
    };
    expect(formatKeyStat(PLAYERS[0]!, stat)).toBe('ERA 3.12');
  });

  it('formats batter OPS with leading dot (KBO 관행)', () => {
    const stat: BatterSeasonStat = {
      playerId: '2',
      season: 2026,
      games: 40,
      ab: 150,
      hits: 47,
      hr: 5,
      rbi: 22,
      avg: 0.313,
      obp: 0.388,
      slg: 0.473,
      ops: 0.861,
      wrcPlus: 130,
      woba: null,
      war: null,
      babip: null,
      kPct: null,
      bbPct: null,
      updatedAt: '2026-05-09',
    };
    expect(formatKeyStat(PLAYERS[1]!, stat)).toBe('OPS .861');
  });

  it('handles OPS >= 1.0 without leading-zero strip', () => {
    const stat: BatterSeasonStat = {
      playerId: '3',
      season: 2026,
      games: 40,
      ab: 150,
      hits: 60,
      hr: 12,
      rbi: 35,
      avg: 0.4,
      obp: 0.45,
      slg: 0.65,
      ops: 1.024,
      wrcPlus: 180,
      woba: null,
      war: null,
      babip: null,
      kPct: null,
      bbPct: null,
      updatedAt: '2026-05-09',
    };
    expect(formatKeyStat(PLAYERS[2]!, stat)).toBe('OPS 1.024');
  });
});
