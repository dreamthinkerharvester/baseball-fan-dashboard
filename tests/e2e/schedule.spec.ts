// Schedule list / tabs / status badges.

import { expect, test } from '@playwright/test';

test.describe('Schedule list', () => {
  // 피벗: 팀 선택 온보딩 제거 — KIA 고정이라 별도 setup 불필요.

  test('renders default day schedule', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: '경기 일정' })).toBeVisible();
  });

  test('range tabs are accessible', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('tab', { name: '오늘' })).toBeVisible();
    await expect(page.getByRole('tab', { name: '이번 주' })).toBeVisible();
    await expect(page.getByRole('tab', { name: '이번 달' })).toBeVisible();
  });

  test('switching to week tab updates active state', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('tab', { name: '이번 주' }).click();
    await expect(page.getByRole('tab', { name: '이번 주', selected: true })).toBeVisible();
  });
});
