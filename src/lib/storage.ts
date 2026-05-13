// Design Ref: §10.4 — localStorage with validation. SSR-safe (window 가드).

import { STORAGE_KEYS, isTeamCode } from './constants';

import type { TeamCode } from '@/types';

/** SSR/시크릿 모드 안전 래퍼. */
function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    // 시크릿 모드에서 setItem만 호출 시 throw하는 브라우저가 있음.
    const probe = '__probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return null;
  }
}

export function isStorageAvailable(): boolean {
  return getStorage() !== null;
}

export function getMyTeam(): TeamCode | null {
  const storage = getStorage();
  if (!storage) return null;
  const raw = storage.getItem(STORAGE_KEYS.myTeam);
  if (!isTeamCode(raw)) return null;
  return raw;
}

export function setMyTeam(team: TeamCode): boolean {
  const storage = getStorage();
  if (!storage) return false;
  storage.setItem(STORAGE_KEYS.myTeam, team);
  return true;
}

export function clearMyTeam(): boolean {
  const storage = getStorage();
  if (!storage) return false;
  storage.removeItem(STORAGE_KEYS.myTeam);
  return true;
}
