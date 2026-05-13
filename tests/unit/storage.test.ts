// Storage 헬퍼 단위 테스트. JSDOM/Node 환경 모두에서 동작하도록 globalThis.window 모킹.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TEAM_CODES, isTeamCode } from '@/lib/constants';
import {
  clearMyTeam,
  getMyTeam,
  isStorageAvailable,
  setMyTeam,
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

describe('storage helpers', () => {
  beforeEach(() => {
    vi.stubGlobal('window', { localStorage: new MockStorage() });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('isStorageAvailable returns true when localStorage works', () => {
    expect(isStorageAvailable()).toBe(true);
  });

  it('round-trip set/get/clear', () => {
    expect(getMyTeam()).toBeNull();
    expect(setMyTeam('LG')).toBe(true);
    expect(getMyTeam()).toBe('LG');
    expect(clearMyTeam()).toBe(true);
    expect(getMyTeam()).toBeNull();
  });

  it('returns null for invalid stored value', () => {
    (window as unknown as { localStorage: Storage }).localStorage.setItem(
      'baseball_myteam',
      'INVALID_TEAM_CODE',
    );
    expect(getMyTeam()).toBeNull();
  });
});

describe('storage helpers — SSR (no window)', () => {
  beforeEach(() => {
    vi.stubGlobal('window', undefined);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('all operations safe-fail without window', () => {
    expect(isStorageAvailable()).toBe(false);
    expect(getMyTeam()).toBeNull();
    expect(setMyTeam('LG')).toBe(false);
    expect(clearMyTeam()).toBe(false);
  });
});

describe('storage helpers — private mode (setItem throws)', () => {
  beforeEach(() => {
    vi.stubGlobal('window', { localStorage: new FailingStorage() });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('isStorageAvailable returns false', () => {
    expect(isStorageAvailable()).toBe(false);
  });
  it('getMyTeam returns null without throwing', () => {
    expect(getMyTeam()).toBeNull();
  });
});
