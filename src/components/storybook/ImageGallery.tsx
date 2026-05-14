'use client';

import { ElevatedCard } from './ElevatedCard';

interface Props {
  images: string[];
  assignments: Record<1 | 2 | 3, string | null>;
  onImageClick: (url: string) => void;
  onClear: (slot: 1 | 2 | 3) => void;
}

export function ImageGallery({ images, assignments, onImageClick, onClear }: Props) {
  const slots = [1, 2, 3] as const;
  return (
    <ElevatedCard overline="⑥ 이미지 풀" headline={`썸네일 ${images.length}장 · 3개 슬롯`}>
      {/* Slot status row */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {slots.map((slot) => {
          const url = assignments[slot];
          return (
            <div
              key={slot}
              style={{
                position: 'relative',
                aspectRatio: '1 / 1',
                borderRadius: 'var(--md-sys-shape-corner-small)',
                overflow: 'hidden',
                background: 'var(--md-sys-color-surface-container-highest)',
                border: url ? 'none' : '1px dashed var(--md-sys-color-outline-variant)',
              }}
            >
              {url ? (
                <>
                  <img src={url} alt={`slot-${slot}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  <span
                    style={{
                      position: 'absolute',
                      top: 4,
                      left: 4,
                      fontFamily: 'var(--md-ref-typeface-mono)',
                      fontWeight: 700,
                      fontSize: 9,
                      letterSpacing: 0.5,
                      padding: '4px 6px',
                      borderRadius: 4,
                      background: 'var(--md-sys-color-primary-container)',
                      color: 'var(--md-sys-color-on-primary-container)',
                    }}
                  >
                    SLOT {slot}
                  </span>
                  <button
                    type="button"
                    onClick={() => onClear(slot)}
                    aria-label={`슬롯 ${slot} 비우기`}
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      width: 24,
                      height: 24,
                      borderRadius: 9999,
                      background: 'rgba(0,0,0,0.6)',
                      color: 'white',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span className="mso" style={{ fontSize: 14 }}>close</span>
                  </button>
                </>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    fontFamily: 'var(--md-ref-typeface-mono)',
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 0.5,
                    color: 'var(--md-sys-color-on-surface-variant)',
                  }}
                >
                  SLOT {slot}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div
        className="grid grid-cols-4 sm:grid-cols-4 gap-1.5"
        style={{ maxHeight: 320, overflowY: 'auto' }}
      >
        {images.map((url) => {
          const used = (Object.values(assignments) as Array<string | null>).includes(url);
          return (
            <button
              key={url}
              type="button"
              onClick={() => onImageClick(url)}
              disabled={used}
              className={`m3-thumb ${used ? 'selected' : ''}`}
              style={{
                opacity: used ? 0.5 : 1,
                cursor: used ? 'default' : 'pointer',
                border: 'none',
                padding: 0,
              }}
              aria-label={used ? `${extractName(url)} (사용중)` : `${extractName(url)} 선택`}
            >
              <img src={url} alt="" loading="lazy" />
              {used && (
                <span
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    background: 'rgba(0,0,0,0.55)',
                    color: 'white',
                    fontWeight: 600,
                  }}
                >
                  사용중
                </span>
              )}
            </button>
          );
        })}
      </div>

      <p style={{ marginTop: 10, marginBottom: 0, fontSize: 11, color: 'var(--md-sys-color-on-surface-variant)' }}>
        이미지를 클릭하면 첫 빈 슬롯에 자동 채워집니다.
      </p>
    </ElevatedCard>
  );
}

function extractName(url: string): string {
  const parts = url.split('/');
  return parts[parts.length - 1] ?? url;
}
