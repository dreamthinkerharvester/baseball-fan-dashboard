import { describe, expect, it } from 'vitest';

import {
  formatKoreanShortDate,
  isValidDateString,
  isoKst,
  todayKstString,
} from '@/lib/date';

describe('isValidDateString', () => {
  it('accepts YYYY-MM-DD', () => {
    expect(isValidDateString('2026-05-09')).toBe(true);
    expect(isValidDateString('2026-12-31')).toBe(true);
  });
  it('rejects malformed', () => {
    expect(isValidDateString('2026/05/09')).toBe(false);
    expect(isValidDateString('20260509')).toBe(false);
    expect(isValidDateString('2026-5-9')).toBe(false);
    expect(isValidDateString('not-a-date')).toBe(false);
    expect(isValidDateString(123)).toBe(false);
    expect(isValidDateString(null)).toBe(false);
  });
  it('rejects invalid calendar dates', () => {
    expect(isValidDateString('2026-13-01')).toBe(false);
    expect(isValidDateString('2026-02-30')).toBe(false);
  });
});

describe('todayKstString', () => {
  it('returns YYYY-MM-DD format for a known UTC instant', () => {
    // 2026-05-09 09:00:00 UTC → 18:00 KST → date "2026-05-09"
    const fixedUtc = new Date('2026-05-09T09:00:00Z');
    expect(todayKstString(fixedUtc)).toBe('2026-05-09');
  });

  it('handles UTC-day-flip (UTC 23:00 → KST next day 08:00)', () => {
    const fixedUtc = new Date('2026-05-09T23:00:00Z');
    expect(todayKstString(fixedUtc)).toBe('2026-05-10');
  });
});

describe('isoKst', () => {
  it('includes +09:00 offset', () => {
    const fixedUtc = new Date('2026-05-09T09:00:00Z');
    expect(isoKst(fixedUtc)).toBe('2026-05-09T18:00:00+09:00');
  });
});

describe('formatKoreanShortDate', () => {
  it('formats with weekday in Korean', () => {
    // 2026-05-09 is a Saturday
    expect(formatKoreanShortDate('2026-05-09')).toBe('5/9 (토)');
  });
  it('formats single-digit month/day without zero pad', () => {
    expect(formatKoreanShortDate('2026-01-05')).toBe('1/5 (월)');
  });
});
