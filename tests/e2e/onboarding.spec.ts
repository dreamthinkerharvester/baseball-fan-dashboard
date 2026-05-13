// TS-01 — First-visit Onboarding (Design §8.4 #1).
// Verifies: 팀 선택 화면 표시 → "LG" 클릭 → 대시보드 즉시 전환 → localStorage 저장 → 새로고침 후 유지.

import { expect, test } from '@playwright/test';

test.describe('TS-01: First-visit onboarding', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
    await context.addInitScript(() => {
      window.localStorage.removeItem('baseball_myteam');
    });
  });

  test('shows team selection on first visit', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: '응원하는 팀을 선택해주세요' })).toBeVisible({
      timeout: 2_000,
    });
    await expect(page.getByRole('button', { name: /LG 트윈스 선택/ })).toBeVisible();
  });

  test('selecting a team transitions to dashboard without reload', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /LG 트윈스 선택/ }).click();

    // 대시보드 마커: 마이팀 라인업 섹션
    await expect(page.getByRole('heading', { name: /마이팀 라인업/ })).toBeVisible();

    // localStorage 저장 확인
    const stored = await page.evaluate(() => window.localStorage.getItem('baseball_myteam'));
    expect(stored).toBe('LG');
  });

  test('myTeam survives page reload', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /LG 트윈스 선택/ }).click();
    await expect(page.getByRole('heading', { name: /마이팀 라인업/ })).toBeVisible();

    await page.reload();
    // 새로고침 후 즉시 대시보드 (팀 선택 화면 X)
    await expect(page.getByRole('heading', { name: /마이팀 라인업/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: '응원하는 팀을 선택해주세요' })).toHaveCount(0);
  });

  test('"그냥 둘러보기" enters dashboard without setting myTeam', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: '그냥 둘러보기' }).click();
    await expect(page.getByText('마이팀을 설정하면')).toBeVisible();

    const stored = await page.evaluate(() => window.localStorage.getItem('baseball_myteam'));
    expect(stored).toBeNull();
  });
});
