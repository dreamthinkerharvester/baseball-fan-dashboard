// Design Ref: §10.4 — KST 고정 날짜 헬퍼.
// All KBO operations are in Asia/Seoul timezone.

import { format, parseISO } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

export const KST = 'Asia/Seoul';

/** 현재 KST 시각 (Date 객체, UTC 기반이지만 표시는 KST 변환 필수). */
export function nowKst(): Date {
  return toZonedTime(new Date(), KST);
}

/** YYYY-MM-DD (KST) — 오늘 날짜 문자열. */
export function todayKstString(now: Date = new Date()): string {
  return formatInTimeZone(now, KST, 'yyyy-MM-dd');
}

/** ISO datetime string (KST timezone offset 포함). */
export function isoKst(now: Date = new Date()): string {
  return formatInTimeZone(now, KST, "yyyy-MM-dd'T'HH:mm:ssXXX");
}

/** YYYY-MM-DD 형식 검증 (zod 외 빠른 가드용). */
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
export function isValidDateString(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  if (!DATE_PATTERN.test(value)) return false;
  const parsed = parseISO(value);
  return !Number.isNaN(parsed.getTime());
}

/** 사용자 표시용 한국어 날짜. e.g., "2026-05-09" → "5/9 (금)". */
export function formatKoreanShortDate(dateStr: string): string {
  const date = parseISO(dateStr);
  const [m, d] = format(date, 'M-d').split('-');
  const dow = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()] ?? '';
  return `${m}/${d} (${dow})`;
}
