// TS-02 — Lineup Card Grades (Design §8.4 #2).
// 피벗: KIA 고정. 라인업은 경기일 의존이라 카드가 없으면 graceful skip.
// 세이버 메인 스탯(wRC+/FIP) + 클래식 블러는 saber.spec에서 별도 검증.

import { expect, test } from '@playwright/test';

test.describe('TS-02: Lineup card grades', () => {
  test('라인업 카드가 있으면 등급 배지가 표시된다', async ({ page }) => {
    await page.goto('/');
    const cards = page.locator('[data-grade]');
    // 라인업은 경기일 ±frequency window 의존 — 카드 없으면 이 환경에선 검증 불가
    if ((await cards.count()) === 0) {
      test.skip(true, '현재 시드에 KIA 라인업 카드 없음 (경기일 의존)');
      return;
    }
    await expect(cards.first()).toBeVisible();
    // 각 카드 등급 속성 유효
    const grade = await cards.first().getAttribute('data-grade');
    expect(['elite', 'rare', 'special', 'normal']).toContain(grade);
  });

  test('elite 카드는 glow box-shadow를 가진다', async ({ page }) => {
    await page.goto('/');
    const elite = page.locator('[data-grade="elite"]').first();
    if ((await elite.count()) === 0) {
      test.skip(true, '시드에 elite 라인업 카드 없음');
      return;
    }
    const shadow = await elite.evaluate((el) => getComputedStyle(el).boxShadow);
    expect(shadow).not.toBe('none');
  });
});
