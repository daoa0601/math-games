import { Page, Locator } from '@playwright/test';

/**
 * MagicGraph Page Object
 *
 * Represents the MagicGraph puzzle game (/magic-graph) with:
 * - Graph nodes (fixed and empty)
 * - Number picker interface
 * - Timer and controls
 * - Difficulty selector
 * - Win state detection
 */
export class MagicGraphPage {
  readonly page: Page;

  // Game board elements
  readonly puzzleBoard: Locator;
  readonly nodes: Locator;
  readonly lines: Locator;

  // Number picker
  readonly numberPicker: Locator;
  readonly numberButtons: Locator;

  // Game controls
  readonly difficultySelector: Locator;
  readonly hintButton: Locator;
  readonly restartButton: Locator;
  readonly backButton: Locator;
  readonly soundToggle: Locator;

  // Timer display
  readonly timer: Locator;

  // Game info
  readonly targetSumDisplay: Locator;
  readonly numberInventory: Locator;

  // Win bottom sheet
  readonly winBottomSheet: Locator;
  readonly winSheetBackdrop: Locator;
  readonly winSheetTitle: Locator;
  readonly winSheetTime: Locator;
  readonly winSheetNextButton: Locator;
  readonly winSheetInsight: Locator;
  readonly winSheetPersonalBest: Locator;

  // Tutorial
  readonly tutorialOverlay: Locator;
  readonly skipTutorialButton: Locator;

  // Practice mode toggle
  readonly practiceModeToggle: Locator;

  constructor(page: Page) {
    this.page = page;

    // Game board
    this.puzzleBoard = page.locator('.puzzle-board');
    this.nodes = page.locator('.puzzle-node');
    this.lines = page.locator('.puzzle-line');

    // Number picker popup
    this.numberPicker = page.locator('.number-picker');
    this.numberButtons = this.numberPicker.locator('button[data-number]');

    // Game controls
    this.difficultySelector = page.locator('.difficulty-selector');
    this.hintButton = page.getByRole('button', { name: /hint|gợi ý/i });
    this.restartButton = page.getByRole('button', { name: /restart|chơi lại/i });
    this.backButton = page.getByRole('button', { name: /back|quay lại/i });
    this.soundToggle = page.getByRole('button', { name: /sound|âm thanh/i });

    // Timer
    this.timer = page.locator('.timer');

    // Game info
    this.targetSumDisplay = page.locator('.target-sum, .puzzle-info').first();
    this.numberInventory = page.locator('.number-inventory');

    // Win/Lose modal (centered)
    this.winBottomSheet = page.locator('.game-modal');
    this.winSheetBackdrop = page.locator('.game-modal__backdrop');
    this.winSheetTitle = this.winBottomSheet.locator('.game-modal__title');
    this.winSheetTime = this.winBottomSheet.locator('.game-modal__time');
    this.winSheetNextButton = this.winBottomSheet.locator('.btn--primary');
    this.winSheetInsight = this.winBottomSheet.locator('.game-modal__insight');
    this.winSheetPersonalBest = this.winBottomSheet.locator('.personal-best');

    // Tutorial
    this.tutorialOverlay = page.locator('.tutorial-overlay, .magic-graph-tutorial');
    this.skipTutorialButton = page.getByRole('button', { name: /skip|bỏ qua/i });

    // Practice mode
    this.practiceModeToggle = page.getByRole('checkbox', { name: /practice|luyện tập/i });
  }

  /**
   * Navigate to MagicGraph game
   */
  async goto(options?: { daily?: boolean; difficulty?: string }): Promise<void> {
    let url = '/magic-graph';

    // Add query parameters if provided
    const params = new URLSearchParams();
    if (options?.daily) params.append('daily', 'true');
    if (options?.difficulty) params.append('difficulty', options.difficulty);

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    await this.page.goto(url);

    // Wait for puzzle board to be visible
    await this.puzzleBoard.waitFor({ state: 'visible' });
  }

  /**
   * Close tutorial if it's showing
   */
  async closeTutorial(): Promise<void> {
    if (await this.tutorialOverlay.isVisible()) {
      await this.skipTutorialButton.click();
      await this.tutorialOverlay.waitFor({ state: 'hidden' });
    }
  }

  /**
   * Get all nodes on the board
   */
  async getAllNodes(): Promise<
    Array<{
      id: string;
      value: string | null;
      isFixed: boolean;
      isEmpty: boolean;
    }>
  > {
    const nodeElements = await this.nodes.all();

    return Promise.all(
      nodeElements.map(async (node) => {
        const id = (await node.getAttribute('data-node-id')) || '';
        const valueText = await node.textContent();
        const classes = (await node.getAttribute('class')) || '';

        return {
          id,
          value: valueText?.trim() || null,
          isFixed: classes.includes('puzzle-node--fixed'),
          isEmpty: classes.includes('puzzle-node--empty'),
        };
      })
    );
  }

  /**
   * Click on a node to open number picker
   */
  async clickNode(nodeId: string): Promise<void> {
    const node = this.nodes.filter({ has: this.page.locator(`[data-node-id="${nodeId}"]`) }).first();
    await node.click();

    // Wait for number picker to appear
    await this.numberPicker.waitFor({ state: 'visible' });
  }

  /**
   * Click on an empty node (by index)
   */
  async clickEmptyNode(index: number = 0): Promise<void> {
    const emptyNodes = this.nodes.filter({ hasText: /^$/ });
    const node = emptyNodes.nth(index);
    await node.click();

    // Wait for number picker to appear
    await this.numberPicker.waitFor({ state: 'visible' });
  }

  /**
   * Select a number from the picker
   */
  async selectNumber(number: number): Promise<void> {
    const button = this.numberButtons.filter({ hasText: number.toString() }).first();
    await button.click();

    // Wait for picker to close
    await this.numberPicker.waitFor({ state: 'hidden' });
  }

  /**
   * Place a number on a node (combines click node + select number)
   */
  async placeNumber(nodeId: string, number: number): Promise<void> {
    await this.clickNode(nodeId);
    await this.selectNumber(number);
  }

  /**
   * Get available numbers from inventory
   */
  async getAvailableNumbers(): Promise<number[]> {
    const inventory = await this.numberInventory.locator('.inventory-number').all();
    const numbers = await Promise.all(
      inventory.map(async (el) => {
        const text = await el.textContent();
        return parseInt(text?.trim() || '0', 10);
      })
    );
    return numbers.filter(n => !isNaN(n));
  }

  /**
   * Get target sum value
   */
  async getTargetSum(): Promise<number> {
    const text = await this.targetSumDisplay.textContent();
    const match = text?.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  }

  /**
   * Get current timer value (in seconds)
   */
  async getTimerValue(): Promise<number> {
    const text = await this.timer.textContent();
    if (!text) return 0;

    // Parse MM:SS format
    const match = text.match(/(\d+):(\d+)/);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      return minutes * 60 + seconds;
    }

    return 0;
  }

  /**
   * Check if timer is running
   */
  async isTimerRunning(): Promise<boolean> {
    // Timer should be visible and have a value
    if (!(await this.timer.isVisible())) return false;

    const initialValue = await this.getTimerValue();
    await this.page.waitForTimeout(1100); // Wait slightly more than 1 second
    const newValue = await this.getTimerValue();

    // Timer is running if value increased (counting up) or decreased (counting down)
    return newValue !== initialValue;
  }

  /**
   * Click restart button
   */
  async restart(): Promise<void> {
    await this.restartButton.click();
    // Wait for board to reload
    await this.page.waitForTimeout(500);
  }

  /**
   * Click hint button
   */
  async getHint(): Promise<void> {
    await this.hintButton.click();
    // Wait for hint to be applied
    await this.page.waitForTimeout(300);
  }

  /**
   * Change difficulty level
   */
  async changeDifficulty(difficulty: 'easy' | 'medium' | 'hard' | 'master' | 'grandmaster'): Promise<void> {
    await this.difficultySelector.selectOption(difficulty);
    // Wait for new puzzle to generate
    await this.page.waitForTimeout(1000);
  }

  /**
   * Check if puzzle is solved (win bottom sheet visible)
   */
  async isPuzzleSolved(): Promise<boolean> {
    return this.winBottomSheet.isVisible();
  }

  /**
   * Get win title text
   */
  async getWinTitle(): Promise<string | null> {
    if (!(await this.isPuzzleSolved())) return null;
    return this.winSheetTitle.textContent();
  }

  /**
   * Get win time display
   */
  async getWinTime(): Promise<string | null> {
    if (!(await this.isPuzzleSolved())) return null;
    return this.winSheetTime.textContent();
  }

  /**
   * Click "Next Puzzle" button after winning
   */
  async nextPuzzle(): Promise<void> {
    await this.winSheetNextButton.click();
    // Wait for new puzzle
    await this.page.waitForTimeout(500);
  }

  /**
   * Navigate back to dashboard
   */
  async goBack(): Promise<void> {
    await this.backButton.click();
    await this.page.waitForURL('/');
  }

  /**
   * Toggle practice mode
   */
  async togglePracticeMode(): Promise<void> {
    await this.practiceModeToggle.click();
    // Wait for state to update
    await this.page.waitForTimeout(200);
  }

  /**
   * Check if practice mode is enabled
   */
  async isPracticeModeEnabled(): Promise<boolean> {
    return this.practiceModeToggle.isChecked();
  }

  /**
   * Get all line statuses (complete, incomplete, impossible)
   */
  async getLineStatuses(): Promise<{
    complete: number;
    incomplete: number;
    impossible: number;
  }> {
    const lineElements = await this.lines.all();

    let complete = 0;
    let incomplete = 0;
    let impossible = 0;

    for (const line of lineElements) {
      const classes = (await line.getAttribute('class')) || '';
      if (classes.includes('puzzle-line--complete')) complete++;
      else if (classes.includes('puzzle-line--impossible')) impossible++;
      else incomplete++;
    }

    return { complete, incomplete, impossible };
  }

  /**
   * Check if a node is highlighted (recommended or just placed)
   */
  async isNodeHighlighted(nodeId: string): Promise<boolean> {
    const node = this.nodes.filter({ has: this.page.locator(`[data-node-id="${nodeId}"]`) }).first();
    const classes = (await node.getAttribute('class')) || '';
    return classes.includes('puzzle-node--recommended') || classes.includes('puzzle-node--sparkle');
  }

  /**
   * Wait for game to be fully loaded
   */
  async waitForLoad(): Promise<void> {
    // Wait for puzzle board
    await this.puzzleBoard.waitFor({ state: 'visible' });

    // Wait for nodes to render
    await this.nodes.first().waitFor({ state: 'visible' });

    // Close tutorial if showing
    await this.closeTutorial();

    // Small delay for animations
    await this.page.waitForTimeout(200);
  }

  /**
   * Solve the puzzle by filling all empty nodes with valid numbers
   * (Helper method for testing - attempts a simple solution strategy)
   */
  async attemptSimpleSolve(): Promise<void> {
    const availableNumbers = await this.getAvailableNumbers();
    const nodes = await this.getAllNodes();
    const emptyNodes = nodes.filter(n => n.isEmpty);

    // Simple strategy: fill empty nodes with available numbers in order
    for (let i = 0; i < emptyNodes.length && i < availableNumbers.length; i++) {
      const node = emptyNodes[i];
      const number = availableNumbers[i];

      try {
        await this.placeNumber(node.id, number);
        await this.page.waitForTimeout(200); // Brief pause between placements
      } catch (error) {
        // Continue if placement fails
        console.warn(`Failed to place ${number} on node ${node.id}`);
      }

      // Check if we won
      if (await this.isPuzzleSolved()) {
        break;
      }
    }
  }
}
