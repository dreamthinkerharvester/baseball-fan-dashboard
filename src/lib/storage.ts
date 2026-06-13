// Design Ref: §10.4 — localStorage with validation. SSR-safe (window 가드).
// kia-fan-service 피벗: myTeam 저장 제거 → 세이버 온리 모드 토글 상태만 저장.

import { STORAGE_KEYS } from './constants';

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

/**
 * 세이버 온리 모드 (true = 클래식 스탯 숨김). 디폴트 = true.
 * Design Ref: kia-fan-service FR-04 — localStorage 비활성 시 디폴트 고정.
 */
export function getSaberMode(): boolean {
  const storage = getStorage();
  if (!storage) return true;
  return storage.getItem(STORAGE_KEYS.saberMode) !== 'false';
}

export function setSaberMode(hidden: boolean): boolean {
  const storage = getStorage();
  if (!storage) return false;
  storage.setItem(STORAGE_KEYS.saberMode, String(hidden));
  return true;
}

/** 구 멀티팀 키 청소 (피벗 마이그레이션). 1회 호출로 충분, 실패 무해. */
export function clearLegacyMyTeam(): void {
  getStorage()?.removeItem(STORAGE_KEYS.legacyMyTeam);
}
