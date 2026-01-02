/**
 * Example usage of game page objects
 *
 * This file demonstrates how to use the page objects for testing.
 * These are NOT actual tests - just usage examples.
 */

import { test, expect } from '@playwright/test';
import { SequenceRacePage, ShapeArchitectPage } from '../pages';

// ============================================================================
// SequenceRace Examples
// ============================================================================

test.describe('SequenceRace Page Object Examples', () => {
  test('example: play a game and make moves', async ({ page }) => {
    const sequenceRace = new SequenceRacePage(page);

    // Navigate to the game
    await sequenceRace.goto();

    // Check initial state
    const target = await sequenceRace.getTargetNumber();
    const position = await sequenceRace.getCurrentPosition();
    expect(position).toBe(0);

    // Set difficulty
    await sequenceRace.setDifficulty('easy');

    // Make a move
    await sequenceRace.selectStep(1);

    // Wait for AI to respond (in vs AI mode)
    await sequenceRace.waitForAIMove();

    // Check game state
    const moveCount = await sequenceRace.getMoveCount();
    expect(moveCount).toBeGreaterThan(0);
  });

  test('example: switch to two-player mode', async ({ page }) => {
    const sequenceRace = new SequenceRacePage(page);
    await sequenceRace.goto();

    // Switch game mode
    await sequenceRace.switchToTwoPlayer();

    // Make moves for both players
    await sequenceRace.selectStep(2);
    // Player 2's turn
    await sequenceRace.selectStep(1);
  });

  test('example: toggle hints and check game features', async ({ page }) => {
    const sequenceRace = new SequenceRacePage(page);
    await sequenceRace.goto();

    // Toggle hints
    await sequenceRace.toggleHints();
    await expect(sequenceRace.hintsPanel).toBeVisible();

    // Toggle practice mode
    await sequenceRace.togglePracticeMode();

    // Restart game
    await sequenceRace.restart();
  });

  test('example: play daily challenge', async ({ page }) => {
    const sequenceRace = new SequenceRacePage(page);

    // Navigate to daily challenge
    await sequenceRace.goto(true);

    // Check daily badge is visible
    await expect(sequenceRace.dailyBadge).toBeVisible();
  });
});

// ============================================================================
// ShapeArchitect Examples
// ============================================================================

test.describe('ShapeArchitect Page Object Examples', () => {
  test('example: place pieces and solve puzzle', async ({ page }) => {
    const shapeArchitect = new ShapeArchitectPage(page);

    // Navigate to the game
    await shapeArchitect.goto();

    // Check initial state
    const piecesLeft = await shapeArchitect.getPiecesLeft();
    expect(piecesLeft).toBeGreaterThan(0);

    // Select a piece
    await shapeArchitect.selectPiece(0);

    // Rotate the piece
    await shapeArchitect.rotateZ();
    await shapeArchitect.rotateX();

    // Check rotation
    const rotation = await shapeArchitect.getRotation();
    expect(rotation.z).toBe(90);
    expect(rotation.x).toBe(90);

    // Try to place piece (coordinates depend on the level)
    await shapeArchitect.clickCell(0, 0, 0);

    // Undo if placement was wrong
    await shapeArchitect.undo();
  });

  test('example: switch between 2D and 3D views', async ({ page }) => {
    const shapeArchitect = new ShapeArchitectPage(page);
    await shapeArchitect.goto();

    // Check 2D view is default
    expect(await shapeArchitect.isGridBoardVisible()).toBe(true);

    // Switch to 3D
    await shapeArchitect.switchTo3D();
    expect(await shapeArchitect.isCanvasVisible()).toBe(true);

    // Change camera preset
    await shapeArchitect.setCameraPreset('top');

    // Adjust layer visibility
    await shapeArchitect.setMaxVisibleLayer(1);

    // Switch back to 2D
    await shapeArchitect.switchTo2D();
    expect(await shapeArchitect.isGridBoardVisible()).toBe(true);
  });

  test('example: keyboard shortcuts', async ({ page }) => {
    const shapeArchitect = new ShapeArchitectPage(page);
    await shapeArchitect.goto();

    // Select a piece
    await shapeArchitect.selectPiece(0);

    // Use keyboard shortcuts for rotation
    await shapeArchitect.pressRotationKey('r'); // Z-axis
    await shapeArchitect.pressRotationKey('t'); // X-axis
    await shapeArchitect.pressRotationKey('y'); // Y-axis

    // Deselect piece
    await shapeArchitect.deselectPiece();

    // Place a piece then undo with keyboard
    await shapeArchitect.selectPiece(0);
    await shapeArchitect.clickCell(0, 0, 0);
    await shapeArchitect.undoWithKeyboard();
  });

  test('example: difficulty levels and level navigation', async ({ page }) => {
    const shapeArchitect = new ShapeArchitectPage(page);
    await shapeArchitect.goto();

    // Set difficulty
    await shapeArchitect.setDifficulty('medium');

    // Navigate levels
    await shapeArchitect.nextLevel();

    // Select specific level
    await shapeArchitect.selectLevel('Cube 3x3');

    // Try random level
    await shapeArchitect.startRandomLevel();

    // Reset current level
    await shapeArchitect.reset();
  });

  test('example: practice mode and hints', async ({ page }) => {
    const shapeArchitect = new ShapeArchitectPage(page);
    await shapeArchitect.goto();

    // Toggle practice mode
    await shapeArchitect.togglePracticeMode();

    // Show hints
    await shapeArchitect.toggleHints();
    await expect(shapeArchitect.hintsPanel).toBeVisible();

    // Check for placement errors
    await shapeArchitect.selectPiece(0);
    await shapeArchitect.clickCell(10, 10, 10); // Invalid position

    if (await shapeArchitect.hasPlacementError()) {
      const errorMessage = await shapeArchitect.getPlacementError();
      expect(errorMessage).toContain('cannot');
    }
  });

  test('example: daily challenge', async ({ page }) => {
    const shapeArchitect = new ShapeArchitectPage(page);

    // Navigate to daily challenge
    await shapeArchitect.goto(true);

    // Check daily badge is visible
    await expect(shapeArchitect.dailyBadge).toBeVisible();

    // Get score
    const score = await shapeArchitect.getScore();
    expect(score).toBeGreaterThanOrEqual(0);
  });

  test('example: win scenario', async ({ page }) => {
    const shapeArchitect = new ShapeArchitectPage(page);
    await shapeArchitect.goto();

    // ... place pieces to solve puzzle ...
    // (actual solving logic would go here)

    // Check if won
    if (await shapeArchitect.isPuzzleSolved()) {
      // Get completion time
      const time = await shapeArchitect.getElapsedTime();
      expect(time).toBeGreaterThan(0);

      // Continue to next level
      await shapeArchitect.clickNextLevelInOverlay();
    }
  });
});
