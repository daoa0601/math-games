import { defineConfig, devices } from '@playwright/test'

const isCi = process.env.CI === 'true'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: isCi,
  retries: isCi ? 1 : 0,
  workers: 1,
  timeout: 45_000,
  reporter: [['list']],
  outputDir: './test-results',
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 900 },
      },
    },
  ],
  webServer: {
    command:
      'pnpm exec tsx scripts/ensureLocalD1.ts && pnpm exec vite dev --port 3000 --host 127.0.0.1 --strictPort',
    reuseExistingServer: !isCi,
    stdout: 'pipe',
    stderr: 'pipe',
    timeout: 180_000,
    url: 'http://127.0.0.1:3000/@vite/client',
  },
})
