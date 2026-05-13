// TS-03 — Empty Lineup (pending) state (Design §8.4 #3).
// Fixture seeds LG-2026-05-10.json with status="pending".
// We force date param via URL to hit the pending fixture.

import { expect, test } from '@playwright/test';

test.describe('TS-03: Empty lineup placeholder', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('baseball_myteam', 'LG');
    });
  });

  test('displays placeholder + refresh button when lineup is pending', async ({ page }) => {
    // 라인업 API에 pending 응답을 mock
    await page.route('**/api/lineup/LG**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            gameId: '20260510-LG-KT-1',
            teamCode: 'LG',
            startingPitcher: null,
            battingOrder: [],
            status: 'pending',
            fetchedAt: new Date().toISOString(),
            source: 'cache',
          },
          error: null,
          meta: { source: 'cache' },
        }),
      });
    });

    await page.goto('/');
    await expect(page.getByText(/라인업 미확정/)).toBeVisible();
    await expect(page.getByRole('button', { name: /새로고침/ })).toBeVisible();

    // 9장 placeholder 카드 (animate-pulse)
    const placeholders = page.locator('ul[aria-label="라인업 placeholder"] li');
    await expect(placeholders).toHaveCount(9);
  });
});
