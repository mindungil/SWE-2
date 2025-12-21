// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Playwright 테스트 설정
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './',
  /* 테스트 타임아웃 (30초) */
  timeout: 30000,
  /* 테스트 실행 시 재시도 횟수 */
  retries: process.env.CI ? 2 : 0,
  /* 병렬 실행할 워커 수 */
  workers: process.env.CI ? 1 : undefined,
  /* 리포트 설정 */
  reporter: 'html',
  /* 공유 설정 */
  use: {
    /* 기본 타임아웃 */
    actionTimeout: 0,
    /* Base URL - 서버가 실행 중이어야 함 */
    baseURL: process.env.BASE_URL || 'http://localhost:8000',
    /* HTTP 요청 헤더 */
    extraHTTPHeaders: {
      'Content-Type': 'application/json',
    },
  },

  /* 테스트 프로젝트 */
  projects: [
    {
      name: 'api-tests',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],

  /* 서버 실행 설정 (선택사항) */
  // webServer: {
  //   command: 'cd ../server && uvicorn app.main:app --reload',
  //   url: 'http://localhost:8000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
