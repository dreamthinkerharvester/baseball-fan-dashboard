// US-05 + Design §8.4 #5 — Player modal drilldown.
// Card click → Modal slides up → tab switching → close via X / Escape.

import { expect, test } from '@playwright/test';

test.describe('Player modal: drilldown', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('baseball_myteam', 'LG');
    });
  });

  test('click card → modal opens', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-grade]');
    await page.locator('[data-grade]').first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('switch to career tab', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-grade]');
    await page.locator('[data-grade]').first().click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByRole('tab', { name: '역대 기록' }).click();
    await expect(page.getByRole('tab', { name: '역대 기록', selected: true })).toBeVisible();
  });

  test('Escape closes modal', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-grade]');
    await page.locator('[data-grade]').first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
  });

  test('X button closes modal', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-grade]');
    await page.locator('[data-grade]').first().click();
    await page.getByRole('button', { name: '닫기' }).first().click();
    await expect(page.getByRole('dialog')).toBeHidden();
  });
});
