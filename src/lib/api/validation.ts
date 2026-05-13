// Design Ref: §4.3, §6 — API Route 진입 시 query/path zod 검증.
// 모든 API Route가 이 헬퍼를 통해 일관된 400 응답 셰입을 보장.

import { type ZodSchema, z } from 'zod';

import { TEAM_CODES } from '@/lib/constants';
import { isValidDateString } from '@/lib/date';
import { err, type ApiResponse } from '@/types';

export const TeamCodeSchema = z.enum(TEAM_CODES as unknown as [string, ...string[]]);

export const DateStringSchema = z
  .string()
  .refine(isValidDateString, { message: 'date must be YYYY-MM-DD (KST)' });

export const RangeSchema = z.enum(['day', 'week', 'month']);

export const PlayerIdSchema = z.string().regex(/^\d{1,8}$/, 'player id must be 1-8 digits');

export interface ParsedQuery<T> {
  ok: true;
  data: T;
}
export interface ParsedQueryError {
  ok: false;
  response: ApiResponse<never>;
  status: number;
}

export function parseQuery<T>(
  schema: ZodSchema<T>,
  input: unknown,
  errorCode: 'INVALID_TEAM' | 'INVALID_DATE' | 'INTERNAL' = 'INTERNAL',
  status = 400,
): ParsedQuery<T> | ParsedQueryError {
  const result = schema.safeParse(input);
  if (result.success) return { ok: true, data: result.data };
  return {
    ok: false,
    status,
    response: err(errorCode, '입력 값이 올바르지 않습니다.', {
      issues: result.error.issues.map((i) => ({ path: i.path, message: i.message })),
    }),
  };
}
