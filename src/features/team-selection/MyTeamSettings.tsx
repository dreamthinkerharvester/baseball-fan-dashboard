// Design Ref: §5.4 Page 4 — 마이팀 변경/초기화. M3 bottom-sheet.

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
    <Dialog open={open} onClose={handleClose} ariaLabelledby="settings-heading" variant="bottom-sheet">
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2
            id="settings-heading"
            className="font-brand"
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: -0.2,
              color: 'var(--md-sys-color-on-surface)',
            }}
          >
            {mode === 'change' ? '팀 변경' : mode === 'confirm-clear' ? '마이팀 초기화' : '마이팀 설정'}
          </h2>
          <button
            type="button"
            aria-label="닫기"
            onClick={handleClose}
            className="m3-btn m3-btn-icon"
            style={{ width: 40, height: 40 }}
          >
            <span className="mso" style={{ fontSize: 22 }}>close</span>
          </button>
        </div>

        {/* Menu */}
        {mode === 'menu' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Current team */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--md-sys-shape-corner-medium)',
                background: 'var(--md-sys-color-surface-container)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              {myTeam ? (
                <>
                  <span
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 9999,
                      background: TEAMS[myTeam].primaryColor,
                      color: '#fff',
                      fontSize: 12,
                      fontWeight: 800,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {TEAMS[myTeam].shortName.slice(0, 2)}
                  </span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: TEAMS[myTeam].primaryColor }}>
                      {TEAMS[myTeam].name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--md-sys-color-on-surface-variant)' }}>
                      현재 마이팀
                    </div>
                  </div>
                </>
              ) : (
                <span style={{ fontSize: 13, color: 'var(--md-sys-color-on-surface-variant)' }}>
                  마이팀이 설정되지 않았습니다.
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setMode('change')}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: 'var(--md-sys-shape-corner-medium)',
                background: 'var(--md-sys-color-surface-container-high)',
                color: 'var(--md-sys-color-on-surface)',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: 14,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span className="mso" style={{ fontSize: 20, color: 'var(--md-sys-color-primary)' }}>sports_baseball</span>
              팀 변경
            </button>

            {myTeam ? (
              <button
                type="button"
                onClick={() => setMode('confirm-clear')}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: 'var(--md-sys-shape-corner-medium)',
                  background: 'color-mix(in oklab, var(--md-sys-color-error-container) 30%, transparent)',
                  color: 'var(--md-sys-color-error)',
                  border: '1px solid var(--md-sys-color-error-container)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: 14,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <span className="mso" style={{ fontSize: 20 }}>delete</span>
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
          <div
            style={{
              padding: 16,
              borderRadius: 'var(--md-sys-shape-corner-medium)',
              background: 'var(--md-sys-color-error-container)',
              color: 'var(--md-sys-color-on-error-container)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <p style={{ margin: 0, fontSize: 14 }}>
              정말 마이팀을 초기화하시겠어요? 다음 방문 시 팀을 다시 선택해야 합니다.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => setMode('menu')}
                className="m3-btn m3-btn-outlined"
                style={{ flex: 1, minHeight: 44, color: 'var(--md-sys-color-on-error-container)', borderColor: 'var(--md-sys-color-on-error-container)' }}
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => { clear(); handleClose(); }}
                className="m3-btn"
                style={{
                  flex: 1,
                  minHeight: 44,
                  background: 'var(--md-sys-color-on-error-container)',
                  color: 'var(--md-sys-color-error-container)',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
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
