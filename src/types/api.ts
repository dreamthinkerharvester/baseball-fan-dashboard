// Design Ref: §4.3 — Common API response shape + ErrorCode union.

export type ErrorCode =
  | 'STALE_CACHE'
  | 'NO_GAME'
  | 'PLAYER_NOT_FOUND'
  | 'INVALID_TEAM'
  | 'INVALID_DATE'
  | 'INTERNAL'
  | 'RATE_LIMITED';

export interface ApiError {
  code: ErrorCode;
  message: string;
  details?: unknown;
}

export interface ApiMeta {
  updatedAt?: string;
  source?: 'kbo' | 'statiz' | 'cache';
  fallback?: 'stale-cache';
  totalGames?: number;
  expectedAt?: string;
  [key: string]: unknown;
}

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  meta?: ApiMeta;
}

/** Helper to construct success responses. */
export function ok<T>(data: T, meta?: ApiMeta): ApiResponse<T> {
  return { data, error: null, ...(meta ? { meta } : {}) };
}

/** Helper to construct error responses. */
export function err(code: ErrorCode, message: string, details?: unknown): ApiResponse<never> {
  return { data: null, error: { code, message, details } };
}
