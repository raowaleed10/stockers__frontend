import { defineConfig, devices } from '@playwright/test';

const PORT = 5173;
// The built owner app, served the way the real server will (scripts/preview-owner.mjs).
const PREVIEW_PORT = 4173;
const PREVIEW_PREFIX = '/owner-preview-x7/';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'counter',
      testMatch: /.*\.counter\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'owner',
      testMatch: /.*\.owner\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      // The owner app on a phone
      name: 'phone',
      testMatch: /.*\.owner\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
        hasTouch: true,
      },
    },
    {
      // The built owner bundle behind a fake secret address (deep links, assets, base path)
      name: 'preview',
      testMatch: /.*\.preview\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        baseURL: `http://localhost:${PREVIEW_PORT}`,
      },
    },
  ],
  webServer: [
    {
      command: 'npm run dev',
      url: `http://localhost:${PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      // Build first, so the test never runs against an old dist/owner.
      command: 'npm run build:owner && node ../../scripts/preview-owner.mjs',
      url: `http://localhost:${PREVIEW_PORT}${PREVIEW_PREFIX}`,
      env: { PORT: String(PREVIEW_PORT) },
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
  ],
});
