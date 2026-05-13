// Storybook API — GET /api/storybook/[id]?date=YYYY-MM-DD
// Design Ref: kia-player-storybook.design.md §7.

import { type NextRequest } from 'next/server';

import { jsonResponse } from '@/lib/api/response';
import { DateStringSchema, PlayerIdSchema, parseQuery } from '@/lib/api/validation';
import { todayKstString } from '@/lib/date';
import { buildStorybook } from '@/services/storybook';
import { err, ok } from '@/types';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const idRes = parseQuery(PlayerIdSchema, params.id, 'INTERNAL');
  if (!idRes.ok) return jsonResponse(idRes.response, { status: idRes.status });

  const dateParam = req.nextUrl.searchParams.get('date') ?? todayKstString();
  const dateRes = parseQuery(DateStringSchema, dateParam, 'INVALID_DATE');
  if (!dateRes.ok) return jsonResponse(dateRes.response, { status: dateRes.status });

  try {
    const { storybook, status } = await buildStorybook(idRes.data as string, dateRes.data as string);

    if (status === 404 || !storybook) {
      return jsonResponse(err('PLAYER_NOT_FOUND', '선수 정보를 찾을 수 없습니다.'), { status: 404 });
    }
    if (status === 422) {
      return jsonResponse(
        err('INTERNAL', 'Phase 1은 KIA 타이거즈 선수만 지원합니다.'),
        { status: 422 },
      );
    }

    return jsonResponse(ok(storybook, { updatedAt: storybook.generatedAt }), {
      cacheSeconds: 3600,
      swrSeconds: 86400,
    });
  } catch {
    return jsonResponse(err('INTERNAL', '스토리북 생성 중 오류가 발생했습니다.'), { status: 500 });
  }
}
