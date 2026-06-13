// Basic a11y smoke checks. (Lighthouse / axe-core 통합은 Polish 후속 작업.)

import { expect, test } from '@playwright/test';

test.describe('Accessibility smoke', () => {
  test('home page has lang=ko', async ({ page }) => {
    await page.goto('/');
    const lang = await page.evaluate(() => document.documentElement.lang);
    expect(lang).toBe('ko');
  });

  test('header h1 exists', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('saber toggle is a labelled switch (WCAG)', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('switch', { name: '클래식 스탯 보기' })).toBeVisible();
  });

  test('modal opens from roster row and closes with Escape', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('row', { name: /김도영/ }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 8_000 });
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
  });
});
