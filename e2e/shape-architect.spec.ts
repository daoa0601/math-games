/**
 * ShapeArchitect E2E Tests
 *
 * Basic tests for the 3D voxel puzzle game.
 * Tests game loading and basic UI elements.
 */

import { test, expect } from '@playwright/test';
import { setupFreshTestState } from './fixtures/test-utils';

test.describe('ShapeArchitect - Basic Tests', () => {
  test.beforeEach(async ({ page }) => {
    await setupFreshTestState(page);
  });

  test('should load game page', async ({ page }) => {
    await page.goto('/shape-architect');

    // Verify game container is visible (may take longer due to 3D loading)
    await expect(page.locator('[data-testid="shape-architect-game"]')).toBeVisible({ timeout: 15000 });
  });

  test('should display game title', async ({ page }) => {
    await page.goto('/shape-architect');
    await page.waitForSelector('[data-testid="shape-architect-game"]', { state: 'visible', timeout: 15000 });

    // Verify game header
    await expect(page.locator('.game-header__title')).toBeVisible();
  });

  test('should display timer', async ({ page }) => {
    await page.goto('/shape-architect');
    await page.waitForSelector('[data-testid="shape-architect-game"]', { state: 'visible', timeout: 15000 });

    // Verify timer is present
    await expect(page.locator('.timer-container')).toBeVisible();
  });

  test('should display difficulty selector in settings drawer', async ({ page }) => {
    await page.goto('/shape-architect');
    await page.waitForSelector('[data-testid="shape-architect-game"]', { state: 'visible', timeout: 15000 });

    // Open settings drawer (gear icon button)
    await page.locator('.settings-drawer__trigger').click();

    // Verify difficulty selector is visible inside the drawer
    await expect(page.locator('.difficulty-selector')).toBeVisible({ timeout: 5000 });
  });

  test('should have back button', async ({ page }) => {
    await page.goto('/shape-architect');
    await page.waitForSelector('[data-testid="shape-architect-game"]', { state: 'visible', timeout: 15000 });

    // Verify back button
    await expect(page.locator('.action--secondary').filter({ hasText: /back|quay lại/i })).toBeVisible();
  });

  test('should navigate back to dashboard', async ({ page }) => {
    await page.goto('/shape-architect');
    await page.waitForSelector('[data-testid="shape-architect-game"]', { state: 'visible', timeout: 15000 });

    // Click back button
    await page.locator('.action--secondary').filter({ hasText: /back|quay lại/i }).first().click();

    // Should be back on dashboard
    await expect(page).toHaveURL('/');
  });

  test('should display puzzle board', async ({ page }) => {
    await page.goto('/shape-architect');
    await page.waitForSelector('[data-testid="shape-architect-game"]', { state: 'visible', timeout: 15000 });

    // Verify puzzle board (.sa-board)
    await expect(page.locator('.sa-board')).toBeVisible();
  });

  test('should display piece inventory', async ({ page }) => {
    await page.goto('/shape-architect');
    await page.waitForSelector('[data-testid="shape-architect-game"]', { state: 'visible', timeout: 15000 });

    // Verify inventory (.sa-inventory)
    await expect(page.locator('.sa-inventory')).toBeVisible();
  });
});
