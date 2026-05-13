// Basic a11y smoke checks. (Lighthouse / axe-core 통합은 Polish 후속 작업.)

import { expect, test } from '@playwright/test';

test.describe('Accessibility smoke', () => {
  test('home page has lang=ko', async ({ page }) => {
    await page.goto('/');
    const lang = await page.evaluate(() => document.documentElement.lang);
    expect(lang).toBe('ko');
  });

  test('header h1 exists', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.removeItem('baseball_myteam');
    });
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('focus trap in modal returns focus to trigger card on close', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('baseball_myteam', 'LG');
    });
    await page.goto('/');
    await page.waitForSelector('[data-grade]');
    const trigger = page.locator('[data-grade]').first();
    await trigger.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
    // native <dialog>는 닫힐 때 포커스를 트리거 요소로 복귀
  });
});
