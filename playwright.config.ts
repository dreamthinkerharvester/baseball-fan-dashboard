import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: require.resolve('./tests/e2e/global-setup.ts'),
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-iphone-se',
      use: { ...devices['iPhone SE'] },
    },
    {
      name: 'mobile-pixel-7',
      use: { ...devices['Pixel 7'] },
    },
  ],
  webServer: process.env.CI
    ? {
        command: 'pnpm build && pnpm start',
        url: 'http://localhost:3000',
        timeout: 180_000,
        reuseExistingServer: false,
      }
    : {
        command: 'pnpm dev',
        url: 'http://localhost:3000',
        // 느린 파일시스템(예: iCloud 동기화 폴더)에서 첫 컴파일 여유 확보
        timeout: 180_000,
        reuseExistingServer: true,
      },
});
