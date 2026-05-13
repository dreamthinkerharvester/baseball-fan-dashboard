// Design Ref: §9.4 — UI 레이어가 사용하는 SWR fetcher.
// 표준 ApiResponse 셰입을 분해하여 hook은 data/error만 다루도록.

import type { ApiResponse } from '@/types';

export class ApiClientError extends Error {
  code: string;
  status: number;
  details?: unknown;
  constructor(code: string, message: string, status: number, details?: unknown) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    cache: 'no-store', // SWR이 캐시 관리
  });
  let body: ApiResponse<T> | null = null;
  try {
    body = (await res.json()) as ApiResponse<T>;
  } catch {
    throw new ApiClientError('INTERNAL', '응답을 해석할 수 없습니다.', res.status);
  }
  if (body && body.error) {
    throw new ApiClientError(body.error.code, body.error.message, res.status, body.error.details);
  }
  if (!res.ok) {
    throw new ApiClientError('INTERNAL', `HTTP ${res.status}`, res.status);
  }
  if (!body || body.data == null) {
    throw new ApiClientError('INTERNAL', '데이터가 비어있습니다.', res.status);
  }
  return body.data;
}

export const apiClient = {
  fetcher,
  /** 병렬 페치 헬퍼 (대시보드 초기 로드용). */
  async fetchMany<T extends Record<string, string>>(
    map: T,
  ): Promise<{ [K in keyof T]: unknown }> {
    const entries = Object.entries(map);
    const results = await Promise.all(entries.map(([, url]) => fetcher<unknown>(url)));
    return Object.fromEntries(entries.map(([k], i) => [k, results[i]])) as { [K in keyof T]: unknown };
  },
};
