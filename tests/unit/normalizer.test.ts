import { describe, expect, it } from 'vitest';

import {
  normalizeGame,
  normalizeGameStatus,
  normalizeStandingsRow,
  parseScore,
  round3,
  safeWinPct,
  teamNameToCode,
  toFloat,
  toInt,
} from '@/lib/data/normalizer';

describe('teamNameToCode', () => {
  it('maps full Korean names', () => {
    expect(teamNameToCode('LG 트윈스')).toBe('LG');
    expect(teamNameToCode('KIA 타이거즈')).toBe('KIA');
    expect(teamNameToCode('두산 베어스')).toBe('DOOSAN');
  });
  it('maps short names', () => {
    expect(teamNameToCode('LG')).toBe('LG');
    expect(teamNameToCode('두산')).toBe('DOOSAN');
  });
  it('returns null for unknown', () => {
    expect(teamNameToCode('unknown')).toBeNull();
    expect(teamNameToCode('  ')).toBeNull();
  });
  it('trims whitespace', () => {
    expect(teamNameToCode('  LG 트윈스  ')).toBe('LG');
  });
});

describe('normalizeGameStatus', () => {
  it('maps Korean status text', () => {
    expect(normalizeGameStatus('예정')).toBe('scheduled');
    expect(normalizeGameStatus('경기전')).toBe('scheduled');
    expect(normalizeGameStatus('경기중')).toBe('in_progress');
    expect(normalizeGameStatus('종료')).toBe('final');
    expect(normalizeGameStatus('우천취소')).toBe('cancelled');
    expect(normalizeGameStatus('연기')).toBe('postponed');
  });
  it('strips whitespace from status text', () => {
    expect(normalizeGameStatus('우천 취소')).toBe('cancelled');
    expect(normalizeGameStatus(' 경기 종료 ')).toBe('final');
  });
  it('defaults to scheduled for unknown', () => {
    expect(normalizeGameStatus('이상한값')).toBe('scheduled');
  });
});

describe('parseScore', () => {
  it('parses numeric strings', () => {
    expect(parseScore('5')).toBe(5);
    expect(parseScore('  10  ')).toBe(10);
  });
  it('returns null for empty/dash/undefined', () => {
    expect(parseScore('')).toBeNull();
    expect(parseScore('-')).toBeNull();
    expect(parseScore(undefined)).toBeNull();
  });
  it('returns null for non-numeric', () => {
    expect(parseScore('abc')).toBeNull();
  });
});

describe('toInt / toFloat', () => {
  it('toInt accepts numeric strings and numbers', () => {
    expect(toInt('28')).toBe(28);
    expect(toInt(28)).toBe(28);
    expect(toInt('1,234')).toBe(1234);
  });
  it('toFloat accepts numeric strings and numbers', () => {
    expect(toFloat('0.622')).toBeCloseTo(0.622);
    expect(toFloat(0.5)).toBe(0.5);
  });
  it('throws on garbage', () => {
    expect(() => toInt('abc')).toThrow();
    expect(() => toFloat('abc')).toThrow();
  });
});

describe('safeWinPct + round3', () => {
  it('safeWinPct returns 0 when 0-0', () => {
    expect(safeWinPct(0, 0)).toBe(0);
  });
  it('safeWinPct rounds nothing (caller does)', () => {
    expect(safeWinPct(28, 17)).toBeCloseTo(28 / 45);
  });
  it('round3 keeps three decimals', () => {
    expect(round3(0.6222222)).toBe(0.622);
    expect(round3(0.5)).toBe(0.5);
  });
});

describe('normalizeGame', () => {
  it('produces valid Game from raw scrape record', () => {
    const game = normalizeGame({
      date: '2026-05-09',
      startTime: '18:30',
      homeTeamName: 'LG 트윈스',
      awayTeamName: 'KT 위즈',
      stadium: '잠실',
      statusText: '예정',
    });
    expect(game.id).toBe('20260509-LG-KT-1');
    expect(game.homeTeam).toBe('LG');
    expect(game.awayTeam).toBe('KT');
    expect(game.status).toBe('scheduled');
    expect(game.homeScore).toBeNull();
  });

  it('parses scores when status final', () => {
    const game = normalizeGame({
      date: '2026-05-09',
      startTime: '14:00',
      homeTeamName: 'KIA 타이거즈',
      awayTeamName: 'SSG 랜더스',
      stadium: '광주',
      statusText: '경기종료',
      homeScoreText: '6',
      awayScoreText: '3',
    });
    expect(game.status).toBe('final');
    expect(game.homeScore).toBe(6);
    expect(game.awayScore).toBe(3);
  });

  it('handles double header with explicit suffix', () => {
    const g1 = normalizeGame({
      date: '2026-05-09',
      startTime: '14:00',
      homeTeamName: 'SAMSUNG',
      awayTeamName: 'KIWOOM',
      stadium: '대구',
      statusText: '예정',
      doubleHeader: 1,
    });
    const g2 = normalizeGame({
      date: '2026-05-09',
      startTime: '18:30',
      homeTeamName: 'SAMSUNG',
      awayTeamName: 'KIWOOM',
      stadium: '대구',
      statusText: '예정',
      doubleHeader: 2,
    });
    expect(g1.id).toBe('20260509-SAMSUNG-KIWOOM-1');
    expect(g2.id).toBe('20260509-SAMSUNG-KIWOOM-2');
  });

  it('throws on invalid date', () => {
    expect(() =>
      normalizeGame({
        date: '2026/05/09',
        startTime: '18:30',
        homeTeamName: 'LG',
        awayTeamName: 'KT',
        stadium: '잠실',
        statusText: '예정',
      }),
    ).toThrow();
  });

  it('throws on unknown team', () => {
    expect(() =>
      normalizeGame({
        date: '2026-05-09',
        startTime: '18:30',
        homeTeamName: '존재하지않는팀',
        awayTeamName: 'KT',
        stadium: '잠실',
        statusText: '예정',
      }),
    ).toThrow();
  });

  it('zod fails on missing required fields', () => {
    expect(() =>
      normalizeGame({
        date: '2026-05-09',
        // startTime missing
        homeTeamName: 'LG',
        awayTeamName: 'KT',
        stadium: '잠실',
        statusText: '예정',
      }),
    ).toThrow();
  });

  it('preserves cancelReason', () => {
    const game = normalizeGame({
      date: '2026-05-09',
      startTime: '18:30',
      homeTeamName: 'DOOSAN',
      awayTeamName: 'LOTTE',
      stadium: '잠실',
      statusText: '우천취소',
      cancelReason: '우천 취소',
    });
    expect(game.status).toBe('cancelled');
    expect(game.cancelReason).toBe('우천 취소');
  });
});

describe('normalizeStandingsRow', () => {
  it('normalizes raw with all fields', () => {
    const row = normalizeStandingsRow({
      rank: 1,
      teamName: 'LG 트윈스',
      wins: 28,
      losses: 17,
      draws: 1,
      winPct: 0.622,
      gamesBehind: 0,
      streak: 'W3',
    });
    expect(row.rank).toBe(1);
    expect(row.teamCode).toBe('LG');
    expect(row.teamName).toBe('LG 트윈스');
    expect(row.winPct).toBe(0.622);
    expect(row.streak).toBe('W3');
  });

  it('computes winPct when missing', () => {
    const row = normalizeStandingsRow({
      rank: '2',
      teamName: 'KT 위즈',
      wins: '26',
      losses: '18',
    });
    expect(row.winPct).toBeCloseTo(round3(26 / 44));
    expect(row.draws).toBe(0); // default
  });

  it('treats "-" gamesBehind as 0', () => {
    const row = normalizeStandingsRow({
      rank: 1,
      teamName: 'LG',
      wins: 28,
      losses: 17,
      gamesBehind: '-',
    });
    expect(row.gamesBehind).toBe(0);
  });

  it('throws on unknown team', () => {
    expect(() =>
      normalizeStandingsRow({
        rank: 1,
        teamName: '미지의팀',
        wins: 1,
        losses: 1,
      }),
    ).toThrow();
  });
});
