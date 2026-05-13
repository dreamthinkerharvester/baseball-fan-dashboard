// Design Ref: §5.4 Page 4 — 마이팀 변경/초기화. 위험 액션 확인 다이얼로그.

'use client';

import { useState } from 'react';

import { Dialog } from '@/components/ui/Dialog';
import { TEAMS } from '@/lib/constants';

import { useMyTeam } from './hooks/useMyTeam';
import { TeamSelectionScreen } from './TeamSelectionScreen';

export interface MyTeamSettingsProps {
  open: boolean;
  onClose: () => void;
}

export function MyTeamSettings({ open, onClose }: MyTeamSettingsProps) {
  const { myTeam, setTeam, clear } = useMyTeam();
  const [mode, setMode] = useState<'menu' | 'change' | 'confirm-clear'>('menu');

  function handleClose() {
    setMode('menu');
    onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      ariaLabelledby="settings-heading"
      variant="bottom-sheet"
    >
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center justify-between">
          <h2 id="settings-heading" className="text-heading">
            마이팀 설정
          </h2>
          <button
            type="button"
            aria-label="닫기"
            onClick={handleClose}
            className="flex h-11 w-11 items-center justify-center rounded-button text-text-muted hover:bg-bg-card"
          >
            ✕
          </button>
        </div>

        {mode === 'menu' ? (
          <div className="space-y-3">
            <p className="text-body text-text-muted">
              현재 마이팀:{' '}
              {myTeam ? (
                <strong style={{ color: TEAMS[myTeam].primaryColor }}>
                  {TEAMS[myTeam].name}
                </strong>
              ) : (
                <span className="text-text-dim">설정되지 않음</span>
              )}
            </p>
            <button
              type="button"
              onClick={() => setMode('change')}
              className="block w-full rounded-button border border-text-dim/30 bg-bg-card px-4 py-3 text-left text-body hover:border-grade-elite/40"
            >
              팀 변경
            </button>
            {myTeam ? (
              <button
                type="button"
                onClick={() => setMode('confirm-clear')}
                className="block w-full rounded-button border border-grade-rare/40 bg-grade-rare/10 px-4 py-3 text-left text-body text-grade-rare hover:bg-grade-rare/20"
              >
                마이팀 초기화
              </button>
            ) : null}
          </div>
        ) : null}

        {mode === 'change' ? (
          <TeamSelectionScreen
            highlightCurrent={myTeam}
            onSelect={(team) => {
              setTeam(team);
              handleClose();
            }}
          />
        ) : null}

        {mode === 'confirm-clear' ? (
          <div className="space-y-4 rounded-card border border-grade-rare/40 bg-grade-rare/10 p-4">
            <p className="text-body text-text-primary">
              정말 마이팀을 초기화하시겠어요? 다음 방문 시 팀을 다시 선택해야 합니다.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode('menu')}
                className="min-h-[44px] flex-1 rounded-button border border-text-dim/30 px-4 text-body"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  clear();
                  handleClose();
                }}
                className="min-h-[44px] flex-1 rounded-button bg-grade-rare px-4 text-body font-semibold text-text-primary"
              >
                초기화
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </Dialog>
  );
}
