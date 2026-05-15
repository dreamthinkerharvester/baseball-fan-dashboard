// Design Ref: §5.4 PlayerModal + m3-comp Screen2.
// Hero header (photo + tier chip + #num pill + name) + M3 tabs + 4-way close.

'use client';

import { useState } from 'react';

import { Dialog } from '@/components/ui/Dialog';
import { GradeBadge } from '@/components/ui/GradeBadge';
import { TEAMS } from '@/lib/constants';

import { CareerStatTab } from './CareerStatTab';
import { usePlayer } from './hooks/usePlayer';
import { SeasonStatTab } from './SeasonStatTab';

import type { Grade, TeamCode } from '@/types';

export interface PlayerModalProps {
  playerId: string;
  open: boolean;
  onClose: () => void;
}

type TabValue = 'season' | 'career';

export function PlayerModal({ playerId, open, onClose }: PlayerModalProps) {
  const [tab, setTab] = useState<TabValue>('season');
  const { data, error, isLoading } = usePlayer(open ? playerId : null);

  const player = data?.player;
  const team = player ? TEAMS[player.teamCode as TeamCode] : null;
  const grade: Grade = (data?.currentGrade?.grade as Grade) ?? 'normal';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      ariaLabelledby="player-modal-title"
      variant="bottom-sheet"
    >
      {/* Hero header */}
      <div style={{ padding: '12px 16px 0' }}>
        <div
          style={{
            position: 'relative',
            aspectRatio: '16 / 9',
            borderRadius: 'var(--md-sys-shape-corner-large)',
            overflow: 'hidden',
            background: 'var(--md-sys-color-surface-container-highest)',
          }}
        >
          {player?.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={player.photoUrl}
              alt=""
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'top center',
              }}
            />
          ) : (
            <div
              aria-hidden
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                className="mso filled"
                style={{
                  fontSize: 96,
                  color: 'var(--md-sys-color-outline)',
                  opacity: 0.45,
                }}
              >
                {player?.isPitcher ? 'sports_baseball' : 'person'}
              </span>
            </div>
          )}
          {/* bottom gradient for legibility */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: '60%',
              background: 'linear-gradient(0deg, rgba(0,0,0,0.85), rgba(0,0,0,0))',
            }}
          />

          {/* top-left chips */}
          <div
            style={{
              position: 'absolute',
              left: 12,
              top: 12,
              display: 'flex',
              gap: 6,
              alignItems: 'center',
            }}
          >
            <GradeBadge grade={grade} size="md" />
            {player?.uniformNumber != null && (
              <span
                className="tabular"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  height: 24,
                  padding: '0 8px',
                  fontFamily: 'var(--md-ref-typeface-mono)',
                  fontSize: 12,
                  fontWeight: 700,
                  borderRadius: 6,
                  background: 'rgba(255,255,255,0.16)',
                  color: '#fff',
                  backdropFilter: 'blur(2px)',
                  border: '1px solid rgba(255,255,255,0.18)',
                }}
              >
                #{player.uniformNumber}
              </span>
            )}
          </div>

          {/* close button */}
          <button
            type="button"
            aria-label="닫기"
            onClick={onClose}
            style={{
              position: 'absolute',
              right: 8,
              top: 8,
              width: 36,
              height: 36,
              borderRadius: 9999,
              background: 'rgba(0,0,0,0.4)',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span className="mso" style={{ fontSize: 22 }}>close</span>
          </button>

          {/* name overlay */}
          {player && (
            <div
              style={{
                position: 'absolute',
                left: 14,
                bottom: 12,
                color: '#fff',
                right: 14,
              }}
            >
              <h2
                id="player-modal-title"
                className="font-brand"
                style={{
                  margin: 0,
                  fontSize: 26,
                  fontWeight: 700,
                  letterSpacing: -0.5,
                  lineHeight: '30px',
                  textShadow: '0 2px 6px rgba(0,0,0,0.5)',
                }}
              >
                {player.name}
              </h2>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 6,
                  alignItems: 'center',
                  marginTop: 4,
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.85)',
                  whiteSpace: 'nowrap',
                }}
              >
                {team && <span style={{ color: team.primaryColor, fontWeight: 700 }}>{team.shortName}</span>}
                {team && <span style={{ width: 3, height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />}
                <span>{player.position}</span>
                {player.isPitcher !== undefined && (
                  <>
                    <span style={{ width: 3, height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
                    <span>{player.isPitcher ? '투수' : '타자'}</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Meta row — grade basis */}
        {data?.currentGrade?.basis ? (
          <p
            style={{
              margin: '10px 0 0',
              padding: '8px 10px',
              borderRadius: 'var(--md-sys-shape-corner-small)',
              background: 'var(--md-sys-color-surface-container-highest)',
              border: `1px solid var(--grade-${grade})`,
              fontSize: 12,
              color: 'var(--md-sys-color-on-surface-variant)',
            }}
          >
            <span style={{ fontWeight: 700, color: `var(--grade-${grade})` }}>등급 산출:</span>{' '}
            {data.currentGrade.basis}
          </p>
        ) : null}
      </div>

      {/* Loading / error */}
      {isLoading ? (
        <p
          className="py-8 text-center"
          aria-live="polite"
          style={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: 13 }}
        >
          선수 정보 불러오는 중…
        </p>
      ) : null}
      {error ? (
        <div
          style={{
            margin: '12px 16px',
            padding: 12,
            borderRadius: 'var(--md-sys-shape-corner-medium)',
            background: 'var(--md-sys-color-error-container)',
            color: 'var(--md-sys-color-on-error-container)',
            fontSize: 13,
          }}
        >
          선수 정보를 불러오지 못했습니다.
        </div>
      ) : null}

      {/* Tabs + body */}
      {data && player ? (
        <>
          <div className="m3-tabs" style={{ marginTop: 14 }}>
            <button
              type="button"
              className={tab === 'season' ? 'active' : ''}
              onClick={() => setTab('season')}
              aria-selected={tab === 'season'}
            >
              시즌 성적
            </button>
            <button
              type="button"
              className={tab === 'career' ? 'active' : ''}
              onClick={() => setTab('career')}
              aria-selected={tab === 'career'}
            >
              역대 기록
            </button>
          </div>
          <div
            role="tabpanel"
            aria-label={tab === 'season' ? '시즌 성적' : '역대 기록'}
            style={{ padding: '16px', maxHeight: '50vh', overflowY: 'auto' }}
          >
            {tab === 'season' ? (
              <SeasonStatTab
                isPitcher={player.isPitcher}
                currentSeason={(data.currentSeason as Record<string, unknown>) ?? {}}
                recentTen={(data.recentTen as Record<string, unknown>[]) ?? []}
                grade={grade}
              />
            ) : (
              <CareerStatTab
                isPitcher={player.isPitcher}
                careerSeasons={(data.careerSeasons as Record<string, unknown>[]) ?? []}
              />
            )}
          </div>
        </>
      ) : null}
    </Dialog>
  );
}
