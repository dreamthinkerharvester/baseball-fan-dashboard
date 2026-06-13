// 비정상 localStorage 조작 시 안전 동작 (피벗: 세이버 모드 키 기준).
// 팀 선택 폴백은 제거됨 — 어떤 값이든 KIA 대시보드가 정상 렌더되어야 한다.

import { expect, test } from '@playwright/test';

test('손상된 saber_mode 값이어도 대시보드가 정상 렌더된다', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('kia_saber_mode', 'GARBAGE');
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '타이거즈 카드' })).toBeVisible({ timeout: 5_000 });
  // 잘못된 값은 디폴트(숨김=true)로 처리 → 토글 aria-checked=false
  await expect(page.getByRole('switch', { name: '클래식 스탯 보기' })).toHaveAttribute(
    'aria-checked',
    'false',
  );
});

test('구 멀티팀 키가 있어도 무시되고 KIA 대시보드가 뜬다', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('baseball_myteam', 'INVALID_TEAM_CODE');
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '타이거즈 카드' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '응원하는 팀을 선택해주세요' })).toHaveCount(0);
});
