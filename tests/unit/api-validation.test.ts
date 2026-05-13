import { describe, expect, it } from 'vitest';

import {
  DateStringSchema,
  PlayerIdSchema,
  RangeSchema,
  TeamCodeSchema,
  parseQuery,
} from '@/lib/api/validation';

describe('TeamCodeSchema', () => {
  it('accepts valid codes', () => {
    expect(TeamCodeSchema.parse('LG')).toBe('LG');
    expect(TeamCodeSchema.parse('KIA')).toBe('KIA');
  });
  it('rejects unknown codes', () => {
    expect(() => TeamCodeSchema.parse('XYZ')).toThrow();
  });
});

describe('DateStringSchema', () => {
  it('accepts YYYY-MM-DD', () => {
    expect(DateStringSchema.parse('2026-05-09')).toBe('2026-05-09');
  });
  it('rejects malformed', () => {
    expect(() => DateStringSchema.parse('2026/05/09')).toThrow();
    expect(() => DateStringSchema.parse('not-a-date')).toThrow();
  });
});

describe('PlayerIdSchema', () => {
  it('accepts numeric ids 1~8 digits', () => {
    expect(PlayerIdSchema.parse('1')).toBe('1');
    expect(PlayerIdSchema.parse('78529')).toBe('78529');
    expect(PlayerIdSchema.parse('12345678')).toBe('12345678');
  });
  it('rejects non-numeric or too long', () => {
    expect(() => PlayerIdSchema.parse('abc')).toThrow();
    expect(() => PlayerIdSchema.parse('123456789')).toThrow();
    expect(() => PlayerIdSchema.parse('')).toThrow();
  });
});

describe('RangeSchema', () => {
  it('accepts day/week/month', () => {
    expect(RangeSchema.parse('day')).toBe('day');
    expect(RangeSchema.parse('week')).toBe('week');
    expect(RangeSchema.parse('month')).toBe('month');
  });
  it('rejects others', () => {
    expect(() => RangeSchema.parse('year')).toThrow();
  });
});

describe('parseQuery', () => {
  it('returns ok with parsed value on success', () => {
    const r = parseQuery(TeamCodeSchema, 'LG');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data).toBe('LG');
  });

  it('returns standardized error response on failure', () => {
    const r = parseQuery(TeamCodeSchema, 'INVALID', 'INVALID_TEAM');
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.status).toBe(400);
      expect(r.response.error?.code).toBe('INVALID_TEAM');
      expect(r.response.error?.message).toContain('올바르지 않습니다');
    }
  });
});
