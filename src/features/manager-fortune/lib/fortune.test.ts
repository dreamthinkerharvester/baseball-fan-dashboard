import { describe, expect, it } from 'vitest';

import { generateFortune, getChineseZodiac, getZodiac } from './fortune';

describe('getZodiac', () => {
  it('1981-10-28 → 전갈자리', () => {
    expect(getZodiac('1981-10-28').ko).toBe('전갈자리');
  });
  it('경계: 10-23 → 전갈자리 (시작일)', () => {
    expect(getZodiac('1990-10-23').ko).toBe('전갈자리');
  });
  it('경계: 10-22 → 천칭자리 (전일)', () => {
    expect(getZodiac('1990-10-22').ko).toBe('천칭자리');
  });
  it('경계: 1-19 → 염소자리', () => {
    expect(getZodiac('1990-01-19').ko).toBe('염소자리');
  });
  it('경계: 1-20 → 물병자리', () => {
    expect(getZodiac('1990-01-20').ko).toBe('물병자리');
  });
  it('경계: 3-20 → 물고기자리', () => {
    expect(getZodiac('1990-03-20').ko).toBe('물고기자리');
  });
  it('경계: 3-21 → 양자리', () => {
    expect(getZodiac('1990-03-21').ko).toBe('양자리');
  });
  it('경계: 12-22 → 염소자리', () => {
    expect(getZodiac('1990-12-22').ko).toBe('염소자리');
  });
  it('경계: 12-21 → 사수자리', () => {
    expect(getZodiac('1990-12-21').ko).toBe('사수자리');
  });
});

describe('getChineseZodiac', () => {
  it('1981 → 닭띠', () => {
    expect(getChineseZodiac('1981-10-28').ko).toBe('닭띠');
  });
  it('1984 → 쥐띠', () => {
    expect(getChineseZodiac('1984-01-01').ko).toBe('쥐띠');
  });
  it('2020 → 쥐띠', () => {
    expect(getChineseZodiac('2020-06-15').ko).toBe('쥐띠');
  });
  it('1988 → 용띠', () => {
    expect(getChineseZodiac('1988-03-10').ko).toBe('용띠');
  });
  it('2024 → 용띠', () => {
    expect(getChineseZodiac('2024-05-01').ko).toBe('용띠');
  });
});

describe('generateFortune', () => {
  const beombo = { name: '이범호', birthDate: '1981-10-28' };

  it('이범호 → 전갈자리 + 닭띠 + counter 톤', () => {
    const f = generateFortune(beombo, '2026-05-20');
    expect(f.zodiac.ko).toBe('전갈자리');
    expect(f.chineseZodiac.ko).toBe('닭띠');
    expect(f.tone).toBe('counter');
  });

  it('deterministic: 같은 (감독·날짜) → 같은 결과', () => {
    const a = generateFortune(beombo, '2026-05-20');
    const b = generateFortune(beombo, '2026-05-20');
    expect(a.headline).toBe(b.headline);
    expect(a.body).toBe(b.body);
    expect(a.keywords).toEqual(b.keywords);
  });

  it('날짜가 다르면 결과도 다를 수 있음 (최소 하나 이상 변화)', () => {
    const a = generateFortune(beombo, '2026-05-20');
    const b = generateFortune(beombo, '2026-05-21');
    // 셋 다 같지는 않아야 함
    expect(
      a.headline !== b.headline || a.body !== b.body || a.keywords[0] !== b.keywords[0],
    ).toBe(true);
  });

  it('잘못된 날짜 포맷은 throw', () => {
    expect(() => generateFortune(beombo, '20260520')).toThrow();
  });

  it('잘못된 생일 포맷은 throw', () => {
    expect(() => generateFortune({ name: 'X', birthDate: 'bad' }, '2026-05-20')).toThrow();
  });

  it('keywords는 항상 3개', () => {
    const f = generateFortune(beombo, '2026-05-20');
    expect(f.keywords).toHaveLength(3);
  });

  it('원소별 톤 매핑: 양자리 → aggressive (불)', () => {
    expect(generateFortune({ name: 'X', birthDate: '1990-04-01' }, '2026-05-20').tone).toBe(
      'aggressive',
    );
  });

  it('원소별 톤 매핑: 황소자리 → patient (흙)', () => {
    expect(generateFortune({ name: 'X', birthDate: '1990-05-01' }, '2026-05-20').tone).toBe(
      'patient',
    );
  });

  it('원소별 톤 매핑: 쌍둥이자리 → sharp (공기)', () => {
    expect(generateFortune({ name: 'X', birthDate: '1990-06-01' }, '2026-05-20').tone).toBe(
      'sharp',
    );
  });
});
