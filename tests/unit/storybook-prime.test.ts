// Storybook M4 prime.ts — Design Ref §2.4 (15+ cases, 100% coverage required).

import { describe, expect, it } from 'vitest';

import { detectPrimeSeason, extractHighlights } from '@/services/storybook/prime';

import type { SeasonRecord } from '@/types';

describe('detectPrimeSeason', () => {
  it('T1: 신인 (3년 미만, WAR 있어도 rookieFlag=true)', () => {
    const seasons: SeasonRecord[] = [
      { year: 2024, war: 2.1, ops: 0.789 },
      { year: 2025, war: 3.5, ops: 0.823 },
    ];
    const result = detectPrimeSeason(seasons, false);
    expect(result).not.toBeNull();
    expect(result!.rookieFlag).toBe(true);
    expect(result!.year).toBe(2025);
  });

  it('T2: 타자, WAR 최고 시즌 명확 선정', () => {
    const seasons: SeasonRecord[] = [
      { year: 2022, war: 3.1, ops: 0.812 },
      { year: 2023, war: 5.4, ops: 0.901 },
      { year: 2024, war: 8.2, ops: 1.067, hr: 38, sb: 40 },
      { year: 2025, war: 6.1, ops: 0.945 },
    ];
    const result = detectPrimeSeason(seasons, false);
    expect(result!.year).toBe(2024);
    expect(result!.metric).toBe('WAR');
    expect(result!.value).toBe(8.2);
    expect(result!.rookieFlag).toBe(false);
  });

  it('T3: 타자, WAR 동률 (0.05 차이) → OPS 타이브레이크', () => {
    const seasons: SeasonRecord[] = [
      { year: 2022, war: 4.0, ops: 0.800 },
      { year: 2023, war: 7.10, ops: 0.950 },
      { year: 2024, war: 7.15, ops: 0.920 },
    ];
    const result = detectPrimeSeason(seasons, false);
    // tie within epsilon, OPS 0.950 (2023) wins
    expect(result!.year).toBe(2023);
  });

  it('T4: 타자, WAR/OPS 모두 동률 → 더 최근 연도', () => {
    const seasons: SeasonRecord[] = [
      { year: 2022, war: 4.0, ops: 0.800 },
      { year: 2023, war: 7.10, ops: 0.950 },
      { year: 2024, war: 7.10, ops: 0.950 },
    ];
    const result = detectPrimeSeason(seasons, false);
    expect(result!.year).toBe(2024);
  });

  it('T5: 투수, WAR 결손 → ERA fallback (IP ≥ 100)', () => {
    const seasons: SeasonRecord[] = [
      { year: 2022, era: 3.2, ip: 180 },
      { year: 2023, era: 2.8, ip: 175 },
      { year: 2024, era: 2.45, ip: 198 },
      { year: 2025, era: 2.95, ip: 162 },
    ];
    const result = detectPrimeSeason(seasons, true);
    expect(result!.year).toBe(2024);
    expect(result!.metric).toBe('ERA');
    expect(result!.value).toBeCloseTo(2.45);
  });

  it('T6: 투수, IP < 100 시즌만 있음 → 최신 시즌 + rookieFlag', () => {
    const seasons: SeasonRecord[] = [
      { year: 2022, era: 2.5, ip: 50 },
      { year: 2023, era: 2.3, ip: 80 },
      { year: 2024, era: 2.1, ip: 70 },
    ];
    const result = detectPrimeSeason(seasons, true);
    expect(result!.rookieFlag).toBe(true);
    expect(result!.year).toBe(2024);
  });

  it('T7: 30-30 시즌 highlights 포함', () => {
    const seasons: SeasonRecord[] = [
      { year: 2022, war: 2.0, ops: 0.700 },
      { year: 2023, war: 3.0, ops: 0.800 },
      { year: 2024, war: 7.5, ops: 0.950, hr: 35, sb: 32 },
    ];
    const result = detectPrimeSeason(seasons, false);
    const kpis = result!.highlights.map((h) => h.kpi);
    expect(kpis).toContain('30-30');
  });

  it('T8: 40-40 highlight', () => {
    const seasons: SeasonRecord[] = [
      { year: 2022, war: 2.0, ops: 0.700 },
      { year: 2023, war: 3.0, ops: 0.800 },
      { year: 2024, war: 9.0, ops: 1.100, hr: 42, sb: 40 },
    ];
    const result = detectPrimeSeason(seasons, false);
    const kpis = result!.highlights.map((h) => h.kpi);
    expect(kpis).toContain('40-40');
    expect(kpis).not.toContain('30-30');
  });

  it('T9: 4할 타자', () => {
    const seasons: SeasonRecord[] = [
      { year: 2022, war: 3.0, ops: 0.900 },
      { year: 2023, war: 4.0, ops: 0.950 },
      { year: 2024, war: 8.0, ops: 1.150, avg: 0.412 },
    ];
    const result = detectPrimeSeason(seasons, false);
    const values = result!.highlights.map((h) => h.value);
    expect(values.some((v) => v.includes('신드롬'))).toBe(true);
  });

  it('T10: 200K 투수', () => {
    const seasons: SeasonRecord[] = [
      { year: 2022, war: 4.0, era: 3.0, ip: 180, k: 180 },
      { year: 2023, war: 5.0, era: 2.8, ip: 190, k: 195 },
      { year: 2024, war: 6.5, era: 2.4, ip: 200, k: 220 },
    ];
    const result = detectPrimeSeason(seasons, true);
    const kpis = result!.highlights.map((h) => h.kpi);
    expect(kpis).toContain('탈삼진');
  });

  it('T11: 리그 1위 → highlights 최상단', () => {
    const seasons: SeasonRecord[] = [
      { year: 2022, war: 3.0, ops: 0.800 },
      { year: 2023, war: 5.0, ops: 0.900 },
      {
        year: 2024,
        war: 8.0,
        ops: 1.050,
        rankInLeague: { metric: 'WAR', rank: 1 },
      },
    ];
    const result = detectPrimeSeason(seasons, false);
    expect(result!.highlights[0]?.kpi).toBe('리그 1위');
    expect(result!.rank).toEqual({ metric: 'WAR', rankInLeague: 1 });
  });

  it('T12: highlights 4개+ 후보 → max 3개', () => {
    const seasons: SeasonRecord[] = [
      { year: 2022, war: 4.0, ops: 0.900 },
      { year: 2023, war: 5.0, ops: 0.950 },
      {
        year: 2024,
        war: 9.0,
        ops: 1.200,
        avg: 0.415,
        hr: 42,
        sb: 41,
        rankInLeague: { metric: 'WAR', rank: 1 },
      },
    ];
    const result = detectPrimeSeason(seasons, false);
    expect(result!.highlights.length).toBeLessThanOrEqual(3);
  });

  it('T13: 빈 배열 → null', () => {
    const result = detectPrimeSeason([], false);
    expect(result).toBeNull();
  });

  it('T14: 단일 시즌 → rookieFlag + 그 시즌', () => {
    const seasons: SeasonRecord[] = [{ year: 2025, ops: 0.890, war: 4.2 }];
    const result = detectPrimeSeason(seasons, false);
    expect(result!.rookieFlag).toBe(true);
    expect(result!.year).toBe(2025);
  });

  it('T15: WAR 음수만 있는 경우 → max(가장 덜 음수)', () => {
    const seasons: SeasonRecord[] = [
      { year: 2022, war: -1.0, ops: 0.500 },
      { year: 2023, war: -0.5, ops: 0.550 },
      { year: 2024, war: -0.8, ops: 0.520 },
    ];
    const result = detectPrimeSeason(seasons, false);
    expect(result!.year).toBe(2023);
    expect(result!.value).toBe(-0.5);
  });

  it('T16: 타자, WAR 결손 → AB ≥ 100 OPS fallback', () => {
    const seasons: SeasonRecord[] = [
      { year: 2022, ops: 0.800, ab: 450 },
      { year: 2023, ops: 0.920, ab: 510 },
      { year: 2024, ops: 0.890, ab: 480 },
    ];
    const result = detectPrimeSeason(seasons, false);
    expect(result!.year).toBe(2023);
    expect(result!.metric).toBe('OPS');
  });
});

describe('extractHighlights', () => {
  it('30-30 우선, 40-40 만나면 30-30 제거', () => {
    const s: SeasonRecord = { year: 2024, hr: 42, sb: 41, war: 9.0, ops: 1.100 };
    const h = extractHighlights(s, false);
    const kpis = h.map((x) => x.kpi);
    expect(kpis).toContain('40-40');
    expect(kpis).not.toContain('30-30');
  });

  it('투수 ERA 2.5 미만이고 IP 100+ 만족하면 highlight', () => {
    const s: SeasonRecord = { year: 2024, era: 2.4, ip: 180, k: 150, war: 5.5 };
    const h = extractHighlights(s, true);
    expect(h.some((x) => x.kpi === 'ERA')).toBe(true);
  });
});
