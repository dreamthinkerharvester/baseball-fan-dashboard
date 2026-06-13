// TS-03 — Empty Lineup (pending) state (Design §8.4 #3).
// 피벗: KIA 고정. 라인업 API에 pending 응답을 mock해 placeholder 렌더 검증.

import { expect, test } from '@playwright/test';

test.describe('TS-03: Empty lineup placeholder', () => {
  test('displays placeholder + refresh button when lineup is pending', async ({ page }) => {
    // 라인업 API에 pending 응답을 mock (KIA)
    await page.route('**/api/lineup/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            gameId: '20260614-KIA-DOOSAN-1',
            teamCode: 'KIA',
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
