import type { Page, Locator } from '@playwright/test';

/**
 * Page Object for ShapeArchitect game
 *
 * 3D voxel-based geometry puzzle game where players place tetromino pieces
 * to fill a target shape. Features 2D and 3D views, rotation controls, and
 * layer visibility controls.
 */
export class ShapeArchitectPage {
  readonly page: Page;

  // Main navigation
  readonly gameTitle: Locator;

  // Timer and controls
  readonly timer: Locator;
  readonly timerDisplay: Locator;
  readonly practiceToggle: Locator;
  readonly pauseButton: Locator;
  readonly resumeButton: Locator;

  // Difficulty selector
  readonly difficultySelector: Locator;
  readonly easyButton: Locator;
  readonly mediumButton: Locator;
  readonly hardButton: Locator;

  // Score display
  readonly scoreDisplay: Locator;
  readonly scoreValue: Locator;

  // Level info panel
  readonly levelName: Locator;
  readonly piecesLeftValue: Locator;
  readonly rotationDisplay: Locator;

  // Instructions
  readonly instructions: Locator;

  // Placement error
  readonly placementError: Locator;

  // View mode toggle
  readonly viewModeToggle: Locator;
  readonly view2DButton: Locator;
  readonly view3DButton: Locator;

  // Grid board (2D view)
  readonly gridBoard: Locator;
  readonly gridCells: Locator;

  // 3D view specific
  readonly gridBoard3D: Locator;
  readonly canvas3D: Locator;
  readonly cameraPresetButtons: Locator;
  readonly isometricViewButton: Locator;
  readonly topViewButton: Locator;
  readonly frontViewButton: Locator;
  readonly sideViewButton: Locator;

  // Layer controls (3D view)
  readonly layerControls: Locator;
  readonly layerSlider: Locator;

  // Rotation controls
  readonly rotationControls: Locator;
  readonly rotateXButton: Locator;
  readonly rotateYButton: Locator;
  readonly rotateZButton: Locator;
  readonly rotationHintTooltip: Locator;

  // Undo button
  readonly undoButton: Locator;

  // Piece inventory
  readonly pieceInventory: Locator;
  readonly pieces: Locator;

  // Hints
  readonly hintToggle: Locator;
  readonly hintsPanel: Locator;

  // Actions
  readonly resetButton: Locator;
  readonly nextLevelButton: Locator;
  readonly randomButton: Locator;
  readonly editorButton: Locator;

  // Level selector
  readonly levelSelector: Locator;
  readonly levelButtons: Locator;

  // Overlays
  readonly winOverlay: Locator;
  readonly timeUpOverlay: Locator;

  // Win overlay content
  readonly winTitle: Locator;
  readonly winMessage: Locator;
  readonly winStats: Locator;
  readonly randomLevelButton: Locator;

  // Time up overlay content
  readonly timeUpTitle: Locator;
  readonly timeUpMessage: Locator;
  readonly tryAgainButton: Locator;
  readonly skipLevelButton: Locator;

  // Daily challenge
  readonly dailyBadge: Locator;
  readonly dailyCheckmark: Locator;

  // Level Editor
  readonly levelEditorOverlay: Locator;
  readonly levelEditor: Locator;

  constructor(page: Page) {
    this.page = page;

    // Main navigation
    this.gameTitle = page.getByRole('heading', { name: /shape architect/i });

    // Timer and controls
    this.timer = page.locator('.timer');
    this.timerDisplay = page.locator('.timer__display');
    this.practiceToggle = page.locator('.timer__practice-toggle');
    this.pauseButton = page.locator('.timer__pause-btn');
    this.resumeButton = page.locator('.timer__resume-btn');

    // Difficulty selector
    this.difficultySelector = page.locator('.difficulty-selector');
    this.easyButton = this.difficultySelector.locator('button', { hasText: /easy/i });
    this.mediumButton = this.difficultySelector.locator('button', { hasText: /medium/i });
    this.hardButton = this.difficultySelector.locator('button', { hasText: /hard/i });

    // Score display
    this.scoreDisplay = page.locator('.score-display');
    this.scoreValue = this.scoreDisplay.locator('.score-display__value');

    // Level info panel
    this.levelName = page.locator('.level-info__item').filter({ hasText: /level/i }).locator('.level-info__value');
    this.piecesLeftValue = page.locator('.level-info__value--glow');
    this.rotationDisplay = page.locator('.level-info__item').filter({ hasText: /rotation/i }).locator('.level-info__value');

    // Instructions
    this.instructions = page.locator('.instructions');

    // Placement error
    this.placementError = page.locator('.placement-error');

    // View mode toggle
    this.viewModeToggle = page.locator('.view-mode-toggle');
    this.view2DButton = this.viewModeToggle.locator('button', { hasText: '2D' });
    this.view3DButton = this.viewModeToggle.locator('button', { hasText: '3D' });

    // Grid board (2D view)
    this.gridBoard = page.locator('.grid-board');
    this.gridCells = this.gridBoard.locator('.grid-cell');

    // 3D view specific
    this.gridBoard3D = page.locator('.grid-board-3d');
    this.canvas3D = this.gridBoard3D.locator('canvas');
    this.cameraPresetButtons = page.locator('.camera-preset-buttons');
    this.isometricViewButton = this.cameraPresetButtons.locator('button', { hasText: /isometric/i });
    this.topViewButton = this.cameraPresetButtons.locator('button', { hasText: /top/i });
    this.frontViewButton = this.cameraPresetButtons.locator('button', { hasText: /front/i });
    this.sideViewButton = this.cameraPresetButtons.locator('button', { hasText: /side/i });

    // Layer controls (3D view)
    this.layerControls = page.locator('.layer-controls');
    this.layerSlider = this.layerControls.locator('input[type="range"]');

    // Rotation controls
    this.rotationControls = page.locator('.rotation-controls');
    this.rotateXButton = this.rotationControls.locator('button[title*="X"]');
    this.rotateYButton = this.rotationControls.locator('button[title*="Y"]');
    this.rotateZButton = this.rotationControls.locator('button[title*="Z"]');
    this.rotationHintTooltip = page.locator('.rotation-hint-tooltip');

    // Undo button
    this.undoButton = page.locator('.btn--icon', { hasText: '↩️' });

    // Piece inventory
    this.pieceInventory = page.locator('.piece-inventory');
    this.pieces = this.pieceInventory.locator('.piece-card');

    // Hints
    this.hintToggle = page.getByRole('button', { name: /hint/i });
    this.hintsPanel = page.locator('.hints-panel');

    // Actions
    this.resetButton = page.getByRole('button', { name: /reset/i });
    this.nextLevelButton = page.getByRole('button', { name: /next level/i });
    this.randomButton = page.getByRole('button', { name: /random/i });
    this.editorButton = page.getByRole('button', { name: /editor/i });

    // Level selector
    this.levelSelector = page.locator('.level-selector');
    this.levelButtons = this.levelSelector.locator('.level-btn');

    // Overlays
    this.winOverlay = page.locator('.shape-win-overlay');
    this.timeUpOverlay = page.locator('.time-up-overlay');

    // Win overlay content
    this.winTitle = this.winOverlay.locator('.shape-win-overlay__title');
    this.winMessage = this.winOverlay.locator('p').first();
    this.winStats = this.winOverlay.locator('.win-overlay__stats');
    this.randomLevelButton = this.winOverlay.getByRole('button', { name: /random level/i });

    // Time up overlay content
    this.timeUpTitle = this.timeUpOverlay.locator('.time-up-overlay__title');
    this.timeUpMessage = this.timeUpOverlay.locator('.time-up-overlay__message');
    this.tryAgainButton = this.timeUpOverlay.getByRole('button', { name: /try again/i });
    this.skipLevelButton = this.timeUpOverlay.getByRole('button', { name: /skip level/i });

    // Daily challenge
    this.dailyBadge = page.locator('.daily-badge');
    this.dailyCheckmark = this.dailyBadge.locator('.daily-badge__check');

    // Level Editor
    this.levelEditorOverlay = page.locator('.level-editor-overlay');
    this.levelEditor = page.locator('.level-editor');
  }

  /**
   * Navigate to ShapeArchitect game
   * @param daily - Whether to navigate to daily challenge mode
   */
  async goto(daily = false) {
    const url = daily ? '/math-games/#/shape-architect?daily=true' : '/math-games/#/shape-architect';
    await this.page.goto(url);
    await this.gameTitle.waitFor({ state: 'visible' });
  }

  /**
   * Select a piece from the inventory
   * @param pieceIndex - Index of the piece to select (0-based)
   */
  async selectPiece(pieceIndex: number) {
    const piece = this.pieces.nth(pieceIndex);
    await piece.click();
  }

  /**
   * Select a piece by name
   * @param pieceName - Name of the piece (e.g., "I-Block", "L-Block")
   */
  async selectPieceByName(pieceName: string) {
    const piece = this.pieces.filter({ hasText: pieceName });
    await piece.click();
  }

  /**
   * Click a grid cell to place a piece
   * @param x - X coordinate
   * @param y - Y coordinate
   * @param z - Z coordinate (layer)
   */
  async clickCell(x: number, y: number, z: number) {
    const cell = this.gridBoard.locator(`[data-position="${x},${y},${z}"]`);
    await cell.click();
  }

  /**
   * Rotate piece on X axis
   */
  async rotateX() {
    await this.rotateXButton.click();
  }

  /**
   * Rotate piece on Y axis
   */
  async rotateY() {
    await this.rotateYButton.click();
  }

  /**
   * Rotate piece on Z axis
   */
  async rotateZ() {
    await this.rotateZButton.click();
  }

  /**
   * Switch to 2D view
   */
  async switchTo2D() {
    await this.view2DButton.click();
  }

  /**
   * Switch to 3D view
   */
  async switchTo3D() {
    await this.view3DButton.click();
  }

  /**
   * Set camera preset in 3D view
   * @param preset - 'isometric', 'top', 'front', or 'side'
   */
  async setCameraPreset(preset: 'isometric' | 'top' | 'front' | 'side') {
    const button = preset === 'isometric' ? this.isometricViewButton :
                   preset === 'top' ? this.topViewButton :
                   preset === 'front' ? this.frontViewButton :
                   this.sideViewButton;
    await button.click();
  }

  /**
   * Set maximum visible layer (3D view)
   * @param layer - Layer number (0-based)
   */
  async setMaxVisibleLayer(layer: number) {
    await this.layerSlider.fill(layer.toString());
  }

  /**
   * Undo last piece placement
   */
  async undo() {
    await this.undoButton.click();
  }

  /**
   * Get number of pieces remaining
   */
  async getPiecesLeft(): Promise<number> {
    const text = await this.piecesLeftValue.textContent();
    return text ? parseInt(text, 10) : 0;
  }

  /**
   * Get current rotation values
   */
  async getRotation(): Promise<{ x: number; y: number; z: number }> {
    const text = await this.rotationDisplay.textContent();
    const match = text?.match(/X:(\d+)° Y:(\d+)° Z:(\d+)°/);
    if (match) {
      return {
        x: parseInt(match[1], 10),
        y: parseInt(match[2], 10),
        z: parseInt(match[3], 10),
      };
    }
    return { x: 0, y: 0, z: 0 };
  }

  /**
   * Get current score
   */
  async getScore(): Promise<number> {
    const text = await this.scoreValue.textContent();
    return text ? parseInt(text, 10) : 0;
  }

  /**
   * Set difficulty level
   * @param difficulty - 'easy', 'medium', or 'hard'
   */
  async setDifficulty(difficulty: 'easy' | 'medium' | 'hard') {
    const button = difficulty === 'easy' ? this.easyButton :
                   difficulty === 'medium' ? this.mediumButton :
                   this.hardButton;
    await button.click();
  }

  /**
   * Toggle hints panel
   */
  async toggleHints() {
    await this.hintToggle.click();
  }

  /**
   * Reset current level
   */
  async reset() {
    await this.resetButton.click();
  }

  /**
   * Go to next level
   */
  async nextLevel() {
    await this.nextLevelButton.click();
  }

  /**
   * Start a random level
   */
  async startRandomLevel() {
    await this.randomButton.click();
  }

  /**
   * Open level editor
   */
  async openEditor() {
    await this.editorButton.click();
  }

  /**
   * Select a specific level
   * @param levelName - Name of the level
   */
  async selectLevel(levelName: string) {
    const button = this.levelButtons.filter({ hasText: levelName });
    await button.click();
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
   * Check if puzzle is solved
   */
  async isPuzzleSolved(): Promise<boolean> {
    return await this.winOverlay.isVisible();
  }

  /**
   * Check if time is up
   */
  async isTimeUp(): Promise<boolean> {
    return await this.timeUpOverlay.isVisible();
  }

  /**
   * Check if placement error is shown
   */
  async hasPlacementError(): Promise<boolean> {
    return await this.placementError.isVisible();
  }

  /**
   * Get placement error message
   */
  async getPlacementError(): Promise<string> {
    return (await this.placementError.textContent()) || '';
  }

  /**
   * Get elapsed time from win overlay
   */
  async getElapsedTime(): Promise<number> {
    const stats = await this.winStats.textContent();
    const match = stats?.match(/(\d+)s/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Check if canvas is visible (3D mode)
   */
  async isCanvasVisible(): Promise<boolean> {
    return await this.canvas3D.isVisible();
  }

  /**
   * Check if grid board is visible (2D mode)
   */
  async isGridBoardVisible(): Promise<boolean> {
    return await this.gridBoard.isVisible();
  }

  /**
   * Get number of available pieces in inventory
   */
  async getAvailablePiecesCount(): Promise<number> {
    return await this.pieces.count();
  }

  /**
   * Check if rotation hint tooltip is visible
   */
  async isRotationHintVisible(): Promise<boolean> {
    return await this.rotationHintTooltip.isVisible();
  }

  /**
   * Press keyboard shortcut for rotation
   * @param key - 'r' (Z-axis), 't' (X-axis), or 'y' (Y-axis)
   */
  async pressRotationKey(key: 'r' | 't' | 'y') {
    await this.page.keyboard.press(key);
  }

  /**
   * Press Escape to deselect piece
   */
  async deselectPiece() {
    await this.page.keyboard.press('Escape');
  }

  /**
   * Press Ctrl+Z to undo
   */
  async undoWithKeyboard() {
    await this.page.keyboard.press('Control+z');
  }

  /**
   * Click next level button in win overlay
   */
  async clickNextLevelInOverlay() {
    await this.winOverlay.getByRole('button', { name: /next level/i }).click();
  }

  /**
   * Click random level button in win overlay
   */
  async clickRandomLevelInOverlay() {
    await this.randomLevelButton.click();
  }

  /**
   * Click try again button in time up overlay
   */
  async clickTryAgain() {
    await this.tryAgainButton.click();
  }

  /**
   * Click skip level button in time up overlay
   */
  async clickSkipLevel() {
    await this.skipLevelButton.click();
  }
}
