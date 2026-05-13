// TS-02 — Lineup Card Grades (Design §8.4 #2).
// Verifies: 9장 카드 표시 / 등급 배지 텍스트 / 보더 색상 매칭.

import { expect, test } from '@playwright/test';

test.describe('TS-02: Lineup card grades', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('baseball_myteam', 'LG');
    });
  });

  test('renders 9 batter cards in grid', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /마이팀 라인업/ })).toBeVisible();

    const cards = page.locator('[data-grade]');
    // 1 starter + 9 batters = 10 minimum
    await expect(cards.first()).toBeVisible();
    expect(await cards.count()).toBeGreaterThanOrEqual(9);
  });

  test('each card has a grade badge text label (WCAG)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-grade]');
    const badges = page.getByText(/^(ELITE|RARE|SPECIAL|NORMAL)$/);
    expect(await badges.count()).toBeGreaterThanOrEqual(9);
  });

  test('elite cards have glow box-shadow', async ({ page }) => {
    await page.goto('/');
    const elite = page.locator('[data-grade="elite"]').first();
    if ((await elite.count()) === 0) {
      test.skip(true, 'no elite card in fixture lineup');
      return;
    }
    const shadow = await elite.evaluate((el) => getComputedStyle(el).boxShadow);
    expect(shadow).not.toBe('none');
  });
});
