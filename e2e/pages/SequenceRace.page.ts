import type { Page, Locator } from '@playwright/test';

/**
 * Page Object for SequenceRace game
 *
 * Turn-based strategy game where players race to reach a target number.
 * Features AI opponent, difficulty levels, and two-player mode.
 */
export class SequenceRacePage {
  readonly page: Page;

  // Main navigation
  readonly gameTitle: Locator;

  // Timer and controls
  readonly timer: Locator;
  readonly timerDisplay: Locator;
  readonly practiceToggle: Locator;
  readonly pauseButton: Locator;
  readonly resumeButton: Locator;

  // Game mode controls
  readonly modeToggle: Locator;
  readonly vsAIButton: Locator;
  readonly twoPlayerButton: Locator;

  // Difficulty selector
  readonly difficultySelector: Locator;
  readonly easyButton: Locator;
  readonly mediumButton: Locator;
  readonly hardButton: Locator;

  // Game info panel
  readonly targetValue: Locator;
  readonly positionValue: Locator;
  readonly turnIndicator: Locator;

  // Race track
  readonly raceTrack: Locator;
  readonly playerRunner: Locator;
  readonly aiRunner: Locator;

  // Turn indicator
  readonly currentTurnText: Locator;

  // Step cards (available moves)
  readonly stepCards: Locator;

  // History log
  readonly historyLog: Locator;
  readonly historyEntries: Locator;

  // Actions
  readonly restartButton: Locator;
  readonly randomButton: Locator;
  readonly hintToggle: Locator;
  readonly hintsPanel: Locator;

  // Level selector
  readonly levelSelector: Locator;

  // Overlays
  readonly gameOverOverlay: Locator;
  readonly winOverlay: Locator;
  readonly loseOverlay: Locator;
  readonly timeUpOverlay: Locator;

  // Overlay content
  readonly overlayTitle: Locator;
  readonly overlayMessage: Locator;
  readonly overlayStats: Locator;
  readonly playAgainButton: Locator;
  readonly newGameButton: Locator;
  readonly tryAgainButton: Locator;

  // Daily challenge
  readonly dailyBadge: Locator;
  readonly dailyCheckmark: Locator;

  constructor(page: Page) {
    this.page = page;

    // Main navigation
    this.gameTitle = page.getByRole('heading', { name: /sequence race/i });

    // Timer and controls
    this.timer = page.locator('.timer');
    this.timerDisplay = page.locator('.timer__display');
    this.practiceToggle = page.locator('.timer__practice-toggle');
    this.pauseButton = page.locator('.timer__pause-btn');
    this.resumeButton = page.locator('.timer__resume-btn');

    // Game mode controls
    this.modeToggle = page.locator('.mode-toggle');
    this.vsAIButton = this.modeToggle.locator('button', { hasText: /vs ai/i });
    this.twoPlayerButton = this.modeToggle.locator('button', { hasText: /two player/i });

    // Difficulty selector
    this.difficultySelector = page.locator('.difficulty-selector');
    this.easyButton = this.difficultySelector.locator('button', { hasText: /easy/i });
    this.mediumButton = this.difficultySelector.locator('button', { hasText: /medium/i });
    this.hardButton = this.difficultySelector.locator('button', { hasText: /hard/i });

    // Game info panel
    this.targetValue = page.locator('.game-info-panel__value--glow');
    this.positionValue = page.locator('.game-info-panel__item').filter({ hasText: /position/i }).locator('.game-info-panel__value');
    this.turnIndicator = page.locator('.game-info-panel__item').filter({ hasText: /turn/i }).locator('.game-info-panel__value');

    // Race track
    this.raceTrack = page.locator('.track-wrapper');
    this.playerRunner = page.locator('.runner--player');
    this.aiRunner = page.locator('.runner--ai');

    // Turn indicator
    this.currentTurnText = page.locator('.turn-indicator');

    // Step cards (available moves)
    this.stepCards = page.locator('.step-cards');

    // History log
    this.historyLog = page.locator('.history-log');
    this.historyEntries = this.historyLog.locator('.history-entry');

    // Actions
    this.restartButton = page.getByRole('button', { name: /restart/i });
    this.randomButton = page.getByRole('button', { name: /random/i });
    this.hintToggle = page.getByRole('button', { name: /hint/i });
    this.hintsPanel = page.locator('.hints-panel');

    // Level selector
    this.levelSelector = page.locator('.level-selector');

    // Overlays
    this.gameOverOverlay = page.locator('.game-overlay');
    this.winOverlay = page.locator('.game-overlay--win');
    this.loseOverlay = page.locator('.game-overlay--lose');
    this.timeUpOverlay = page.locator('.game-overlay--timeUp');

    // Overlay content
    this.overlayTitle = this.gameOverOverlay.locator('.game-overlay__title');
    this.overlayMessage = this.gameOverOverlay.locator('.game-overlay__message');
    this.overlayStats = this.gameOverOverlay.locator('.game-overlay__stats');
    this.playAgainButton = this.gameOverOverlay.getByRole('button', { name: /play again/i });
    this.newGameButton = this.gameOverOverlay.getByRole('button', { name: /new game/i });
    this.tryAgainButton = this.gameOverOverlay.getByRole('button', { name: /try again/i });

    // Daily challenge
    this.dailyBadge = page.locator('.daily-badge');
    this.dailyCheckmark = this.dailyBadge.locator('.daily-badge__check');
  }

  /**
   * Navigate to SequenceRace game
   * @param daily - Whether to navigate to daily challenge mode
   */
  async goto(daily = false) {
    const url = daily ? '/sequence-race?daily=true' : '/sequence-race';
    await this.page.goto(url);
    await this.gameTitle.waitFor({ state: 'visible' });
  }

  /**
   * Select a specific step card
   * @param stepValue - The step value to select (e.g., 1, 2, 3)
   */
  async selectStep(stepValue: number) {
    const stepCard = this.stepCards.locator('.step-card', { hasText: `+${stepValue}` });
    await stepCard.click();
  }

  /**
   * Get the current target number
   */
  async getTargetNumber(): Promise<number> {
    const text = await this.targetValue.textContent();
    return text ? parseInt(text, 10) : 0;
  }

  /**
   * Get the current position
   */
  async getCurrentPosition(): Promise<number> {
    const text = await this.positionValue.textContent();
    return text ? parseInt(text, 10) : 0;
  }

  /**
   * Get the current turn (e.g., "You", "AI", "Player 1", "Player 2")
   */
  async getCurrentTurn(): Promise<string> {
    return (await this.turnIndicator.textContent()) || '';
  }

  /**
   * Wait for AI to make a move
   */
  async waitForAIMove() {
    // Wait for turn indicator to switch from AI back to player
    await this.page.waitForTimeout(1000); // AI thinking animation
    await this.currentTurnText.waitFor({ state: 'visible' });
  }

  /**
   * Get the number of moves in the history
   */
  async getMoveCount(): Promise<number> {
    return await this.historyEntries.count();
  }

  /**
   * Check if a specific step is available (not disabled)
   * @param stepValue - The step value to check
   */
  async isStepAvailable(stepValue: number): Promise<boolean> {
    const stepCard = this.stepCards.locator('.step-card', { hasText: `+${stepValue}` });
    const disabled = await stepCard.getAttribute('disabled');
    return disabled === null;
  }

  /**
   * Switch to two-player mode
   */
  async switchToTwoPlayer() {
    await this.twoPlayerButton.click();
  }

  /**
   * Switch to VS AI mode
   */
  async switchToVsAI() {
    await this.vsAIButton.click();
  }

  /**
   * Set difficulty level
   * @param difficulty - 'easy', 'medium', or 'hard'
   */
  async setDifficulty(difficulty: 'easy' | 'medium' | 'hard') {
    const button = difficulty === 'easy' ? this.easyButton : difficulty === 'medium' ? this.mediumButton : this.hardButton;
    await button.click();
  }

  /**
   * Toggle hints panel
   */
  async toggleHints() {
    await this.hintToggle.click();
  }

  /**
   * Restart current game
   */
  async restart() {
    await this.restartButton.click();
  }

  /**
   * Start a random game
   */
  async startRandomGame() {
    await this.randomButton.click();
  }

  /**
   * Toggle practice mode
   */
  async togglePracticeMode() {
    await this.practiceToggle.click();
  }

  /**
   * Pause the timer
   */
  async pauseTimer() {
    await this.pauseButton.click();
  }

  /**
   * Resume the timer
   */
  async resumeTimer() {
    await this.resumeButton.click();
  }

  /**
   * Check if game is won
   */
  async isGameWon(): Promise<boolean> {
    return await this.winOverlay.isVisible();
  }

  /**
   * Check if game is lost
   */
  async isGameLost(): Promise<boolean> {
    return await this.loseOverlay.isVisible();
  }

  /**
   * Check if time is up
   */
  async isTimeUp(): Promise<boolean> {
    return await this.timeUpOverlay.isVisible();
  }

  /**
   * Get elapsed time from overlay stats
   */
  async getElapsedTime(): Promise<number> {
    const stats = await this.overlayStats.textContent();
    const match = stats?.match(/(\d+)s/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Click Play Again button in game over overlay
   */
  async playAgain() {
    await this.playAgainButton.click();
  }

  /**
   * Click New Game button in game over overlay
   */
  async playNewGame() {
    await this.newGameButton.click();
  }
}
