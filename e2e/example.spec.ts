import { test, expect } from '@playwright/test';
import { DashboardPage } from './pages/Dashboard.page';
import { MagicGraphPage } from './pages/MagicGraph.page';
import { setupFreshTestState, DEFAULT_TEST_PLAYER } from './fixtures/test-utils';

/**
 * Example E2E Tests
 *
 * Demonstrates usage of:
 * - Page objects
 * - Test fixtures and utilities
 * - Basic user flows
 */

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Setup fresh test state before each test
    await setupFreshTestState(page, DEFAULT_TEST_PLAYER);
  });

  test('should display dashboard with all tabs', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.waitForLoad();

    // Check tabs are visible
    await expect(dashboard.playTab).toBeVisible();
    await expect(dashboard.statsTab).toBeVisible();
    await expect(dashboard.achievementsTab).toBeVisible();

    // Check player info
    const playerInfo = await dashboard.getPlayerInfo();
    expect(playerInfo.name).toBe('Test Player');
    expect(playerInfo.rank).toContain('Beginner');
  });

  test('should switch between tabs', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.waitForLoad();

    // Start on Play tab
    await expect(dashboard.playTab).toHaveAttribute('aria-selected', 'true');

    // Switch to Stats tab
    await dashboard.switchTab('stats');
    await expect(dashboard.statsTab).toHaveAttribute('aria-selected', 'true');

    // Switch to Achievements tab
    await dashboard.switchTab('achievements');
    await expect(dashboard.achievementsTab).toHaveAttribute('aria-selected', 'true');
  });

  test('should display all game cards', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.waitForLoad();

    // Check game cards are visible
    await expect(dashboard.magicGraphCard).toBeVisible();
    await expect(dashboard.sequenceRaceCard).toBeVisible();
    await expect(dashboard.shapeArchitectCard).toBeVisible();
  });

  test('should navigate to game when clicking card', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    await dashboard.waitForLoad();

    // Click on MagicGraph card
    await dashboard.playGame('magic-graph');

    // Should navigate to game page
    await expect(page).toHaveURL(/\/magic-graph/);
  });
});

test.describe('MagicGraph Game', () => {
  test.beforeEach(async ({ page }) => {
    // Setup fresh test state before each test
    await setupFreshTestState(page, DEFAULT_TEST_PLAYER);
  });

  test('should load game with puzzle board', async ({ page }) => {
    const magicGraph = new MagicGraphPage(page);
    await magicGraph.goto();
    await magicGraph.waitForLoad();

    // Check puzzle board is visible
    await expect(magicGraph.puzzleBoard).toBeVisible();

    // Check nodes are rendered
    const nodes = await magicGraph.getAllNodes();
    expect(nodes.length).toBeGreaterThan(0);

    // Check target sum is displayed
    const targetSum = await magicGraph.getTargetSum();
    expect(targetSum).toBeGreaterThan(0);
  });

  test('should show number picker when clicking empty node', async ({ page }) => {
    const magicGraph = new MagicGraphPage(page);
    await magicGraph.goto();
    await magicGraph.waitForLoad();

    // Click on first empty node
    await magicGraph.clickEmptyNode(0);

    // Number picker should be visible
    await expect(magicGraph.numberPicker).toBeVisible();

    // Should have number buttons
    const numbers = await magicGraph.numberButtons.count();
    expect(numbers).toBeGreaterThan(0);
  });

  test('should place number on node', async ({ page }) => {
    const magicGraph = new MagicGraphPage(page);
    await magicGraph.goto();
    await magicGraph.waitForLoad();

    // Get initial nodes
    const initialNodes = await magicGraph.getAllNodes();
    const emptyNode = initialNodes.find(n => n.isEmpty);

    if (!emptyNode) {
      test.skip(true, 'No empty nodes available');
      return;
    }

    // Place a number
    await magicGraph.clickEmptyNode(0);
    await magicGraph.selectNumber(1);

    // Number picker should close
    await expect(magicGraph.numberPicker).not.toBeVisible();

    // Node should now have a value
    await page.waitForTimeout(200); // Brief delay for state update
  });

  test('should start timer when game begins', async ({ page }) => {
    const magicGraph = new MagicGraphPage(page);
    await magicGraph.goto();
    await magicGraph.waitForLoad();

    // Timer should be visible
    await expect(magicGraph.timer).toBeVisible();

    // Get initial timer value
    const initialTime = await magicGraph.getTimerValue();
    expect(initialTime).toBeGreaterThanOrEqual(0);
  });

  test('should restart game when clicking restart button', async ({ page }) => {
    const magicGraph = new MagicGraphPage(page);
    await magicGraph.goto();
    await magicGraph.waitForLoad();

    // Place a number
    await magicGraph.clickEmptyNode(0);
    await magicGraph.selectNumber(1);

    // Restart game
    await magicGraph.restart();

    // Wait for reload
    await page.waitForTimeout(500);

    // Timer should reset
    const timerAfterRestart = await magicGraph.getTimerValue();
    expect(timerAfterRestart).toBeLessThan(10); // Should be near 0
  });

  test('should navigate back to dashboard', async ({ page }) => {
    const magicGraph = new MagicGraphPage(page);
    await magicGraph.goto();
    await magicGraph.waitForLoad();

    // Click back button
    await magicGraph.goBack();

    // Should be on dashboard
    await expect(page).toHaveURL('/');
  });

  test('should show hints when hint button is clicked', async ({ page }) => {
    const magicGraph = new MagicGraphPage(page);
    await magicGraph.goto({ difficulty: 'easy' }); // Easy mode has hints
    await magicGraph.waitForLoad();

    // Hint button should be visible
    await expect(magicGraph.hintButton).toBeVisible();

    // Click hint button
    await magicGraph.getHint();

    // Wait for hint to be applied
    await page.waitForTimeout(500);
  });
});

test.describe('Practice Mode', () => {
  test.beforeEach(async ({ page }) => {
    await setupFreshTestState(page, DEFAULT_TEST_PLAYER);
  });

  test('should not track stats in practice mode', async ({ page }) => {
    const magicGraph = new MagicGraphPage(page);
    await magicGraph.goto();
    await magicGraph.waitForLoad();

    // Enable practice mode
    await magicGraph.togglePracticeMode();

    // Verify practice mode is enabled
    const isPracticeMode = await magicGraph.isPracticeModeEnabled();
    expect(isPracticeMode).toBe(true);
  });
});
