import { chromium } from '@playwright/test';

/**
 * Global Setup for E2E Tests
 *
 * Runs once before all tests to pre-warm routes and trigger Vite bundle compilation.
 * This eliminates cold-start delays that were causing test timeouts.
 *
 * How it works:
 * 1. Launches a temporary browser instance
 * 2. Navigates to each game route (triggers lazy bundle compilation)
 * 3. Closes the browser
 * 4. All subsequent tests hit pre-warmed/cached bundles
 *
 * Combined with Vite's server.warmup config, this ensures:
 * - Game bundles are pre-compiled at server start
 * - Routes are cached before tests run
 * - No test waits for initial compilation
 */
export default async function globalSetup() {
  const baseURL = process.env.BASE_URL || 'http://localhost:5173';

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Pre-warm all routes (triggers lazy bundle compilation)
    // The order matches typical user flow: dashboard → games
    await page.goto(baseURL);
    await page.goto(`${baseURL}/magic-graph`);
    await page.goto(`${baseURL}/sequence-race`);
    await page.goto(`${baseURL}/shape-architect`);
  } finally {
    await browser.close();
  }
}
