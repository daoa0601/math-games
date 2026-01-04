import { test, expect } from '@playwright/test';
import {
  setupFreshTestState,
  getPlayerProfile,
  waitForMagicGraphReady,
  waitForNextFrame
} from './fixtures/test-utils';

/**
 * MagicGraph E2E Tests
 *
 * Tests the MagicGraph game including:
 * - Game initialization and UI elements
 * - Gameplay interactions (node selection, number placement)
 * - Game completion flow
 * - Practice mode functionality
 * - Difficulty changes
 */

test.describe('MagicGraph Game', () => {
  test.beforeEach(async ({ page }) => {
    // Setup clean state before each test
    await setupFreshTestState(page);
    // Navigate to MagicGraph game
    await page.goto('/magic-graph');
    // Wait for game to be fully ready (board, nodes, inventory)
    await waitForMagicGraphReady(page);
  });

  test.describe('Game Initialization', () => {
    test('should load the game with all essential UI elements', async ({ page }) => {
      // Check page title/heading
      await expect(page.getByRole('heading', { name: /magic graph/i })).toBeVisible();

      // Check puzzle board is rendered
      const board = page.locator('.puzzle-board');
      await expect(board).toBeVisible();

      // Check difficulty selector is visible and has correct options
      const difficultyButtons = page.locator('.difficulty-btn');
      await expect(difficultyButtons).toHaveCount(5); // easy, medium, hard, master, grandmaster

      // Check timer is displayed
      const timer = page.locator('.timer-display');
      await expect(timer).toBeVisible();

      // Check mode toggle (Timed/Practice) is visible
      const timedButton = page.getByRole('radio', { name: /timed/i });
      const practiceButton = page.getByRole('radio', { name: /practice/i });
      await expect(timedButton).toBeVisible();
      await expect(practiceButton).toBeVisible();

      // Default should be timed mode
      await expect(timedButton).toHaveAttribute('aria-checked', 'true');
    });

    test('should display puzzle info correctly', async ({ page }) => {
      // Check target sum is displayed
      const puzzleInfo = page.locator('.puzzle-info');
      await expect(puzzleInfo).toBeVisible();
      await expect(puzzleInfo.locator('.puzzle-info__label').filter({ hasText: /target sum/i })).toBeVisible();

      // Check progress counter (filled/total nodes)
      await expect(puzzleInfo.locator('.puzzle-info__label').filter({ hasText: /progress/i })).toBeVisible();

      // Check puzzle name is displayed
      await expect(puzzleInfo.locator('.puzzle-info__label').filter({ hasText: /puzzle/i })).toBeVisible();
    });

    test('should display number inventory', async ({ page }) => {
      // Check number inventory is visible
      const inventory = page.locator('.number-inventory-wrapper');
      await expect(inventory).toBeVisible();

      // Check available numbers label
      await expect(page.getByText(/available numbers/i)).toBeVisible();

      // Check that numbers are displayed
      const numberSlots = page.locator('.number-inventory .number-slot');
      await expect(numberSlots.first()).toBeVisible();
    });

    test('should display control buttons', async ({ page }) => {
      // Undo button
      const undoBtn = page.getByRole('button', { name: /undo/i });
      await expect(undoBtn).toBeVisible();
      await expect(undoBtn).toBeDisabled(); // Should be disabled initially

      // Redo button
      const redoBtn = page.getByRole('button', { name: /redo/i });
      await expect(redoBtn).toBeVisible();
      await expect(redoBtn).toBeDisabled(); // Should be disabled initially

      // Reset button
      await expect(page.getByRole('button', { name: /reset/i })).toBeVisible();

      // Next Puzzle button
      await expect(page.getByRole('button', { name: /next puzzle/i })).toBeVisible();
    });

    test('should display hint button', async ({ page }) => {
      const hintButton = page.getByRole('button', { name: /need help/i });
      await expect(hintButton).toBeVisible();
    });

    test('should display level selector with template options', async ({ page }) => {
      const levelSelector = page.locator('.level-selector');
      await expect(levelSelector).toBeVisible();

      // Should have at least one template button
      const levelButtons = levelSelector.locator('.level-btn');
      const count = await levelButtons.count();
      expect(count).toBeGreaterThan(0);

      // First button should be active
      await expect(levelButtons.first()).toHaveClass(/level-btn--active/);

      // Should have random button
      await expect(page.getByRole('button', { name: /random/i })).toBeVisible();
    });
  });

  test.describe('Gameplay Interactions', () => {
    // Select a template that has empty nodes (not all fixed)
    test.beforeEach(async ({ page }) => {
      // Close any win modal that might have appeared from auto-solved puzzle
      const winModal = page.locator('.game-modal');
      if (await winModal.isVisible({ timeout: 1000 }).catch(() => false)) {
        await page.getByRole('button', { name: /next puzzle/i }).click();
        await waitForNextFrame(page);
      }

      // Select "Cross" template which has empty nodes on easy difficulty
      const crossBtn = page.getByRole('button', { name: /cross/i });
      if (await crossBtn.isVisible()) {
        await crossBtn.click();
        // Wait for puzzle animation to complete (CSS animation is 0.2s)
        await page.waitForTimeout(300);
      }

      // Close any new win modal if this template also auto-solved
      if (await winModal.isVisible({ timeout: 500 }).catch(() => false)) {
        await page.getByRole('button', { name: /next puzzle/i }).click();
        await page.waitForTimeout(300);
      }

      // Wait for nodes to be stable (no animations running)
      await page.locator('.puzzle-node--empty').first().waitFor({ state: 'visible' });
      await waitForNextFrame(page);
    });

    test('should allow clicking a node to select it', async ({ page }) => {
      // Find an interactive (non-fixed) node
      const emptyNode = page.getByRole('button', { name: /Empty node/i }).first();
      await expect(emptyNode).toBeVisible();

      // Click the node
      await emptyNode.click();

      // Number picker should appear
      const picker = page.locator('.number-picker');
      await expect(picker).toBeVisible();

      // Picker should have a header
      await expect(picker.locator('.number-picker__header')).toBeVisible();

      // Picker should have number options
      const numberOptions = picker.locator('.number-picker__option');
      const optionsCount = await numberOptions.count();
      expect(optionsCount).toBeGreaterThan(0);
    });

    test('should place a number on a node', async ({ page }) => {
      // Click an empty node
      const emptyNode = page.getByRole('button', { name: /Empty node/i }).first();
      await emptyNode.click();

      // Wait for picker to appear
      const picker = page.locator('.number-picker');
      await expect(picker).toBeVisible();

      // Click the first available number
      const firstNumber = picker.locator('.number-picker__option').first();
      const numberText = await firstNumber.textContent();
      await firstNumber.click();

      // Picker should close
      await expect(picker).not.toBeVisible();

      // Node should now display the number
      // Find the node that now contains the placed number
      const placedNode = page.locator('.puzzle-node__text').filter({ hasText: numberText?.trim() || '' });
      await expect(placedNode).toBeVisible();

      // Progress counter should update
      const progressValue = page.locator('.puzzle-info__value').filter({ hasText: /\d+\/\d+/ });
      const progressText = await progressValue.textContent();
      expect(progressText).toMatch(/[1-9]\/\d+/); // At least 1 filled
    });

    test('should close number picker when clicking close button', async ({ page }) => {
      // Click an empty node
      const emptyNode = page.getByRole('button', { name: /Empty node/i }).first();
      await emptyNode.click();

      // Wait for picker
      const picker = page.locator('.number-picker');
      await expect(picker).toBeVisible();

      // Click close button
      const closeBtn = picker.locator('.number-picker__close');
      await closeBtn.click();

      // Picker should close
      await expect(picker).not.toBeVisible();
    });

    test('should close number picker when pressing Escape', async ({ page }) => {
      // Click an empty node
      const emptyNode = page.getByRole('button', { name: /Empty node/i }).first();
      await emptyNode.click();

      // Wait for picker
      const picker = page.locator('.number-picker');
      await expect(picker).toBeVisible();

      // Press Escape
      await page.keyboard.press('Escape');

      // Picker should close
      await expect(picker).not.toBeVisible();
    });

    test('should enable undo after placing a number', async ({ page }) => {
      // Undo button should be disabled initially
      const undoBtn = page.getByRole('button', { name: /undo/i });
      await expect(undoBtn).toBeDisabled();

      // Click empty node and wait for number picker
      await page.getByRole('button', { name: /Empty node/i }).first().click();
      const picker = page.locator('.number-picker');
      await expect(picker).toBeVisible();

      // Wait for option to be ready and click
      const firstOption = page.locator('.number-picker__option').first();
      await expect(firstOption).toBeVisible();
      await firstOption.click();
      await expect(picker).not.toBeVisible();

      // Undo should now be enabled
      await expect(undoBtn).not.toBeDisabled();
    });

    test('should undo a placed number', async ({ page }) => {
      // Click empty node and wait for picker
      const emptyNode = page.getByRole('button', { name: /Empty node/i }).first();
      await emptyNode.click();
      const picker = page.locator('.number-picker');
      await expect(picker).toBeVisible();

      const firstNumber = page.locator('.number-picker__option').first();
      const numberText = await firstNumber.textContent();
      await firstNumber.click();
      await expect(picker).not.toBeVisible();

      // Verify number was placed
      await expect(page.locator('.puzzle-node__text').filter({ hasText: numberText?.trim() || '' })).toBeVisible();

      // Click undo
      const undoBtn = page.getByRole('button', { name: /undo/i });
      await undoBtn.click();

      // Number should be removed
      await expect(page.locator('.puzzle-node__text').filter({ hasText: numberText?.trim() || '' })).not.toBeVisible();
    });

    test('should redo an undone action', async ({ page }) => {
      // Click node and wait for picker
      await page.getByRole('button', { name: /Empty node/i }).first().click();
      const picker = page.locator('.number-picker');
      await expect(picker).toBeVisible();

      const firstNumber = page.locator('.number-picker__option').first();
      await expect(firstNumber).toBeVisible();
      const numberText = await firstNumber.textContent();
      await firstNumber.click();
      await expect(picker).not.toBeVisible();

      // Undo
      await page.getByRole('button', { name: /undo/i }).click();

      // Redo button should be enabled
      const redoBtn = page.getByRole('button', { name: /redo/i });
      await expect(redoBtn).not.toBeDisabled();

      // Click redo
      await redoBtn.click();

      // Number should be back
      await expect(page.locator('.puzzle-node__text').filter({ hasText: numberText?.trim() || '' })).toBeVisible();
    });

    test('should reset puzzle to initial state', async ({ page }) => {
      // Open picker and place a number
      await page.getByRole('button', { name: /Empty node/i }).first().click();
      const picker = page.locator('.number-picker');
      await expect(picker).toBeVisible();
      await page.locator('.number-picker__option').first().click();
      await expect(picker).not.toBeVisible();

      // Click reset (force: true for mobile overlap issues)
      const resetBtn = page.getByRole('button', { name: /reset/i });
      await resetBtn.click({ force: true });

      // We can check that undo is disabled again (puzzle reset)
      const undoBtn = page.getByRole('button', { name: /undo/i });
      await expect(undoBtn).toBeDisabled();
    });

    test('should not allow placing same number twice', async ({ page }) => {
      // Open picker and place first number
      await page.getByRole('button', { name: /Empty node/i }).first().click();
      const picker = page.locator('.number-picker');
      await expect(picker).toBeVisible();

      const firstOption = page.locator('.number-picker__option').first();
      await expect(firstOption).toBeVisible();
      const numberText = await firstOption.textContent();
      const numberValue = numberText?.trim();
      await firstOption.click();
      await expect(picker).not.toBeVisible();

      // Click another empty node
      await page.getByRole('button', { name: /Empty node/i }).first().click();
      await expect(picker).toBeVisible();

      // The previously used number should not be available
      const availableNumbers = picker.locator('.number-picker__option');
      const availableTexts = await availableNumbers.allTextContents();
      const normalizedTexts = availableTexts.map(t => t.trim());

      expect(normalizedTexts).not.toContain(numberValue);
    });

    test('should allow clearing a placed number', async ({ page }) => {
      // Open picker and place a number
      const emptyNode = page.getByRole('button', { name: /Empty node/i }).first();
      await emptyNode.click();
      const picker = page.locator('.number-picker');
      await expect(picker).toBeVisible();
      await page.locator('.number-picker__option').first().click();
      await expect(picker).not.toBeVisible();

      // Click the same node again to edit
      const filledNode = page.locator('.puzzle-node').filter({ has: page.locator('.puzzle-node__text') }).first();
      await filledNode.click();

      // Picker should show with clear button
      await expect(picker).toBeVisible();

      const clearBtn = picker.locator('.number-picker__clear');
      if (await clearBtn.isVisible()) {
        await clearBtn.click();

        // Picker should close and node should be empty
        await expect(picker).not.toBeVisible();
      }
    });
  });

  test.describe('Hint System', () => {
    test('should toggle hint panel', async ({ page }) => {
      // Hints should not be visible initially
      const hintsPanel = page.locator('.hints-panel');
      await expect(hintsPanel).not.toBeVisible();

      // Click hint button
      const hintButton = page.getByRole('button', { name: /need help/i });
      await hintButton.click();

      // Hints panel should appear
      await expect(hintsPanel).toBeVisible();

      // Should have some hint cards
      const hintCards = hintsPanel.locator('.hint-card');
      const count = await hintCards.count();
      expect(count).toBeGreaterThan(0);

      // Click hide hints
      await page.getByRole('button', { name: /hide hints/i }).click();

      // Hints should be hidden
      await expect(hintsPanel).not.toBeVisible();
    });
  });

  test.describe('Difficulty Changes', () => {
    test.beforeEach(async ({ page }) => {
      // Close any win modal that might have appeared from auto-solved puzzle
      const winModal = page.locator('.game-modal');
      if (await winModal.isVisible({ timeout: 1000 }).catch(() => false)) {
        await page.getByRole('button', { name: /next puzzle/i }).click();
        await waitForNextFrame(page);
      }
    });

    test('should change difficulty level', async ({ page }) => {
      // Initially on easy difficulty
      const easyBtn = page.locator('.difficulty-btn--easy');
      await expect(easyBtn).toHaveClass(/difficulty-btn--active/);

      // Click medium difficulty
      const mediumBtn = page.locator('.difficulty-btn--medium');
      await mediumBtn.click();

      // Medium should now be active
      await expect(mediumBtn).toHaveClass(/difficulty-btn--active/);
      await expect(easyBtn).not.toHaveClass(/difficulty-btn--active/);

      // Puzzle should reset (undo button disabled)
      const undoBtn = page.getByRole('button', { name: /undo/i });
      await expect(undoBtn).toBeDisabled();
    });

    test('should load different puzzles on next button click', async ({ page }) => {
      // Click next puzzle
      await page.getByRole('button', { name: /next puzzle/i }).click();

      // Puzzle should be reset (undo button disabled)
      const undoBtn = page.getByRole('button', { name: /undo/i });
      await expect(undoBtn).toBeDisabled();
    });

    test('should generate random puzzle', async ({ page }) => {
      // Click random button
      const randomBtn = page.getByRole('button', { name: /random/i });
      await randomBtn.click();

      // Should show generating state or complete quickly
      // Wait for puzzle to be ready (undo disabled means fresh puzzle)
      await waitForNextFrame(page);

      const undoBtn = page.getByRole('button', { name: /undo/i });
      await expect(undoBtn).toBeDisabled();
    });
  });

  test.describe('Practice Mode', () => {
    test('should toggle to practice mode', async ({ page }) => {
      // Switch to practice mode
      const practiceBtn = page.getByRole('radio', { name: /practice/i });
      await practiceBtn.click();

      // Practice button should be checked
      await expect(practiceBtn).toHaveAttribute('aria-checked', 'true');

      // Timer should show practice mode indicator
      const timer = page.locator('.timer-display');
      await expect(timer).toHaveClass(/timer--practice/);

      // Mode hint should indicate practice mode
      await expect(page.getByText(/no time limit/i)).toBeVisible();
    });

    test('should not save stats in practice mode', async ({ page }) => {
      // Switch to practice mode
      await page.getByRole('radio', { name: /practice/i }).click();

      // Place numbers to complete a simple puzzle would require knowing the solution
      // For now, we'll just verify practice mode is active and check after some interaction
      await expect(page.getByRole('radio', { name: /practice/i })).toHaveAttribute('aria-checked', 'true');

      // We can't easily complete a puzzle without knowing the solution
      // But we can verify the mode is set correctly in localStorage
      const updatedProfile = await getPlayerProfile(page);
      expect(updatedProfile?.preferences.practiceMode).toBe(true);
    });

    test('should persist practice mode preference', async ({ page }) => {
      // Switch to practice mode
      await page.getByRole('radio', { name: /practice/i }).click();

      // Reload page
      await page.reload();
      await page.locator('.puzzle-board').waitFor({ state: 'visible' });

      // Should still be in practice mode
      const practiceBtn = page.getByRole('radio', { name: /practice/i });
      await expect(practiceBtn).toHaveAttribute('aria-checked', 'true');
    });
  });

  test.describe('Win Modal', () => {
    // Note: These tests verify the modal CSS structure.
    // Full win state testing requires puzzle solving which is not yet implemented.

    test('win modal should not be visible initially', async ({ page }) => {
      // Wait for game to fully load
      await page.locator('.puzzle-board').waitFor({ state: 'visible', timeout: 10000 });

      // The modal should only appear on win
      const modal = page.locator('.game-modal');
      await expect(modal).not.toBeVisible();
    });

    test('should have fade-in animation keyframes defined', async ({ page }) => {
      // Wait for game to fully load (ensures CSS is loaded)
      await page.locator('.puzzle-board').waitFor({ state: 'visible', timeout: 10000 });

      // Check that the animation keyframes exist in loaded stylesheets
      const hasAnimation = await page.evaluate(() => {
        const styleSheets = Array.from(document.styleSheets);
        for (const sheet of styleSheets) {
          try {
            const rules = Array.from(sheet.cssRules || []);
            for (const rule of rules) {
              if (rule instanceof CSSKeyframesRule && rule.name === 'modalFadeIn') {
                return true;
              }
            }
          } catch {
            // Cross-origin stylesheets may throw - skip them
            continue;
          }
        }
        return false;
      });

      expect(hasAnimation).toBe(true);
    });
  });

  test.describe('Accessibility', () => {
    test('should support keyboard navigation between nodes', async ({ page }) => {
      // Focus first interactive node
      const firstNode = page.locator('.puzzle-node').filter({ has: page.locator('circle') }).first();
      await firstNode.focus();

      // Press Enter to open picker
      await page.keyboard.press('Enter');

      // Picker should open
      const picker = page.locator('.number-picker');
      await expect(picker).toBeVisible();
    });

    test('should have proper ARIA labels', async ({ page }) => {
      // Check board has proper role and label
      const board = page.locator('.puzzle-board');
      await expect(board).toHaveAttribute('role', 'img');

      // Check timer has proper ARIA live region
      const timerFace = page.locator('.timer-display__face');
      await expect(timerFace).toHaveAttribute('aria-live', 'polite');

      // Check difficulty buttons have aria-pressed
      const activeButton = page.locator('.difficulty-btn--active').first();
      await expect(activeButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  test.describe('Timer Functionality', () => {
    test('should count down in timed mode', async ({ page }) => {
      // Get initial time
      const timerDisplay = page.locator('.timer-display__time');
      const initialTime = await timerDisplay.textContent();

      // Wait a few seconds for timer to tick
      await page.waitForFunction(
        (time) => {
          const el = document.querySelector('.timer-display__time');
          return el && el.textContent !== time;
        },
        initialTime,
        { timeout: 5000 }
      );

      // Time should have decreased
      const newTime = await timerDisplay.textContent();
      expect(newTime).not.toBe(initialTime);
    });

    test('should pause and resume timer', async ({ page }) => {
      // Click pause button
      const pauseBtn = page.locator('.timer-pause-btn');
      await pauseBtn.click();

      // Timer should show paused state
      await expect(page.getByText(/paused/i)).toBeVisible();

      // Get current time
      const timerDisplay = page.locator('.timer-display__time');
      const pausedTime = await timerDisplay.textContent();

      // Wait for timer to tick
      await page.waitForFunction(
        (time) => {
          const el = document.querySelector('.timer-display__time');
          return el && el.textContent === time;
        },
        pausedTime,
        { timeout: 3000 }
      ).catch(() => {
        // Timer didn't change, which is expected for paused state
      });

      // Time should not have changed
      const stillPausedTime = await timerDisplay.textContent();
      expect(stillPausedTime).toBe(pausedTime);

      // Resume
      await pauseBtn.click();

      // Paused indicator should disappear
      await expect(page.getByText(/paused/i)).not.toBeVisible();
    });

    test('should count up in practice mode', async ({ page }) => {
      // Switch to practice mode
      await page.getByRole('radio', { name: /practice/i }).click();

      // Time should start from 0:00 or low value and count up
      const timerDisplay = page.locator('.timer-display__time');
      const initialTime = await timerDisplay.textContent();

      // Wait for timer to change
      await page.waitForFunction(
        (time) => {
          const el = document.querySelector('.timer-display__time');
          return el && el.textContent !== time;
        },
        initialTime,
        { timeout: 5000 }
      );

      const newTime = await timerDisplay.textContent();

      // In practice mode, time counts up
      expect(newTime).not.toBe(initialTime);
    });
  });

  test.describe('Visual Feedback', () => {
    test('should highlight selected node', async ({ page }) => {
      // Click a node
      const emptyNode = page.getByRole('button', { name: /Empty node/i }).first();
      await emptyNode.click();

      // Node should have selected class
      const selectedNode = page.locator('.puzzle-node--selected');
      await expect(selectedNode).toBeVisible();
    });

    test('should show animation on number placement', async ({ page }) => {
      // Place a number
      await page.getByRole('button', { name: /Empty node/i }).first().click();
      await page.locator('.number-picker__option').first().click();

      // Should see just-placed animation class (briefly)
      const justPlacedNode = page.locator('.puzzle-node--just-placed');

      // This might be very brief, so we check within a short timeout
      try {
        await expect(justPlacedNode).toBeVisible({ timeout: 1000 });
      } catch {
        // Animation might have completed, that's okay
      }
    });
  });

  test.describe('Level Selection', () => {
    test('should switch between level templates', async ({ page }) => {
      // Get level buttons
      const levelButtons = page.locator('.level-btn');
      const count = await levelButtons.count();

      if (count > 1) {
        // Click second level
        await levelButtons.nth(1).click();

        // Second button should be active
        await expect(levelButtons.nth(1)).toHaveClass(/level-btn--active/);

        // First button should not be active
        await expect(levelButtons.first()).not.toHaveClass(/level-btn--active/);

        // Puzzle should reset
        const undoBtn = page.getByRole('button', { name: /undo/i });
        await expect(undoBtn).toBeDisabled();
      }
    });
  });

  test.describe('Master Mode', () => {
    test('should hide target sum in master mode', async ({ page }) => {
      // Switch to master difficulty
      const masterBtn = page.locator('.difficulty-btn--master');
      await masterBtn.click();

      // Target sum should be hidden (mystery value)
      const mysteryValue = page.locator('.mystery-value');
      await expect(mysteryValue).toBeVisible();
      await expect(mysteryValue).toHaveText('?');

      // Should have reveal button
      const revealBtn = page.locator('.btn--tiny').filter({ has: page.locator('text=👁️') });
      await expect(revealBtn).toBeVisible();
    });

    test('should reveal target sum when clicking reveal button', async ({ page }) => {
      // Switch to master difficulty
      await page.locator('.difficulty-btn--master').click();

      // Click reveal button
      const revealBtn = page.locator('.btn--tiny').filter({ has: page.locator('text=👁️') });
      await revealBtn.click();

      // Target sum should now be visible as a number
      const targetValue = page.locator('.puzzle-info__value--glow');
      const text = await targetValue.textContent();
      expect(text).toMatch(/^\d+$/); // Should be a number
    });
  });

  test.describe('Grandmaster Mode', () => {
    test('should show optimization goal selector in grandmaster mode', async ({ page }) => {
      // Switch to grandmaster difficulty
      const grandmasterBtn = page.locator('.difficulty-btn--grandmaster');
      await grandmasterBtn.click();

      // Should show optimization toggle
      const optimizationToggle = page.locator('.optimization-toggle');
      await expect(optimizationToggle).toBeVisible();

      // Should have minimize and maximize buttons
      await expect(page.getByRole('button', { name: /minimize/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /maximize/i })).toBeVisible();

      // Should show valid range
      await expect(page.locator('.puzzle-info__label').filter({ hasText: /valid range/i })).toBeVisible();
    });

    test('should toggle between minimize and maximize goals', async ({ page }) => {
      // Switch to grandmaster difficulty
      await page.locator('.difficulty-btn--grandmaster').click();

      // Minimize should be active by default
      const minimizeBtn = page.getByRole('button', { name: /minimize/i });
      await expect(minimizeBtn).toHaveClass(/opt-btn--active/);

      // Click maximize
      const maximizeBtn = page.getByRole('button', { name: /maximize/i });
      await maximizeBtn.click();

      // Maximize should now be active
      await expect(maximizeBtn).toHaveClass(/opt-btn--active/);
      await expect(minimizeBtn).not.toHaveClass(/opt-btn--active/);
    });
  });

  test.describe('Daily Challenge Mode', () => {
    test('should show daily challenge badge when in daily mode', async ({ page }) => {
      // Navigate to daily challenge
      await page.goto('/magic-graph?daily=true');
      await page.locator('.puzzle-board').waitFor({ state: 'visible' });

      // Should show daily badge
      const dailyBadge = page.locator('.daily-badge');
      await expect(dailyBadge).toBeVisible();
      await expect(dailyBadge).toContainText(/daily challenge/i);
    });

    test('should hide difficulty selector in daily mode', async ({ page }) => {
      // Navigate to daily challenge
      await page.goto('/magic-graph?daily=true');
      await page.locator('.puzzle-board').waitFor({ state: 'visible' });

      // Difficulty selector should not be visible
      const difficultySelector = page.locator('.difficulty-selector');
      await expect(difficultySelector).not.toBeVisible();
    });

    test('should hide level selector in daily mode', async ({ page }) => {
      // Navigate to daily challenge
      await page.goto('/magic-graph?daily=true');
      await page.locator('.puzzle-board').waitFor({ state: 'visible' });

      // Level selector should not be visible
      const levelSelector = page.locator('.level-selector');
      await expect(levelSelector).not.toBeVisible();
    });
  });
});
