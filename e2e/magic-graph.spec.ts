import { test, expect } from '@playwright/test';
import {
  setupFreshTestState,
  waitForMagicGraphReady,
  waitForNextFrame
} from './fixtures/test-utils';
import { MagicGraphPage } from './pages/MagicGraph.page';

/**
 * MagicGraph E2E Tests
 *
 * Tests the MagicGraph game including:
 * - Game initialization and UI elements
 * - Gameplay interactions (node selection, number placement)
 * - Difficulty changes
 * - Practice mode functionality
 */

test.describe('MagicGraph Game', () => {
  test.beforeEach(async ({ page }) => {
    // Setup clean state before each test
    await setupFreshTestState(page);
    // Navigate to MagicGraph game
    await page.goto('/magic-graph');
    // Wait for game to be fully ready
    await waitForMagicGraphReady(page);
  });

  test.describe('Game Initialization', () => {
    test('should load the game with essential UI elements', async ({ page }) => {
      const mgPage = new MagicGraphPage(page);

      // Check game container is rendered
      await expect(mgPage.gameContainer).toBeVisible();

      // Check puzzle board is rendered
      await expect(mgPage.puzzleBoard).toBeVisible();

      // Check nodes are rendered
      const nodeCount = await mgPage.getTotalNodeCount();
      expect(nodeCount).toBeGreaterThan(0);

      // Check difficulty selector is visible
      await expect(mgPage.difficultySelector).toBeVisible();

      // Check timer is displayed
      await expect(mgPage.timerContainer).toBeVisible();
    });

    test('should display number inventory', async ({ page }) => {
      const mgPage = new MagicGraphPage(page);

      // Check number inventory is visible
      await expect(mgPage.numberInventory).toBeVisible();
    });

    test('should display control buttons', async ({ page }) => {
      const mgPage = new MagicGraphPage(page);

      // Undo button should be visible but disabled initially
      await expect(mgPage.undoButton).toBeVisible();
      expect(await mgPage.isUndoEnabled()).toBe(false);

      // Redo button should be visible but disabled initially
      await expect(mgPage.redoButton).toBeVisible();
      expect(await mgPage.isRedoEnabled()).toBe(false);

      // Reset button should be visible
      await expect(mgPage.resetButton).toBeVisible();
    });

    test('should have difficulty buttons', async ({ page }) => {
      const mgPage = new MagicGraphPage(page);

      // Check difficulty buttons are rendered
      const difficultyCount = await mgPage.difficultyButtons.count();
      expect(difficultyCount).toBeGreaterThan(0);
    });
  });

  test.describe('Gameplay Interactions', () => {
    test('should allow clicking a node to open number picker', async ({ page }) => {
      const mgPage = new MagicGraphPage(page);

      // Check if there are empty nodes
      const emptyCount = await mgPage.getEmptyNodeCount();
      if (emptyCount === 0) {
        // If no empty nodes, skip this test (puzzle might be pre-filled)
        test.skip();
        return;
      }

      // Click an empty node
      await mgPage.clickEmptyNode(0);

      // Number picker should appear
      await expect(mgPage.numberPicker).toBeVisible();
    });

    test('should close number picker when clicking close button', async ({ page }) => {
      const mgPage = new MagicGraphPage(page);

      const emptyCount = await mgPage.getEmptyNodeCount();
      if (emptyCount === 0) {
        test.skip();
        return;
      }

      // Click an empty node
      await mgPage.clickEmptyNode(0);
      await expect(mgPage.numberPicker).toBeVisible();

      // Click close button
      await mgPage.closeNumberPicker();

      // Picker should close
      await expect(mgPage.numberPicker).not.toBeVisible();
    });

    test('should close number picker when pressing Escape', async ({ page }) => {
      const mgPage = new MagicGraphPage(page);

      const emptyCount = await mgPage.getEmptyNodeCount();
      if (emptyCount === 0) {
        test.skip();
        return;
      }

      // Click an empty node
      await mgPage.clickEmptyNode(0);
      await expect(mgPage.numberPicker).toBeVisible();

      // Press Escape
      await page.keyboard.press('Escape');

      // Picker should close
      await expect(mgPage.numberPicker).not.toBeVisible();
    });

    test('should enable undo after placing a number', async ({ page }) => {
      const mgPage = new MagicGraphPage(page);

      const emptyCount = await mgPage.getEmptyNodeCount();
      if (emptyCount === 0) {
        test.skip();
        return;
      }

      // Undo button should be disabled initially
      expect(await mgPage.isUndoEnabled()).toBe(false);

      // Click empty node and place a number
      await mgPage.clickEmptyNode(0);
      const firstOption = mgPage.numberOptions.first();
      await firstOption.click();

      await waitForNextFrame(page);

      // Undo should now be enabled
      expect(await mgPage.isUndoEnabled()).toBe(true);
    });
  });

  test.describe('Difficulty Changes', () => {
    test('should change difficulty level', async ({ page }) => {
      const mgPage = new MagicGraphPage(page);

      // Get initial active difficulty
      const easyBtn = page.locator('.difficulty-btn--easy');
      const mediumBtn = page.locator('.difficulty-btn--medium');

      // If easy is active, click medium
      if (await easyBtn.getAttribute('class').then(c => c?.includes('--active'))) {
        await mediumBtn.click();
        await page.waitForTimeout(300);

        // Medium should now be active
        const mediumClasses = await mediumBtn.getAttribute('class');
        expect(mediumClasses).toContain('--active');
      }
    });
  });

  test.describe('Practice Mode', () => {
    test('should toggle to practice mode', async ({ page }) => {
      const mgPage = new MagicGraphPage(page);

      // Switch to practice mode
      await mgPage.switchToPracticeMode();
      await page.waitForTimeout(300);

      // Verify practice mode is active
      const isInPractice = await mgPage.isInPracticeMode();
      expect(isInPractice).toBe(true);
    });

    test('should switch back to timed mode', async ({ page }) => {
      const mgPage = new MagicGraphPage(page);

      // First switch to practice mode
      await mgPage.switchToPracticeMode();
      await page.waitForTimeout(300);

      // Then switch back to timed mode
      await mgPage.switchToTimedMode();
      await page.waitForTimeout(300);

      // Verify timed mode is active
      const isInPractice = await mgPage.isInPracticeMode();
      expect(isInPractice).toBe(false);
    });
  });

  test.describe('Timer Functionality', () => {
    test('should display timer', async ({ page }) => {
      const mgPage = new MagicGraphPage(page);

      // Timer should be visible
      await expect(mgPage.timerDisplay).toBeVisible();

      // Timer should show a time value
      const timerText = await mgPage.getTimerText();
      expect(timerText).toBeTruthy();
    });

    test('should pause and resume timer', async ({ page }) => {
      const mgPage = new MagicGraphPage(page);

      // Pause the timer
      await mgPage.pauseTimer();
      await page.waitForTimeout(200);

      // Timer should be paused
      const isPaused = await mgPage.isTimerPaused();
      expect(isPaused).toBe(true);

      // Resume the timer
      await mgPage.resumeTimer();
      await page.waitForTimeout(200);

      // Timer should not be paused
      const isStillPaused = await mgPage.isTimerPaused();
      expect(isStillPaused).toBe(false);
    });
  });

  test.describe('Win State', () => {
    test('win modal should not be visible initially', async ({ page }) => {
      const mgPage = new MagicGraphPage(page);

      // Wait for game to fully load
      await expect(mgPage.puzzleBoard).toBeVisible();

      // The modal should only appear on win
      await expect(mgPage.winModal).not.toBeVisible();
    });
  });

  test.describe('Navigation', () => {
    test('should have back button', async ({ page }) => {
      const mgPage = new MagicGraphPage(page);

      // Back button should be visible
      await expect(mgPage.backButton).toBeVisible();
    });

    test('should navigate back to dashboard', async ({ page }) => {
      // Click back button
      await page.locator('.action--secondary').filter({ hasText: /back|quay lại/i }).first().click();

      // Should be back on dashboard
      await expect(page).toHaveURL('/');
    });
  });
});
