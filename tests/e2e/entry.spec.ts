// kia-fan-service 피벗 — KIA 전용 즉시 진입 (FR-02). 팀 선택 온보딩 제거.
// 검증: 첫 방문에 팀 선택 화면 없이 KIA 대시보드 즉시 표시 + 구 myteam 키 청소.

import { expect, test } from '@playwright/test';

test.describe('KIA 전용 즉시 진입', () => {
  test('첫 방문에 팀 선택 없이 KIA 대시보드가 바로 뜬다', async ({ page }) => {
    await page.goto('/');
    // 헤더 워드마크
    await expect(page.getByRole('heading', { name: '타이거즈 카드' })).toBeVisible({
      timeout: 5_000,
    });
    // 구 온보딩 화면이 없어야 함
    await expect(page.getByRole('heading', { name: '응원하는 팀을 선택해주세요' })).toHaveCount(0);
    // 로스터 표 섹션 표시
    await expect(page.getByRole('heading', { name: /🏏 타자/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: /⚾ 투수/ })).toBeVisible();
  });

  test('구 멀티팀 localStorage 키가 청소된다', async ({ page, context }) => {
    await context.addInitScript(() => {
      window.localStorage.setItem('baseball_myteam', 'LG');
    });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: '타이거즈 카드' })).toBeVisible();
    const legacy = await page.evaluate(() => window.localStorage.getItem('baseball_myteam'));
    expect(legacy).toBeNull();
  });

  test('헤더에 클래식 토글 스위치가 상시 노출된다', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('switch', { name: '클래식 스탯 보기' })).toBeVisible();
  });
});
