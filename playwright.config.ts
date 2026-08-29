import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './e2e',
  /* Run tests sequentially to avoid hammering R2 */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry once locally — R2 can be flaky */
  retries: process.env.CI ? 2 : 1,
  /* Limit workers to avoid rate-limiting R2 */
  workers: 2,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. */
  use: {
    /* Tests target production directly — no local server needed */
    // baseURL: 'http://localhost:8788',

    /* Collect trace when retrying the failed test. */
    trace: 'on-first-retry',

    /* Generous timeouts for R2 network fetches */
    actionTimeout: 30_000,
    navigationTimeout: 30_000,
  },

  /* Global per-test timeout (R2 can take a while to load 180 questions) */
  timeout: 90_000,

  /* Only run Chromium for speed; add others when needed */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* webServer disabled — tests run against https://myexamcompanion.pages.dev */
  // webServer: {
  //   command: 'npx wrangler pages dev public --port 8788',
  //   url: 'http://localhost:8788',
  //   reuseExistingServer: !process.env.CI,
  // },
});
