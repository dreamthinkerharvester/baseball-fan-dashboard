// Storage 헬퍼 단위 테스트. JSDOM/Node 환경 모두에서 동작하도록 globalThis.window 모킹.
// kia-fan-service 피벗: myTeam 저장 → 세이버 온리 모드 토글 저장.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { STORAGE_KEYS, TEAM_CODES, isTeamCode } from '@/lib/constants';
import {
  clearLegacyMyTeam,
  getSaberMode,
  isStorageAvailable,
  setSaberMode,
} from '@/lib/storage';

class MockStorage {
  private store = new Map<string, string>();
  getItem = (k: string) => this.store.get(k) ?? null;
  setItem = (k: string, v: string) => {
    this.store.set(k, v);
  };
  removeItem = (k: string) => {
    this.store.delete(k);
  };
  get length() {
    return this.store.size;
  }
  key = (i: number) => Array.from(this.store.keys())[i] ?? null;
  clear = () => {
    this.store.clear();
  };
}

class FailingStorage extends MockStorage {
  override setItem = () => {
    throw new Error('quota exceeded (private mode simulation)');
  };
}

describe('isTeamCode', () => {
  it('accepts known codes', () => {
    for (const code of TEAM_CODES) expect(isTeamCode(code)).toBe(true);
  });
  it('rejects unknown', () => {
    expect(isTeamCode('XYZ')).toBe(false);
    expect(isTeamCode(null)).toBe(false);
    expect(isTeamCode(undefined)).toBe(false);
    expect(isTeamCode(42)).toBe(false);
  });
});

describe('saber mode storage', () => {
  beforeEach(() => {
    vi.stubGlobal('window', { localStorage: new MockStorage() });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('isStorageAvailable returns true when localStorage works', () => {
    expect(isStorageAvailable()).toBe(true);
  });

  it('defaults to true (classic hidden) when unset', () => {
    expect(getSaberMode()).toBe(true);
  });

  it('round-trip set/get', () => {
    expect(setSaberMode(false)).toBe(true);
    expect(getSaberMode()).toBe(false);
    expect(setSaberMode(true)).toBe(true);
    expect(getSaberMode()).toBe(true);
  });

  it('treats arbitrary stored value as default (hidden)', () => {
    (window as unknown as { localStorage: Storage }).localStorage.setItem(
      STORAGE_KEYS.saberMode,
      'INVALID',
    );
    expect(getSaberMode()).toBe(true);
  });

  it('clearLegacyMyTeam removes old multi-team key', () => {
    const storage = (window as unknown as { localStorage: Storage }).localStorage;
    storage.setItem(STORAGE_KEYS.legacyMyTeam, 'LG');
    clearLegacyMyTeam();
    expect(storage.getItem(STORAGE_KEYS.legacyMyTeam)).toBeNull();
  });
});

describe('saber mode storage — SSR (no window)', () => {
  beforeEach(() => {
    vi.stubGlobal('window', undefined);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('all operations safe-fail without window', () => {
    expect(isStorageAvailable()).toBe(false);
    expect(getSaberMode()).toBe(true); // 디폴트 고정 (FR-04)
    expect(setSaberMode(false)).toBe(false);
    expect(() => clearLegacyMyTeam()).not.toThrow();
  });
});

describe('saber mode storage — private mode (setItem throws)', () => {
  beforeEach(() => {
    vi.stubGlobal('window', { localStorage: new FailingStorage() });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('isStorageAvailable returns false', () => {
    expect(isStorageAvailable()).toBe(false);
  });
  it('getSaberMode returns default without throwing', () => {
    expect(getSaberMode()).toBe(true);
  });
});
