// Phase 0 POC 산출물 — 실 KBO HTML fixture 기반 parser 검증.
// fixture: tests/fixtures/html/kbo-standings.html (2026-05-09 캡처)

import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { parseGameCell, parseSchedule, parseStandings } from '../../scripts/crawler/kbo';

const FIXTURE_DIR = path.join(process.cwd(), 'tests/fixtures/html');

describe('parseStandings (real KBO HTML)', () => {
  const html = readFileSync(path.join(FIXTURE_DIR, 'kbo-standings.html'), 'utf8');
  const rows = parseStandings(html);

  it('returns 10 teams', () => {
    expect(rows).toHaveLength(10);
  });

  it('rank 1 has expected shape', () => {
    const r = rows[0]!;
    expect(r.rank).toBe(1);
    expect(r.teamCode).toBeTruthy();
    expect(typeof r.wins).toBe('number');
    expect(typeof r.losses).toBe('number');
    expect(r.winPct).toBeGreaterThanOrEqual(0);
    expect(r.winPct).toBeLessThanOrEqual(1);
  });

  it('ranks are sequential 1~10', () => {
    expect(rows.map((r) => r.rank)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('all team codes are valid KBO codes', () => {
    const validCodes = new Set([
      'LG', 'KT', 'SSG', 'NC', 'KIA', 'DOOSAN', 'LOTTE', 'SAMSUNG', 'HANWHA', 'KIWOOM',
    ]);
    for (const r of rows) {
      expect(validCodes.has(r.teamCode)).toBe(true);
    }
  });

  it('winPct is consistent with wins+losses', () => {
    for (const r of rows) {
      const denom = r.wins + r.losses;
      if (denom === 0) continue;
      const expected = r.wins / denom;
      // KBO official rounds to 3 decimals; allow small drift
      expect(Math.abs(r.winPct - expected)).toBeLessThan(0.01);
    }
  });
});

describe('parseSchedule (real KBO HTML — empty tbody case)', () => {
  // KBO 초기 HTML은 tbody empty (AJAX 로드). 0개 반환이 정상.
  const html = readFileSync(path.join(FIXTURE_DIR, 'kbo-schedule-empty.html'), 'utf8');
  it('returns empty array when tbody is server-empty', () => {
    expect(parseSchedule(html, '2026-05-09')).toEqual([]);
  });
});

describe('parseGameCell', () => {
  it('parses scheduled game (vs)', () => {
    expect(parseGameCell('LG vs KT')).toEqual({
      away: 'LG',
      home: 'KT',
      status: '예정',
    });
  });

  it('parses finished game with scores', () => {
    expect(parseGameCell('LG 5 - 3 KT')).toEqual({
      away: 'LG',
      awayScore: '5',
      homeScore: '3',
      home: 'KT',
      status: '종료',
    });
  });

  it('handles whitespace variations', () => {
    expect(parseGameCell('  LG  vs  KT  ')?.away).toBe('LG');
    expect(parseGameCell('LG  5-3  KT')?.status).toBe('종료');
  });

  it('returns null for empty', () => {
    expect(parseGameCell('')).toBeNull();
    expect(parseGameCell('   ')).toBeNull();
  });

  it('returns null for unrecognized format', () => {
    expect(parseGameCell('LG 트윈스 vs KT 위즈 (서울 잠실)')).toBeNull();
  });
});
