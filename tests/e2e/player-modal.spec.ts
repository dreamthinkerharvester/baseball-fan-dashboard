// US-05 + Design §8.4 #5 — Player modal drilldown (피벗: 로스터 표 행 → 모달).
// 행 클릭 → 모달 → 탭 전환(세이버/클래식/역대) → X/Escape 닫기.

import { expect, test } from '@playwright/test';

async function openModal(page: import('@playwright/test').Page) {
  await page.goto('/');
  // 로스터 표의 김도영 행(role=row) — 댓글판 "김도영 선택" 버튼과 구분
  await page.getByRole('row', { name: /김도영/ }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 8_000 });
}

test.describe('Player modal: drilldown', () => {
  test('roster row click → modal opens (세이버 탭 디폴트)', async ({ page }) => {
    await openModal(page);
    await expect(page.getByRole('button', { name: '세이버' })).toHaveClass(/active/);
  });

  test('switch to career tab', async ({ page }) => {
    await openModal(page);
    await page.getByRole('button', { name: '역대 기록' }).click();
    await expect(page.getByRole('button', { name: '역대 기록' })).toHaveClass(/active/);
  });

  test('switch to classic tab', async ({ page }) => {
    await openModal(page);
    await page.getByRole('button', { name: '클래식' }).click();
    await expect(page.getByRole('button', { name: '클래식' })).toHaveClass(/active/);
  });

  test('Escape closes modal', async ({ page }) => {
    await openModal(page);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
  });

  test('X button closes modal', async ({ page }) => {
    await openModal(page);
    await page.getByRole('button', { name: '닫기' }).first().click();
    await expect(page.getByRole('dialog')).toBeHidden();
  });
});
