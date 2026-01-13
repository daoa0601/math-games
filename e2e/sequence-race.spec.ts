/**
 * SequenceRace E2E Tests
 *
 * Basic tests for the turn-based strategy game.
 * Tests game loading and basic UI elements.
 */

import { test, expect } from '@playwright/test';
import { setupFreshTestState, DEFAULT_TEST_PLAYER } from './fixtures/test-utils';

test.describe('SequenceRace - Basic Tests', () => {
  test.beforeEach(async ({ page }) => {
    await setupFreshTestState(page, DEFAULT_TEST_PLAYER);
  });

  test('should load game page', async ({ page }) => {
    await page.goto('/sequence-race');

    // Verify game shell is visible (using new data-testid)
    await expect(page.locator('[data-testid="sequence-race-shell"]')).toBeVisible({ timeout: 10000 });
  });

  test('should display game title', async ({ page }) => {
    await page.goto('/sequence-race');
    await page.waitForSelector('[data-testid="sequence-race-shell"]', { state: 'visible' });

    // Verify game header
    await expect(page.locator('.game-header__title')).toBeVisible();
  });

  test('should display timer', async ({ page }) => {
    await page.goto('/sequence-race');
    await page.waitForSelector('[data-testid="sequence-race-shell"]', { state: 'visible' });

    // Timer is now inside settings drawer - open it first
    await page.locator('.settings-drawer__trigger').click();

    // Verify timer is present inside the drawer
    await expect(page.locator('.timer-container')).toBeVisible({ timeout: 5000 });
  });

  test('should display difficulty selector in settings drawer', async ({ page }) => {
    await page.goto('/sequence-race');
    await page.waitForSelector('[data-testid="sequence-race-shell"]', { state: 'visible' });

    // Open settings drawer (gear icon button)
    await page.locator('.settings-drawer__trigger').click();

    // Verify difficulty selector is visible inside the drawer
    await expect(page.locator('.difficulty-selector')).toBeVisible({ timeout: 5000 });
  });

  test('should have back button', async ({ page }) => {
    await page.goto('/sequence-race');
    await page.waitForSelector('[data-testid="sequence-race-shell"]', { state: 'visible' });

    // Verify back button
    await expect(page.locator('.action--secondary').filter({ hasText: /back|quay lại/i })).toBeVisible();
  });

  test('should navigate back to dashboard', async ({ page }) => {
    await page.goto('/sequence-race');
    await page.waitForSelector('[data-testid="sequence-race-shell"]', { state: 'visible' });

    // Click back button
    await page.locator('.action--secondary').filter({ hasText: /back|quay lại/i }).first().click();

    // Should be back on dashboard
    await expect(page).toHaveURL('/');
  });
});
