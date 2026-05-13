// Design Ref: §5.4 — localStorage hook with cross-tab sync via storage event.
// Plan SC: localStorage 검증 + SSR 안전.

'use client';

import { useCallback, useEffect, useState } from 'react';

import { STORAGE_KEYS, isTeamCode } from '@/lib/constants';
import { clearMyTeam, getMyTeam, setMyTeam } from '@/lib/storage';

import type { TeamCode } from '@/types';

export interface UseMyTeam {
  myTeam: TeamCode | null;
  /** 초기 read가 끝났는지. SSR 깜빡임 방지 — false면 placeholder 렌더 */
  ready: boolean;
  setTeam: (team: TeamCode) => void;
  clear: () => void;
}

export function useMyTeam(): UseMyTeam {
  const [myTeam, setMyTeamState] = useState<TeamCode | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setMyTeamState(getMyTeam());
    setReady(true);
    function onStorage(e: StorageEvent) {
      if (e.key !== STORAGE_KEYS.myTeam) return;
      setMyTeamState(isTeamCode(e.newValue) ? e.newValue : null);
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setTeam = useCallback((team: TeamCode) => {
    if (setMyTeam(team)) setMyTeamState(team);
  }, []);

  const clear = useCallback(() => {
    if (clearMyTeam()) setMyTeamState(null);
  }, []);

  return { myTeam, ready, setTeam, clear };
}
