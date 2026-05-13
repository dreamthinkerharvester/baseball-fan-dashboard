// TS-05 — Abuse: 비정상 localStorage 조작 시 안전 폴백 (Design §8.4 #7).

import { expect, test } from '@playwright/test';

test('TS-05: invalid localStorage value falls back to team selection', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('baseball_myteam', 'INVALID_TEAM_CODE');
  });
  await page.goto('/');
  // 잘못된 값은 무시되고 팀 선택 화면 노출
  await expect(page.getByRole('heading', { name: '응원하는 팀을 선택해주세요' })).toBeVisible({
    timeout: 3_000,
  });
});

test('TS-05: numeric localStorage value also rejected', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('baseball_myteam', '12345');
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '응원하는 팀을 선택해주세요' })).toBeVisible();
});
