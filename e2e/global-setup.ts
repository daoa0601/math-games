import { chromium } from '@playwright/test';

/**
 * Global Setup for E2E Tests
 *
 * Runs once before all tests to pre-warm routes and trigger Vite bundle compilation.
 * This eliminates cold-start delays that were causing test timeouts.
 */
export default async function globalSetup() {
  const baseURL = process.env.BASE_URL || 'http://localhost:5173';

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Pre-warm all routes with element waits (ensures bundles are fully compiled)

    // Dashboard - uses .page class and BottomNav
    await page.goto(baseURL);
    await page.waitForSelector('.page', { state: 'visible', timeout: 30000 });

    // MagicGraph - wait for puzzle board (.mg-board)
    await page.goto(`${baseURL}/magic-graph`);
    await page.waitForSelector('.mg-board', { state: 'visible', timeout: 30000 });

    // SequenceRace - wait for game container
    await page.goto(`${baseURL}/sequence-race`);
    await page.waitForSelector('.game-container', { state: 'visible', timeout: 30000 });

    // ShapeArchitect - wait for game container (skip 3D to avoid WebGL overhead)
    await page.goto(`${baseURL}/shape-architect`);
    await page.waitForSelector('.game-container', { state: 'visible', timeout: 30000 });
  } finally {
    await browser.close();
  }
}
