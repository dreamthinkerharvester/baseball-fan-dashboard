// 공유 익명 한줄 코멘트 게시판 — Vercel KV backed.
// GET /api/comments → list / POST → 게시 / DELETE?id=... → 본인 코멘트 삭제

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import useSWR from 'swr';

import { fetcher } from '@/lib/api-client';
import { icon, playerByLineupSlot } from '@/lib/assets-magu';

const DEVICE_ID_KEY = 'bfd:comments:device-id';
const MAX_TEXT = 60;
const MAX_ITEMS = 30;

interface Comment {
  id: string;
  playerSlot: number; // 0~8 KIA 라인업, -1 = 미선택
  text: string;
  ts: number;
  deviceId: string;
}

const KIA_LINEUP_NAMES: readonly string[] = [
  '김도영', '박찬호', '최형우', '최정', '변우혁',
  '소크라테스', '나성범', '한승택', '윤도현',
];

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
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [text, setText] = useState('');
  const [deviceId, setDeviceId] = useState<string>('');
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

  const { data: comments = [], mutate, isLoading, error: loadError } = useSWR<Comment[]>(
    '/api/comments',
    fetcher,
    {
      refreshInterval: 30_000, // 30초마다 자동 갱신
      revalidateOnFocus: true,
    },
  );

  useEffect(() => {
    setDeviceId(getDeviceId());
  }, []);

  const submit = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (trimmed.length > MAX_TEXT) return;
    setPosting(true);
    setPostError(null);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerSlot: selectedSlot ?? -1,
          text: trimmed,
          deviceId,
        }),
        cache: 'no-store',
      });
      const body = (await res.json()) as { data?: Comment[]; error?: { message?: string } };
      if (body.error) throw new Error(body.error.message ?? '게시 실패');
      if (body.data) await mutate(body.data, { revalidate: false });
      setText('');
      setSelectedSlot(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '게시 실패';
      setPostError(msg);
    } finally {
      setPosting(false);
    }
  }, [text, selectedSlot, deviceId, mutate]);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/comments?id=${encodeURIComponent(id)}`, {
          method: 'DELETE',
          headers: { 'x-device-id': deviceId },
          cache: 'no-store',
        });
        const body = (await res.json()) as { data?: Comment[]; error?: { message?: string } };
        if (body.error) throw new Error(body.error.message ?? '삭제 실패');
        if (body.data) await mutate(body.data, { revalidate: false });
      } catch {
        /* show toast in future */
      }
    },
    [deviceId, mutate],
  );

  const canSubmit = text.trim().length > 0 && text.length <= MAX_TEXT && !posting;
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
          익명 · 공유
        </span>
        <h2 className="font-brand-magu" style={{ margin: 0, fontSize: 18, color: 'var(--magu-text-1)' }}>
          팬 한줄 보드
        </h2>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--magu-text-3)' }}>
          {comments.length} / {MAX_ITEMS}
        </span>
      </div>

      {/* KV 미설정 시 에러 안내 */}
      {loadError && (loadError as Error)?.message?.includes('KV') ? (
        <div
          style={{
            padding: '8px 10px',
            background: 'rgba(232,58,63,.1)',
            border: '1px solid var(--magu-kia-red)',
            borderRadius: 8,
            fontSize: 11,
            color: 'var(--magu-text-2)',
            marginBottom: 8,
          }}
        >
          ⚠ 공유 게시판이 아직 활성화되지 않았습니다. Vercel 대시보드에서 KV를 활성화해주세요.
        </div>
      ) : null}

      {/* 입력 영역 */}
      <div className="magu-panel" style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
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
                style={{ fontSize: 10, color: 'var(--magu-text-3)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                해제
              </button>
            ) : null}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4 }}>
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
                    minHeight: 44,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
                  />
                  <span
                    style={{
                      position: 'absolute', left: 0, right: 0, bottom: 0,
                      fontSize: 9, fontWeight: 900,
                      background: 'rgba(0,0,0,.7)', color: '#fff',
                      padding: '1px 0', letterSpacing: -0.3,
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
            placeholder="응원의 한 마디… (익명 공유)"
            maxLength={MAX_TEXT}
            disabled={posting}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && canSubmit) {
                e.preventDefault();
                void submit();
              }
            }}
            style={{
              flex: 1, minWidth: 0, height: 36, padding: '0 10px',
              fontSize: 13, color: 'var(--magu-text-1)',
              background: 'rgba(0,0,0,.3)', border: '1px solid var(--magu-line)',
              borderRadius: 8, outline: 'none', fontFamily: 'inherit',
            }}
          />
          <button
            type="button"
            onClick={() => { void submit(); }}
            disabled={!canSubmit}
            style={{
              height: 36, padding: '0 14px', fontSize: 12, fontWeight: 900,
              color: canSubmit ? '#fff' : 'var(--magu-text-3)',
              background: canSubmit
                ? 'linear-gradient(180deg, var(--magu-kia-red), var(--magu-kia-red-deep))'
                : 'var(--magu-panel-deep)',
              border: 'none', borderRadius: 8,
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              boxShadow: canSubmit ? '0 2px 0 #5A0F12' : 'none', flexShrink: 0,
            }}
          >
            {posting ? '게시중…' : '게시'}
          </button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 9 }}>
          <span style={{ color: postError ? 'var(--magu-kia-red)' : 'transparent' }}>{postError ?? '·'}</span>
          <span style={{ color: 'var(--magu-text-3)' }}>{text.length} / {MAX_TEXT}</span>
        </div>
      </div>

      {/* 코멘트 리스트 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
        {isLoading ? (
          <p style={{ padding: '16px 0', textAlign: 'center', color: 'var(--magu-text-3)', fontSize: 11 }}>
            불러오는 중…
          </p>
        ) : sortedComments.length === 0 ? (
          <p style={{ padding: '16px 0', textAlign: 'center', color: 'var(--magu-text-3)', fontSize: 11 }}>
            아직 코멘트가 없어요. 첫 응원 메시지를 남겨주세요 ⚾
          </p>
        ) : (
          sortedComments.map((c) => (
            <CommentRow
              key={c.id}
              comment={c}
              isMine={c.deviceId === deviceId}
              onDelete={() => { void handleDelete(c.id); }}
            />
          ))
        )}
      </div>

      <p style={{ marginTop: 8, fontSize: 9, color: 'var(--magu-text-dim, #5D6786)', textAlign: 'center', lineHeight: 1.4 }}>
        ⓘ 모든 방문자가 함께 보는 공유 게시판입니다. 욕설·개인 정보·도배는 자제해주세요.
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
          width: 28, height: 28, borderRadius: 6, overflow: 'hidden',
          background: hasPlayer ? 'rgba(0,0,0,.3)' : 'var(--magu-kia-red)',
          border: '1px solid var(--magu-line-light)',
          display: 'grid', placeItems: 'center',
        }}
      >
        {src ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={src}
            alt={name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
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
            width: 22, height: 22, borderRadius: 4,
            background: 'transparent', border: '1px solid var(--magu-line)',
            color: 'var(--magu-text-3)', fontSize: 12, cursor: 'pointer',
            display: 'grid', placeItems: 'center',
          }}
        >
          ×
        </button>
      ) : null}
    </article>
  );
}
