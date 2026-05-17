// Anonymous comment board API — Vercel KV backed.
// GET    /api/comments           → list (newest first, max 30)
// POST   /api/comments           → append (body: { playerSlot, text, deviceId })
// DELETE /api/comments?id=...    → delete (requires header x-device-id matching)

import { kv } from '@vercel/kv';
import { NextResponse, type NextRequest } from 'next/server';

import { err, ok } from '@/types';

import type { ApiResponse } from '@/types';

const KV_KEY = 'comments:v1';
const MAX_ITEMS = 30;
const MAX_TEXT = 60;

interface Comment {
  id: string;
  playerSlot: number; // 0~8 KIA 라인업, -1 = 미선택
  text: string;
  ts: number;
  deviceId: string;
}

function isKvEnabled(): boolean {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

async function readAll(): Promise<Comment[]> {
  if (!isKvEnabled()) return [];
  const raw = await kv.get<Comment[]>(KV_KEY);
  return Array.isArray(raw) ? raw : [];
}

async function writeAll(list: Comment[]): Promise<void> {
  await kv.set(KV_KEY, list.slice(0, MAX_ITEMS));
}

function jsonResp<T>(body: ApiResponse<T>, status = 200): NextResponse<ApiResponse<T>> {
  const res = NextResponse.json(body, { status });
  res.headers.set('Cache-Control', 'no-store');
  return res;
}

export async function GET() {
  if (!isKvEnabled()) {
    return jsonResp(err('INTERNAL', 'Vercel KV가 설정되지 않았습니다. 환경변수 KV_REST_API_URL / KV_REST_API_TOKEN 확인.'), 503);
  }
  try {
    const list = await readAll();
    return jsonResp(ok(list, { source: 'cache' }));
  } catch {
    return jsonResp(err('INTERNAL', '코멘트 로드 실패'), 500);
  }
}

export async function POST(req: NextRequest) {
  if (!isKvEnabled()) {
    return jsonResp(err('INTERNAL', 'Vercel KV가 설정되지 않았습니다.'), 503);
  }
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
    const list = await readAll();
    const next = [newComment, ...list].slice(0, MAX_ITEMS);
    await writeAll(next);
    return jsonResp(ok(next, { source: 'cache' }));
  } catch {
    return jsonResp(err('INTERNAL', '코멘트 저장 실패'), 500);
  }
}

export async function DELETE(req: NextRequest) {
  if (!isKvEnabled()) {
    return jsonResp(err('INTERNAL', 'Vercel KV가 설정되지 않았습니다.'), 503);
  }
  const id = req.nextUrl.searchParams.get('id');
  const deviceId = req.headers.get('x-device-id');
  if (!id) return jsonResp(err('INTERNAL', 'id 필요'), 400);
  if (!deviceId) return jsonResp(err('INTERNAL', 'x-device-id 헤더 필요'), 401);

  try {
    const list = await readAll();
    const target = list.find((c) => c.id === id);
    if (!target) return jsonResp(err('INTERNAL', '대상 없음'), 404);
    if (target.deviceId !== deviceId) {
      return jsonResp(err('INTERNAL', '본인 디바이스 코멘트만 삭제 가능'), 403);
    }
    const next = list.filter((c) => c.id !== id);
    await writeAll(next);
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
