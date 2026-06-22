// Anonymous comment board API — Cloudflare KV backed (binding: COMMENTS_KV).
// GET    /api/comments           → list (newest first, max 30)
// POST   /api/comments           → append (body: { playerSlot, text, deviceId })
// DELETE /api/comments?id=...    → delete (requires header x-device-id matching)

import { getCloudflareContext } from '@opennextjs/cloudflare';
import { NextResponse, type NextRequest } from 'next/server';

import { err, ok } from '@/types';

import type { ApiResponse } from '@/types';

// KV binding is resolved per-request → never statically prerendered.
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const KV_KEY = 'comments:v1';
const MAX_ITEMS = 30;
const MAX_TEXT = 60;

/** Minimal slice of the Workers KVNamespace we use (avoids workers-types dep). */
interface KvLike {
  get(key: string, type: 'json'): Promise<unknown>;
  put(key: string, value: string): Promise<void>;
}

interface Comment {
  id: string;
  playerSlot: number; // 0~8 KIA 라인업, -1 = 미선택
  text: string;
  ts: number;
  deviceId: string;
}

/** The COMMENTS_KV binding, or null when unavailable (local build / misconfig). */
function getKv(): KvLike | null {
  try {
    const { env } = getCloudflareContext();
    return (env as { COMMENTS_KV?: KvLike }).COMMENTS_KV ?? null;
  } catch {
    return null;
  }
}

async function readAll(kv: KvLike): Promise<Comment[]> {
  const raw = (await kv.get(KV_KEY, 'json')) as Comment[] | null;
  return Array.isArray(raw) ? raw : [];
}

async function writeAll(kv: KvLike, list: Comment[]): Promise<void> {
  await kv.put(KV_KEY, JSON.stringify(list.slice(0, MAX_ITEMS)));
}

function jsonResp<T>(
  body: ApiResponse<T>,
  status = 200,
  cache: 'list' | 'no-store' = 'no-store',
): NextResponse<ApiResponse<T>> {
  const res = NextResponse.json(body, { status });
  if (cache === 'list' && status === 200) {
    // 목록 GET — Edge cache 10s + SWR 20s 로 KV 호출 감소.
    // 게시한 사용자는 mutate로 즉시 자기 화면에 반영됨.
    // 다른 사용자에게는 최대 ~30초 지연. 무료 한도 보수화.
    res.headers.set(
      'Cache-Control',
      'public, max-age=0, s-maxage=10, stale-while-revalidate=20',
    );
  } else {
    res.headers.set('Cache-Control', 'no-store');
  }
  return res;
}

const KV_MISSING = '댓글 저장소(Cloudflare KV)가 설정되지 않았습니다.';

export async function GET() {
  const kv = getKv();
  if (!kv) return jsonResp(err('INTERNAL', KV_MISSING), 503);
  try {
    const list = await readAll(kv);
    return jsonResp(ok(list, { source: 'cache' }), 200, 'list');
  } catch {
    return jsonResp(err('INTERNAL', '코멘트 로드 실패'), 500);
  }
}

export async function POST(req: NextRequest) {
  const kv = getKv();
  if (!kv) return jsonResp(err('INTERNAL', KV_MISSING), 503);
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResp(err('INTERNAL', 'JSON 파싱 실패'), 400);
  }
  if (!isPostBody(body)) {
    return jsonResp(err('INTERNAL', 'playerSlot, text, deviceId 필요'), 400);
  }
  const text = body.text.trim();
  if (text.length === 0) return jsonResp(err('INTERNAL', '본문이 비어있습니다.'), 400);
  if (text.length > MAX_TEXT) return jsonResp(err('INTERNAL', `최대 ${MAX_TEXT}자`), 400);
  if (body.playerSlot < -1 || body.playerSlot > 8) {
    return jsonResp(err('INTERNAL', 'playerSlot 범위 (-1~8)'), 400);
  }
  if (typeof body.deviceId !== 'string' || body.deviceId.length === 0 || body.deviceId.length > 32) {
    return jsonResp(err('INTERNAL', 'deviceId 유효성 실패'), 400);
  }

  const newComment: Comment = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    playerSlot: body.playerSlot,
    text,
    ts: Date.now(),
    deviceId: body.deviceId,
  };

  try {
    const list = await readAll(kv);
    const next = [newComment, ...list].slice(0, MAX_ITEMS);
    await writeAll(kv, next);
    return jsonResp(ok(next, { source: 'cache' }));
  } catch {
    return jsonResp(err('INTERNAL', '코멘트 저장 실패'), 500);
  }
}

export async function DELETE(req: NextRequest) {
  const kv = getKv();
  if (!kv) return jsonResp(err('INTERNAL', KV_MISSING), 503);
  const id = req.nextUrl.searchParams.get('id');
  const deviceId = req.headers.get('x-device-id');
  if (!id) return jsonResp(err('INTERNAL', 'id 필요'), 400);
  if (!deviceId) return jsonResp(err('INTERNAL', 'x-device-id 헤더 필요'), 401);

  try {
    const list = await readAll(kv);
    const target = list.find((c) => c.id === id);
    if (!target) return jsonResp(err('INTERNAL', '대상 없음'), 404);
    if (target.deviceId !== deviceId) {
      return jsonResp(err('INTERNAL', '본인 디바이스 코멘트만 삭제 가능'), 403);
    }
    const next = list.filter((c) => c.id !== id);
    await writeAll(kv, next);
    return jsonResp(ok(next, { source: 'cache' }));
  } catch {
    return jsonResp(err('INTERNAL', '삭제 실패'), 500);
  }
}

function isPostBody(b: unknown): b is { playerSlot: number; text: string; deviceId: string } {
  return (
    typeof b === 'object' &&
    b !== null &&
    'playerSlot' in b &&
    'text' in b &&
    'deviceId' in b &&
    typeof (b as { playerSlot: unknown }).playerSlot === 'number' &&
    typeof (b as { text: unknown }).text === 'string' &&
    typeof (b as { deviceId: unknown }).deviceId === 'string'
  );
}
