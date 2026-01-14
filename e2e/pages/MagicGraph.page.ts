import { Page, Locator } from '@playwright/test';

/**
 * MagicGraph Page Object
 *
 * Represents the MagicGraph puzzle game (/magic-graph) with:
 * - Graph nodes and lines
 * - Number picker interface
 * - Timer and difficulty controls
 * - Win state detection
 */
export class MagicGraphPage {
  readonly page: Page;

  // Game container
  readonly gameContainer: Locator;

  // Game board elements
  readonly puzzleBoard: Locator;
  readonly nodes: Locator;
  readonly emptyNodes: Locator;
  readonly fixedNodes: Locator;
  readonly lines: Locator;

  // Number picker
  readonly numberPicker: Locator;
  readonly numberOptions: Locator;
  readonly pickerClose: Locator;
  readonly pickerClear: Locator;

  // Settings drawer
  readonly settingsDrawerTrigger: Locator;

  // Game controls
  readonly difficultySelector: Locator;
  readonly difficultyButtons: Locator;
  readonly undoButton: Locator;
  readonly redoButton: Locator;
  readonly resetButton: Locator;
  readonly nextPuzzleButton: Locator;
  readonly hintButton: Locator;
  readonly backButton: Locator;

  // Timer
  readonly timerContainer: Locator;
  readonly timerDisplay: Locator;
  readonly timerTime: Locator;
  readonly timerPauseBtn: Locator;
  readonly timedModeBtn: Locator;
  readonly practiceModeBtn: Locator;

  // Game info
  readonly gameInfo: Locator;

  // Level selector
  readonly levelButtons: Locator;
  readonly randomButton: Locator;

  // Win modal
  readonly winModal: Locator;
  readonly winModalTitle: Locator;
  readonly winModalTime: Locator;
  readonly winModalNextButton: Locator;

  // Daily challenge
  readonly dailyBadge: Locator;

  // Number inventory
  readonly numberInventory: Locator;

  // Hints panel
  readonly hintsPanel: Locator;

  constructor(page: Page) {
    this.page = page;

    // Game container
    this.gameContainer = page.locator('[data-testid="magic-graph-game"]');

    // Game board - uses .mg-board class
    this.puzzleBoard = page.locator('.mg-board');
    this.nodes = page.locator('.mg-node');
    this.emptyNodes = page.locator('.mg-node--empty');
    this.fixedNodes = page.locator('.mg-node--fixed');
    this.lines = page.locator('.mg-line');

    // Number picker - uses .mg-picker class
    this.numberPicker = page.locator('.mg-picker');
    this.numberOptions = this.numberPicker.locator('.mg-picker__option');
    this.pickerClose = this.numberPicker.locator('.mg-picker__close');
    this.pickerClear = this.numberPicker.locator('.mg-picker__clear');

    // Settings drawer trigger - uses data-testid
    this.settingsDrawerTrigger = page.locator('[data-testid="settings-drawer-trigger"]');

    // Difficulty selector (inside settings drawer)
    this.difficultySelector = page.locator('.difficulty-selector');
    this.difficultyButtons = page.locator('.difficulty-btn');

    // Game controls
    this.undoButton = page.getByRole('button', { name: /↩️|undo/i });
    this.redoButton = page.getByRole('button', { name: /↪️|redo/i });
    this.resetButton = page.getByRole('button', { name: /🔄|reset|chơi lại/i });
    this.nextPuzzleButton = page.getByRole('button', { name: /next puzzle|bài tiếp/i });
    this.hintButton = page.getByRole('button', { name: /need help|cần giúp|💡/i });
    this.backButton = page.locator('.action--secondary').filter({ hasText: /back|quay lại/i });

    // Timer - now inside SettingsDrawer (must open drawer first)
    this.timerContainer = page.locator('.timer-container');
    this.timerDisplay = page.locator('.timer-display');
    this.timerTime = page.locator('.timer-display__time');
    this.timerPauseBtn = page.locator('.timer-pause-btn');
    this.timedModeBtn = page.locator('.timer-mode-toggle__btn').filter({ hasText: /timed|hẹn giờ/i });
    this.practiceModeBtn = page.locator('.timer-mode-toggle__btn').filter({ hasText: /practice|luyện tập/i });

    // Game info
    this.gameInfo = page.locator('.game-info');

    // Level selector - uses .mg-level class
    this.levelButtons = page.locator('.mg-level');
    this.randomButton = page.getByRole('button', { name: /🎲|random|ngẫu nhiên/i });

    // Win modal
    this.winModal = page.locator('.game-modal');
    this.winModalTitle = page.locator('.game-modal__title');
    this.winModalTime = page.locator('.game-modal__time');
    this.winModalNextButton = this.winModal.locator('.action--primary');

    // Daily challenge badge
    this.dailyBadge = page.locator('.mg-daily');

    // Number inventory - uses .mg-inventory class
    this.numberInventory = page.locator('.mg-inventory');

    // Hints panel
    this.hintsPanel = page.locator('.mg-hints');
  }

  /**
   * Navigate to MagicGraph game
   */
  async goto(options?: { daily?: boolean; difficulty?: string }): Promise<void> {
    let url = '/magic-graph';

    const params = new URLSearchParams();
    if (options?.daily) params.append('daily', 'true');
    if (options?.difficulty) params.append('difficulty', options.difficulty);

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    await this.page.goto(url);
    await this.waitForLoad();
  }

  /**
   * Wait for game to be fully loaded
   */
  async waitForLoad(): Promise<void> {
    await this.puzzleBoard.waitFor({ state: 'visible' });
    await this.nodes.first().waitFor({ state: 'visible' });
    await this.page.waitForTimeout(200);
  }

  /**
   * Click on an empty node to open the number picker
   * Uses dispatchEvent to bypass header overlap issues on mobile viewports
   * where the header actions row may intercept pointer events
   */
  async clickEmptyNode(index: number = 0): Promise<void> {
    const emptyNode = this.emptyNodes.nth(index);
    // Scroll to center of viewport to avoid header overlap on mobile
    await emptyNode.scrollIntoViewIfNeeded();
    // Small delay to ensure scroll completes
    await this.page.waitForTimeout(100);
    // Use dispatchEvent to bypass header overlap on mobile
    // This directly triggers the click handler on the SVG element
    await emptyNode.dispatchEvent('click');
    await this.numberPicker.waitFor({ state: 'visible' });
  }

  /**
   * Select a number from the picker
   */
  async selectNumber(number: number): Promise<void> {
    const option = this.numberOptions.filter({ hasText: new RegExp(`^${number}$`) });
    await option.click();
    await this.numberPicker.waitFor({ state: 'hidden' });
  }

  /**
   * Place a number on an empty node
   */
  async placeNumber(nodeIndex: number, number: number): Promise<void> {
    await this.clickEmptyNode(nodeIndex);
    await this.selectNumber(number);
  }

  /**
   * Close the number picker
   * Uses dispatchEvent to bypass header overlap on mobile
   */
  async closeNumberPicker(): Promise<void> {
    await this.pickerClose.dispatchEvent('click');
    await this.numberPicker.waitFor({ state: 'hidden' });
  }

  /**
   * Clear a placed number
   */
  async clearNumber(): Promise<void> {
    if (await this.pickerClear.isVisible()) {
      await this.pickerClear.click();
      await this.numberPicker.waitFor({ state: 'hidden' });
    }
  }

  /**
   * Click undo button
   */
  async undo(): Promise<void> {
    await this.undoButton.click();
  }

  /**
   * Click redo button
   */
  async redo(): Promise<void> {
    await this.redoButton.click();
  }

  /**
   * Reset the puzzle
   */
  async reset(): Promise<void> {
    await this.resetButton.click();
  }

  /**
   * Go to next puzzle
   */
  async nextPuzzle(): Promise<void> {
    await this.nextPuzzleButton.click();
  }

  /**
   * Toggle hints panel
   */
  async toggleHints(): Promise<void> {
    await this.hintButton.click();
  }

  /**
   * Change difficulty
   */
  async changeDifficulty(difficulty: 'easy' | 'medium' | 'hard' | 'master' | 'grandmaster'): Promise<void> {
    const btn = this.page.locator(`.difficulty-btn--${difficulty}`);
    await btn.click();
    await this.page.waitForTimeout(300);
  }

  /**
   * Open settings drawer to access timer controls
   * Timer is now inside the settings drawer
   */
  async openSettingsDrawer(): Promise<void> {
    // Check if drawer is already open
    const isOpen = await this.timerContainer.isVisible().catch(() => false);
    if (!isOpen) {
      await this.settingsDrawerTrigger.click();
      // Wait for drawer animation and timer to be visible
      await this.timerContainer.waitFor({ state: 'visible', timeout: 5000 });
    }
  }

  /**
   * Switch to practice mode
   * Opens settings drawer first since timer is now inside it
   */
  async switchToPracticeMode(): Promise<void> {
    await this.openSettingsDrawer();
    await this.practiceModeBtn.click();
  }

  /**
   * Switch to timed mode
   * Opens settings drawer first since timer is now inside it
   */
  async switchToTimedMode(): Promise<void> {
    await this.openSettingsDrawer();
    await this.timedModeBtn.click();
  }

  /**
   * Check if puzzle is solved (win modal visible)
   */
  async isPuzzleSolved(): Promise<boolean> {
    return this.winModal.isVisible();
  }

  /**
   * Get timer display text
   * Opens settings drawer first since timer is now inside it
   */
  async getTimerText(): Promise<string | null> {
    await this.openSettingsDrawer();
    return this.timerTime.textContent();
  }

  /**
   * Check if in practice mode
   * Opens settings drawer first since timer is now inside it
   */
  async isInPracticeMode(): Promise<boolean> {
    await this.openSettingsDrawer();
    const practiceBtn = this.practiceModeBtn;
    const classes = await practiceBtn.getAttribute('class');
    return classes?.includes('--active') ?? false;
  }

  /**
   * Get the number of empty nodes
   */
  async getEmptyNodeCount(): Promise<number> {
    return this.emptyNodes.count();
  }

  /**
   * Get the total number of nodes
   */
  async getTotalNodeCount(): Promise<number> {
    return this.nodes.count();
  }

  /**
   * Check if undo button is enabled
   */
  async isUndoEnabled(): Promise<boolean> {
    return !(await this.undoButton.isDisabled());
  }

  /**
   * Check if redo button is enabled
   */
  async isRedoEnabled(): Promise<boolean> {
    return !(await this.redoButton.isDisabled());
  }

  /**
   * Pause the timer
   * Opens settings drawer first since timer is now inside it
   */
  async pauseTimer(): Promise<void> {
    await this.openSettingsDrawer();
    await this.timerPauseBtn.click();
  }

  /**
   * Resume the timer
   * Opens settings drawer first since timer is now inside it
   */
  async resumeTimer(): Promise<void> {
    await this.openSettingsDrawer();
    await this.timerPauseBtn.click();
  }

  /**
   * Check if timer is paused
   * Opens settings drawer first since timer is now inside it
   */
  async isTimerPaused(): Promise<boolean> {
    await this.openSettingsDrawer();
    const classes = await this.timerDisplay.getAttribute('class');
    return classes?.includes('--paused') ?? false;
  }
}
