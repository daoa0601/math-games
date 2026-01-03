import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Testing Configuration
 *
 * Test Structure:
 * - testDir: './e2e' - All E2E tests live here
 * - Fixtures: './e2e/fixtures/test-utils.ts' - localStorage helpers and test data
 * - Page Objects: './e2e/pages/*.page.ts' - Reusable page object models
 *
 * Performance Optimizations:
 * - Mobile-first locally (students use phones, not computers)
 * - All 5 browsers on CI for full coverage
 * - Global setup pre-warms routes to eliminate cold-start delays
 * - Vite warmup pre-compiles game bundles at server start
 *
 * Usage:
 * - npm run test:e2e        → Mobile browsers only (fast local dev)
 * - npm run test:e2e:desktop → Desktop browsers only
 * - npm run test:e2e:full   → All 5 browsers (local full coverage)
 * - CI=true                 → 3 browsers (Chromium + Mobile Chrome + Mobile Safari)
 *
 * @see https://playwright.dev/docs/test-configuration
 */

const isCI = !!process.env.CI;
// Local: mobile-first for fast iteration. CI: 3 essential browsers. 'all' for full coverage.
const browserMode = process.env.BROWSERS || (isCI ? 'ci' : 'mobile');

// Mobile browsers (primary - students use phones)
const mobileProjects = [
  {
    name: 'Mobile Chrome',
    use: { ...devices['Pixel 5'] },
  },
  {
    name: 'Mobile Safari',
    use: { ...devices['iPhone 12'] },
  },
];

// Desktop browsers (for full coverage testing)
const desktopProjects = [
  {
    name: 'chromium',
    use: {
      ...devices['Desktop Chrome'],
      viewport: { width: 1280, height: 720 },
    },
  },
  {
    name: 'firefox',
    use: {
      ...devices['Desktop Firefox'],
      viewport: { width: 1280, height: 720 },
    },
  },
  {
    name: 'webkit',
    use: {
      ...devices['Desktop Safari'],
      viewport: { width: 1280, height: 720 },
    },
  },
];

// CI browsers: Essential coverage without Firefox/WebKit desktop
// (Mobile Safari covers WebKit, Firefox rarely catches unique bugs)
const ciProjects = [
  {
    name: 'chromium',
    use: {
      ...devices['Desktop Chrome'],
      viewport: { width: 1280, height: 720 },
    },
  },
  ...mobileProjects,
];

// Select projects based on environment
const projects =
  browserMode === 'desktop'
    ? desktopProjects
    : browserMode === 'all'
      ? [...mobileProjects, ...desktopProjects]
      : browserMode === 'ci'
        ? ciProjects
        : mobileProjects;

export default defineConfig({
  testDir: './e2e',

  // Global setup pre-warms all routes before tests run
  globalSetup: './e2e/global-setup.ts',

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Workers: 2 on CI for parallelism, 4 locally (fewer browsers = less memory pressure)
  workers: isCI ? 2 : 4,

  // Reduced timeout (routes are pre-warmed, should load fast)
  timeout: 30000,

  // Reporter to use
  reporter: [['html', { outputFolder: 'playwright-report' }], ['list']],

  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: 'http://localhost:5173',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on retry
    video: 'retain-on-failure',

    // Balanced timeouts - fast feedback while allowing game initialization
    actionTimeout: 8000, // 8s per action (games need 6+ seconds to initialize)
    navigationTimeout: 15000, // 15s for navigation
  },

  // Browser projects (mobile-first locally, all on CI)
  projects,

  // Run your local dev server before starting the tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    // Wait for server to be ready (max 60s)
    timeout: 60 * 1000,
  },
});
