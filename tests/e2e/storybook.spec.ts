// E2E: kia-player-storybook — Design Ref §6.2.

import { expect, test } from '@playwright/test';

test.describe('Storybook page', () => {
  test('E1: 김도영 검색 → 결과 → 복사 마크다운 확인', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/storybook');

    await expect(page.getByRole('heading', { level: 1 })).toContainText('Storybook');

    const input = page.getByPlaceholder('기아 선수명 입력 (예: 김도영)');
    await input.fill('김도영');

    const suggestion = page.getByRole('button', { name: /^김도영/ });
    await suggestion.first().click();

    // 결과 로딩 후 ResultPanel 노출
    await expect(page.getByText('① 오늘의 경기')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/② 전성기/)).toBeVisible();
    await expect(page.getByText(/③ 과거 뉴스/)).toBeVisible();
    await expect(page.getByText(/④ 선수 서사/)).toBeVisible();

    // 마크다운 미리보기
    await expect(page.getByText('📝 블로그 초안 미리보기')).toBeVisible();

    // 복사 버튼 동작
    const copyBtn = page.getByRole('button', { name: /마크다운 복사/ });
    await copyBtn.click();
    await expect(page.getByRole('button', { name: /복사됨/ })).toBeVisible();

    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboard).toContain('# 김도영');
    expect(clipboard.length).toBeGreaterThan(500);
  });

  test('E3: 이미지 갤러리 클릭 → 슬롯에 자동 삽입', async ({ page }) => {
    await page.goto('/storybook');
    await page.getByPlaceholder('기아 선수명 입력 (예: 김도영)').fill('김도영');
    await page.getByRole('button', { name: /^김도영/ }).first().click();

    await expect(page.getByText(/이미지 풀 \(\d+장\)/)).toBeVisible({ timeout: 10_000 });

    // 갤러리 첫 이미지 클릭
    const firstImage = page.locator('button:has(img[loading="lazy"])').first();
    const imageCount = await page.locator('button:has(img[loading="lazy"])').count();
    if (imageCount > 0) {
      await firstImage.click();
      // 슬롯 1에 자동 채워졌는지 (사용중 라벨)
      await expect(page.getByText('사용중').first()).toBeVisible();
    }
  });
});
