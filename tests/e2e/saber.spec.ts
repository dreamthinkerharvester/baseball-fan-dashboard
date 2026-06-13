// kia-fan-service 피벗 — 세이버 표시 레이어 + Myth-Buster (FR-03/04/05/06).
// 검증: 로스터 표 렌더, 클래식 블러 토글, Myth-Buster 갭, 모달 세이버 탭.

import { expect, test } from '@playwright/test';

test.describe('세이버 로스터 표', () => {
  test('출전순 타자/투수 표에 세이버 지표가 표시된다', async ({ page }) => {
    await page.goto('/');
    // 김도영(타자) 행 + wRC+ 값
    await expect(page.getByText('김도영', { exact: false }).first()).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('178', { exact: false }).first()).toBeVisible();
    // 투수 표 양현종
    await expect(page.getByText('양현종', { exact: false }).first()).toBeVisible();
    // 최근 근황 컬럼 텍스트
    await expect(page.getByText(/최근 5G/).first()).toBeVisible();
  });

  test('클래식 토글로 블러가 해제된다', async ({ page }) => {
    await page.goto('/');
    const toggle = page.getByRole('switch', { name: '클래식 스탯 보기' });
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
  });
});

test.describe('Myth-Buster 패널', () => {
  test('체감 vs 데이터 갭이 표시된다', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /체감 vs 데이터/ })).toBeVisible({
      timeout: 5_000,
    });
    // 최원준 갭 -12 (고평가) 배지
    await expect(page.getByText('최원준', { exact: false }).first()).toBeVisible();
    await expect(page.getByText(/저평가|고평가/).first()).toBeVisible();
  });
});

test.describe('선수 모달', () => {
  test('카드 클릭 시 세이버 탭이 디폴트로 열린다', async ({ page }) => {
    await page.goto('/');
    // 로스터 표의 김도영 행(role=row) 클릭 — 댓글판 "김도영 선택" 버튼과 구분
    await page.getByRole('row', { name: /김도영/ }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 8_000 });
    // 세이버 탭이 활성
    const saberTab = page.getByRole('button', { name: '세이버' });
    await expect(saberTab).toBeVisible();
    await expect(saberTab).toHaveClass(/active/);
    // 클래식 탭도 존재
    await expect(page.getByRole('button', { name: '클래식' })).toBeVisible();
  });
});
