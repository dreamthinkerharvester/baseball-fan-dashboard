// Magu Magu 익명 한줄 코멘트 게시판.
// MVP: localStorage 단일 기기 저장. 선호 KIA 선수 SD 아이콘 + 60자 텍스트.
// 추후 서버 API/BaaS 연결 시 동일 인터페이스 유지.

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { icon, playerByLineupSlot } from '@/lib/assets-magu';

const STORAGE_KEY = 'bfd:comments:v1';
const DEVICE_ID_KEY = 'bfd:comments:device-id';
const MAX_TEXT = 60;
const MAX_ITEMS = 30;

interface Comment {
  id: string;
  playerSlot: number; // 0-based (1~9번 라인업 → 0~8)
  text: string;
  ts: number; // epoch ms
  deviceId: string; // 본 디바이스 식별 (삭제 권한)
}

const KIA_LINEUP_NAMES: readonly string[] = [
  '김도영', '박찬호', '최형우', '최정', '변우혁',
  '소크라테스', '나성범', '한승택', '윤도현',
];

function readAll(): Comment[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as Comment[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeAll(list: Comment[]): void {
  if (typeof window === 'undefined') return;
  try {
    const trimmed = list.slice(0, MAX_ITEMS);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    /* quota or private mode — silently fail */
  }
}

function getDeviceId(): string {
  if (typeof window === 'undefined') return 'srv';
  try {
    const v = window.localStorage.getItem(DEVICE_ID_KEY);
    if (v) return v;
    const id = `d${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(DEVICE_ID_KEY, id);
    return id;
  } catch {
    return `d${Math.random().toString(36).slice(2, 10)}`;
  }
}

function timeAgo(ts: number): string {
  const sec = Math.floor((Date.now() - ts) / 1000);
  if (sec < 30) return '방금';
  if (sec < 60) return `${sec}초 전`;
  if (sec < 3600) return `${Math.floor(sec / 60)}분 전`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}시간 전`;
  return `${Math.floor(sec / 86400)}일 전`;
}

export function CommentBoard() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [text, setText] = useState('');
  const [deviceId, setDeviceId] = useState<string>('');

  useEffect(() => {
    setComments(readAll());
    setDeviceId(getDeviceId());
  }, []);

  const submit = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (trimmed.length > MAX_TEXT) return;
    const next: Comment = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      playerSlot: selectedSlot ?? -1, // -1 = 선수 미선택 (응원 일반)
      text: trimmed,
      ts: Date.now(),
      deviceId,
    };
    const list = [next, ...readAll()];
    writeAll(list);
    setComments(list.slice(0, MAX_ITEMS));
    setText('');
    setSelectedSlot(null);
  }, [text, selectedSlot, deviceId]);

  const handleDelete = useCallback(
    (id: string) => {
      const list = readAll().filter((c) => c.id !== id);
      writeAll(list);
      setComments(list);
    },
    [],
  );

  const canSubmit = text.trim().length > 0 && text.length <= MAX_TEXT;

  const sortedComments = useMemo(() => [...comments].sort((a, b) => b.ts - a.ts), [comments]);

  return (
    <section
      aria-label="익명 한줄 코멘트 게시판"
      style={{ padding: '8px 8px 16px' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 8px 3px 4px',
            borderRadius: 6,
            background: 'linear-gradient(180deg, var(--magu-sky), #2A88E8)',
            color: '#0F1421',
            fontSize: 11,
            fontWeight: 900,
            boxShadow: '0 2px 0 #1A6FB8',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={icon('fire')} alt="" width={16} height={16} className="magu-pixel" />
          익명
        </span>
        <h2 className="font-brand-magu" style={{ margin: 0, fontSize: 18, color: 'var(--magu-text-1)' }}>
          팬 한줄 보드
        </h2>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--magu-text-3)' }}>
          {comments.length} / {MAX_ITEMS}
        </span>
      </div>

      {/* 입력 영역 */}
      <div
        className="magu-panel"
        style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}
      >
        {/* 선수 아이콘 선택 (선택사항) */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 10, color: 'var(--magu-text-3)', fontWeight: 700 }}>
              선호 선수 <span style={{ color: 'var(--magu-text-dim, #5D6786)', fontWeight: 400 }}>(선택)</span>
            </span>
            {selectedSlot !== null ? (
              <button
                type="button"
                onClick={() => setSelectedSlot(null)}
                style={{
                  fontSize: 10, color: 'var(--magu-text-3)',
                  background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
                }}
              >
                해제
              </button>
            ) : null}
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: 4,
            }}
          >
            {KIA_LINEUP_NAMES.map((name, idx) => {
              const src = playerByLineupSlot(idx);
              if (!src) return null;
              const active = selectedSlot === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedSlot(active ? null : idx)}
                  aria-label={`${name} 선택`}
                  aria-pressed={active}
                  title={name}
                  style={{
                    aspectRatio: '1 / 1',
                    border: active ? '2px solid var(--magu-gold)' : '2px solid var(--magu-line)',
                    borderRadius: 8,
                    background: active
                      ? 'linear-gradient(180deg, rgba(255,201,60,.25), rgba(184,144,32,.15))'
                      : 'rgba(0,0,0,.2)',
                    padding: 0,
                    cursor: 'pointer',
                    overflow: 'hidden',
                    boxShadow: active ? '0 0 8px rgba(255,201,60,.5)' : 'none',
                    position: 'relative',
                    transition: 'transform .08s',
                    minHeight: 44,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt=""
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'center top',
                    }}
                  />
                  <span
                    style={{
                      position: 'absolute', left: 0, right: 0, bottom: 0,
                      fontSize: 9, fontWeight: 900,
                      background: 'rgba(0,0,0,.7)', color: '#fff',
                      padding: '1px 0',
                      letterSpacing: -0.3,
                    }}
                  >
                    {name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 텍스트 입력 */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'stretch' }}>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX_TEXT))}
            placeholder="응원의 한 마디… (익명)"
            maxLength={MAX_TEXT}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && canSubmit) {
                e.preventDefault();
                submit();
              }
            }}
            style={{
              flex: 1,
              minWidth: 0,
              height: 36,
              padding: '0 10px',
              fontSize: 13,
              color: 'var(--magu-text-1)',
              background: 'rgba(0,0,0,.3)',
              border: '1px solid var(--magu-line)',
              borderRadius: 8,
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            style={{
              height: 36,
              padding: '0 14px',
              fontSize: 12,
              fontWeight: 900,
              color: canSubmit ? '#fff' : 'var(--magu-text-3)',
              background: canSubmit
                ? 'linear-gradient(180deg, var(--magu-kia-red), var(--magu-kia-red-deep))'
                : 'var(--magu-panel-deep)',
              border: 'none',
              borderRadius: 8,
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              boxShadow: canSubmit ? '0 2px 0 #5A0F12' : 'none',
              flexShrink: 0,
            }}
          >
            게시
          </button>
        </div>
        <div style={{ fontSize: 9, color: 'var(--magu-text-3)', textAlign: 'right' }}>
          {text.length} / {MAX_TEXT}
        </div>
      </div>

      {/* 코멘트 리스트 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
        {sortedComments.length === 0 ? (
          <p style={{ padding: '16px 0', textAlign: 'center', color: 'var(--magu-text-3)', fontSize: 11 }}>
            아직 코멘트가 없어요. 첫 응원 메시지를 남겨주세요 ⚾
          </p>
        ) : (
          sortedComments.map((c) => (
            <CommentRow
              key={c.id}
              comment={c}
              isMine={c.deviceId === deviceId}
              onDelete={() => handleDelete(c.id)}
            />
          ))
        )}
      </div>

      <p style={{ marginTop: 8, fontSize: 9, color: 'var(--magu-text-dim, #5D6786)', textAlign: 'center', lineHeight: 1.4 }}>
        ⓘ 이 기기에만 저장됩니다. 다른 기기/사용자에게는 보이지 않아요.
        <br />
        욕설·개인 정보·도배는 자제해주세요.
      </p>
    </section>
  );
}

function CommentRow({
  comment,
  isMine,
  onDelete,
}: {
  comment: Comment;
  isMine: boolean;
  onDelete: () => void;
}) {
  const hasPlayer = comment.playerSlot >= 0;
  const src = hasPlayer ? playerByLineupSlot(comment.playerSlot) : null;
  const name = hasPlayer ? (KIA_LINEUP_NAMES[comment.playerSlot] ?? '?') : '응원';
  return (
    <article
      style={{
        display: 'grid',
        gridTemplateColumns: '28px 1fr auto',
        gap: 6,
        alignItems: 'center',
        padding: '6px 8px',
        background: 'linear-gradient(180deg, var(--magu-panel), var(--magu-panel-deep))',
        border: '1px solid var(--magu-line)',
        borderRadius: 8,
        boxShadow: '0 1px 0 #0A0F1C',
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 6,
          overflow: 'hidden',
          background: hasPlayer ? 'rgba(0,0,0,.3)' : 'var(--magu-kia-red)',
          border: '1px solid var(--magu-line-light)',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        {src ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={src}
            alt={name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center top',
            }}
          />
        ) : (
          <span style={{ fontSize: 14, color: '#fff' }} aria-hidden>📣</span>
        )}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12, color: 'var(--magu-text-1)', lineHeight: 1.3, wordBreak: 'break-word' }}>
          {comment.text}
        </div>
        <div style={{ fontSize: 9, color: 'var(--magu-text-3)', marginTop: 2 }}>
          {hasPlayer ? (
            <span style={{ color: 'var(--magu-gold)', fontWeight: 700 }}>{name}</span>
          ) : (
            <span style={{ color: 'var(--magu-text-2)', fontWeight: 700 }}>전체 응원</span>
          )}
          {' · '}익명 {comment.deviceId.slice(1, 5)}
          {' · '}{timeAgo(comment.ts)}
        </div>
      </div>
      {isMine ? (
        <button
          type="button"
          onClick={onDelete}
          aria-label="내 코멘트 삭제"
          title="내 코멘트 삭제"
          style={{
            width: 22,
            height: 22,
            borderRadius: 4,
            background: 'transparent',
            border: '1px solid var(--magu-line)',
            color: 'var(--magu-text-3)',
            fontSize: 12,
            cursor: 'pointer',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          ×
        </button>
      ) : null}
    </article>
  );
}
