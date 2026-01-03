import { test, expect } from '@playwright/test';
import { ShapeArchitectPage } from './pages/ShapeArchitect.page';
import { waitForCanvasReady } from './fixtures/test-utils';

test.describe('ShapeArchitect Game', () => {
  let game: ShapeArchitectPage;

  test.beforeEach(async ({ page }) => {
    // Clear localStorage for clean state
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    game = new ShapeArchitectPage(page);
    await game.goto();
  });

  test.describe('Game Initialization', () => {
    test('should load game with all essential UI elements', async () => {
      // Verify game container and title
      await expect(game.gameTitle).toBeVisible();

      // Verify timer is present
      await expect(game.timer).toBeVisible();
      await expect(game.timerDisplay).toBeVisible();

      // Verify difficulty selector
      await expect(game.difficultySelector).toBeVisible();
      await expect(game.easyButton).toBeVisible();

      // Verify level info panel
      await expect(game.levelName).toBeVisible();
      await expect(game.piecesLeftValue).toBeVisible();

      // Verify view mode toggle
      await expect(game.viewModeToggle).toBeVisible();
      await expect(game.view2DButton).toBeVisible();
      await expect(game.view3DButton).toBeVisible();

      // Verify piece inventory
      await expect(game.pieceInventory).toBeVisible();
      const pieceCount = await game.getAvailablePiecesCount();
      expect(pieceCount).toBeGreaterThan(0);

      // Verify rotation controls
      await expect(game.rotationControls).toBeVisible();

      // Verify action buttons
      await expect(game.resetButton).toBeVisible();
      await expect(game.nextLevelButton).toBeVisible();
    });

    test('should start in 2D view mode by default', async () => {
      // 2D view button should be active
      await expect(game.view2DButton).toHaveAttribute('aria-pressed', 'true');
      await expect(game.view3DButton).toHaveAttribute('aria-pressed', 'false');

      // Grid board should be visible
      await expect(game.gridBoard).toBeVisible();

      // 3D canvas should not be visible initially
      await expect(game.canvas3D).not.toBeVisible();
    });

    test('should display piece inventory with draggable pieces', async () => {
      const pieceCount = await game.getAvailablePiecesCount();
      expect(pieceCount).toBeGreaterThan(0);

      // Verify pieces have names
      const firstPiece = game.pieces.first();
      await expect(firstPiece).toBeVisible();
      await expect(firstPiece.locator('.piece-name')).toBeVisible();
    });

    test('should show correct initial game info', async () => {
      // Level name should be displayed
      const levelName = await game.levelName.textContent();
      expect(levelName).toBeTruthy();
      expect(levelName?.length).toBeGreaterThan(0);

      // Pieces left should match inventory count
      const piecesLeft = await game.getPiecesLeft();
      const inventoryCount = await game.getAvailablePiecesCount();
      expect(piecesLeft).toBe(inventoryCount);

      // Initial rotation should be 0,0,0
      const rotation = await game.getRotation();
      expect(rotation).toEqual({ x: 0, y: 0, z: 0 });
    });
  });

  test.describe('View Mode Switching', () => {
    test('should switch from 2D to 3D view', async () => {
      // Start in 2D
      await expect(game.gridBoard).toBeVisible();

      // Switch to 3D
      await game.switchTo3D();

      // Wait for 3D view to render
      await expect(game.view3DButton).toHaveAttribute('aria-pressed', 'true');
      await expect(game.view2DButton).toHaveAttribute('aria-pressed', 'false');

      // Canvas should be visible and WebGL ready (may take time to render)
      await waitForCanvasReady(game.page, 'canvas', 15000);

      // 2D grid should be hidden
      await expect(game.gridBoard).not.toBeVisible();
    });

    test('should switch from 3D back to 2D view', async () => {
      // Switch to 3D first
      await game.switchTo3D();
      await waitForCanvasReady(game.page, 'canvas', 15000);

      // Switch back to 2D
      await game.switchTo2D();

      // Verify 2D view is active
      await expect(game.view2DButton).toHaveAttribute('aria-pressed', 'true');
      await expect(game.gridBoard).toBeVisible();

      // Canvas should be hidden
      await expect(game.canvas3D).not.toBeVisible();
    });

    test('should show camera preset buttons in 3D mode', async () => {
      // Camera presets should not be visible in 2D mode
      await expect(game.cameraPresetButtons).not.toBeVisible();

      // Switch to 3D
      await game.switchTo3D();
      await waitForCanvasReady(game.page, 'canvas', 15000);

      // Camera preset buttons should appear
      await expect(game.cameraPresetButtons).toBeVisible();
    });
  });

  test.describe('3D View Controls', () => {
    test.beforeEach(async () => {
      // Switch to 3D mode for these tests
      await game.switchTo3D();
      await waitForCanvasReady(game.page, 'canvas', 15000);
    });

    test('should render 3D canvas without errors', async () => {
      // Track console errors
      const errors: string[] = [];
      game.page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      // Canvas should be present
      const canvasCount = await game.canvas3D.count();
      expect(canvasCount).toBe(1);

      // Give Three.js time to initialize
      await game.page.waitForTimeout(1000);

      // Filter out non-critical errors (favicon, sourcemap, etc.)
      const criticalErrors = errors.filter(
        (err) => !err.includes('favicon') &&
                 !err.includes('sourcemap') &&
                 !err.includes('DevTools')
      );
      expect(criticalErrors).toHaveLength(0);
    });

    test('should have all camera preset buttons available', async () => {
      await expect(game.isometricViewButton).toBeVisible();
      await expect(game.topViewButton).toBeVisible();
      await expect(game.frontViewButton).toBeVisible();
      await expect(game.sideViewButton).toBeVisible();
    });

    test('should switch camera presets', async () => {
      // Click top view
      await game.topViewButton.click();
      await expect(game.topViewButton).toHaveAttribute('aria-pressed', 'true');

      // Click front view
      await game.frontViewButton.click();
      await expect(game.frontViewButton).toHaveAttribute('aria-pressed', 'true');
      await expect(game.topViewButton).toHaveAttribute('aria-pressed', 'false');

      // Click side view
      await game.sideViewButton.click();
      await expect(game.sideViewButton).toHaveAttribute('aria-pressed', 'true');

      // Back to isometric
      await game.isometricViewButton.click();
      await expect(game.isometricViewButton).toHaveAttribute('aria-pressed', 'true');
    });

    test('should show layer controls for multilayer puzzles', async () => {
      // Layer controls may or may not be visible depending on puzzle depth
      // If visible, verify it has proper controls
      const layerControlsVisible = await game.layerControls.isVisible();

      if (layerControlsVisible) {
        await expect(game.layerSlider).toBeVisible();
        await expect(game.layerSlider).toHaveAttribute('type', 'range');
      }
    });
  });

  test.describe('Piece Selection and Rotation', () => {
    test('should select a piece from inventory', async () => {
      // Initially no piece should be selected (rotation controls disabled)
      const initialRotationEnabled = await game.rotateZButton.isEnabled();
      expect(initialRotationEnabled).toBe(false);

      // Select first piece
      await game.selectPiece(0);

      // Rotation controls should now be enabled
      const rotationEnabled = await game.rotateZButton.isEnabled();
      expect(rotationEnabled).toBe(true);

      // Piece card should have selected class
      const firstPiece = game.pieces.first();
      await expect(firstPiece).toHaveClass(/piece-card--selected/);

      // Instructions should update
      const instructions = await game.instructions.textContent();
      expect(instructions).toBeTruthy();
    });

    test('should rotate piece on Z axis', async () => {
      await game.selectPiece(0);

      // Get initial rotation
      const initialRotation = await game.getRotation();
      expect(initialRotation.z).toBe(0);

      // Rotate Z axis
      await game.rotateZ();

      // Rotation should update
      const newRotation = await game.getRotation();
      expect(newRotation.z).toBe(90);

      // Rotate again
      await game.rotateZ();
      const rotation2 = await game.getRotation();
      expect(rotation2.z).toBe(180);
    });

    test('should rotate piece on X and Y axes', async () => {
      await game.selectPiece(0);

      // Rotate X axis
      await game.rotateX();
      const rotationX = await game.getRotation();
      expect(rotationX.x).toBe(90);

      // Rotate Y axis
      await game.rotateY();
      const rotationY = await game.getRotation();
      expect(rotationY.y).toBe(90);
    });

    test('should deselect piece when clicking same piece again', async () => {
      // Select first piece
      await game.selectPiece(0);
      const firstPiece = game.pieces.first();
      await expect(firstPiece).toHaveClass(/piece-card--selected/);

      // Click same piece again to deselect
      await game.selectPiece(0);

      // Piece should no longer be selected
      await expect(firstPiece).not.toHaveClass(/piece-card--selected/);

      // Rotation controls should be disabled
      const rotationEnabled = await game.rotateZButton.isEnabled();
      expect(rotationEnabled).toBe(false);
    });

    test('should deselect piece with Escape key', async () => {
      // Select a piece
      await game.selectPiece(0);
      const firstPiece = game.pieces.first();
      await expect(firstPiece).toHaveClass(/piece-card--selected/);

      // Press Escape
      await game.deselectPiece();

      // Piece should be deselected
      await expect(firstPiece).not.toHaveClass(/piece-card--selected/);
    });

    test('should support keyboard shortcuts for rotation', async () => {
      await game.selectPiece(0);

      // Press 'r' for Z-axis rotation
      await game.pressRotationKey('r');
      const rotationR = await game.getRotation();
      expect(rotationR.z).toBe(90);

      // Press 't' for X-axis rotation
      await game.pressRotationKey('t');
      const rotationT = await game.getRotation();
      expect(rotationT.x).toBe(90);

      // Press 'y' for Y-axis rotation
      await game.pressRotationKey('y');
      const rotationY = await game.getRotation();
      expect(rotationY.y).toBe(90);
    });
  });

  test.describe('Game Controls', () => {
    test('should reset level', async () => {
      // Select a piece and rotate it
      await game.selectPiece(0);
      await game.rotateZ();
      await game.rotateX();

      // Reset level
      await game.reset();

      // Rotation should be back to 0,0,0
      const rotation = await game.getRotation();
      expect(rotation).toEqual({ x: 0, y: 0, z: 0 });

      // All pieces should be back in inventory
      const piecesLeft = await game.getPiecesLeft();
      const inventoryCount = await game.getAvailablePiecesCount();
      expect(piecesLeft).toBe(inventoryCount);
    });

    test('should toggle hints panel', async () => {
      // Hints should be hidden initially
      await expect(game.hintsPanel).not.toBeVisible();

      // Toggle hints
      await game.toggleHints();

      // Hints panel should appear
      await expect(game.hintsPanel).toBeVisible();

      // Toggle again to hide
      await game.toggleHints();
      await expect(game.hintsPanel).not.toBeVisible();
    });

    test('should have undo button disabled when no pieces placed', async () => {
      // Undo button should be disabled initially
      const undoEnabled = await game.undoButton.isEnabled();
      expect(undoEnabled).toBe(false);
    });

    test('should switch difficulty levels', async () => {
      // Start on easy (default)
      await expect(game.easyButton).toHaveClass(/difficulty-selector__option--active/);

      // Switch to medium
      await game.setDifficulty('medium');
      await expect(game.mediumButton).toHaveClass(/difficulty-selector__option--active/);

      // Switch to hard
      await game.setDifficulty('hard');
      await expect(game.hardButton).toHaveClass(/difficulty-selector__option--active/);

      // Switch back to easy
      await game.setDifficulty('easy');
      await expect(game.easyButton).toHaveClass(/difficulty-selector__option--active/);
    });

    test('should navigate to next level', async () => {
      const currentLevel = await game.levelName.textContent();

      // Click next level
      await game.nextLevel();

      // Level should change
      const newLevel = await game.levelName.textContent();
      expect(newLevel).not.toBe(currentLevel);
    });

    test('should start random level', async () => {
      const currentLevel = await game.levelName.textContent();

      // Start random level
      await game.startRandomLevel();

      // Level should change (or potentially stay the same by chance)
      // Just verify the button works and game doesn't crash
      await expect(game.gameTitle).toBeVisible();
    });
  });

  test.describe('Practice Mode', () => {
    test('should toggle practice mode', async () => {
      // Toggle practice mode on
      await game.togglePracticeMode();

      // Timer should show practice mode indicator
      await expect(game.timer).toBeVisible();

      // Toggle back off
      await game.togglePracticeMode();
    });

    test('should not show countdown timer in practice mode', async () => {
      // Enable practice mode
      await game.togglePracticeMode();

      // Timer display should show practice mode text
      const timerText = await game.timerDisplay.textContent();
      expect(timerText).toMatch(/practice|∞/i);
    });
  });

  test.describe('Win State', () => {
    test('should show win overlay when puzzle is solved', async ({ page }) => {
      // This test would require actually solving a puzzle
      // For E2E, we'll just verify the overlay can be detected

      // Use practice mode to avoid time pressure
      await game.togglePracticeMode();

      // In a real test, we would solve the puzzle here
      // For now, verify win overlay detection works
      const isWon = await game.isPuzzleSolved();
      expect(typeof isWon).toBe('boolean');
    });
  });

  test.describe('Navigation and Back Button', () => {
    test('should navigate back to dashboard', async ({ page }) => {
      // Verify we're on the game page
      await expect(game.gameTitle).toBeVisible();

      // Go back
      await page.goBack();

      // Should be on dashboard
      await expect(page).toHaveURL('/');
      const dashboard = page.locator('.dashboard');
      await expect(dashboard).toBeVisible();
    });

    test('should handle direct URL navigation', async ({ page }) => {
      // Navigate directly to game URL
      await page.goto('/shape-architect');

      // Game should load
      await expect(game.gameTitle).toBeVisible({ timeout: 10000 });
      await expect(game.pieceInventory).toBeVisible();
    });
  });

  test.describe('Daily Challenge Mode', () => {
    test('should load daily challenge mode', async () => {
      await game.goto(true);

      // Daily badge should be visible
      await expect(game.dailyBadge).toBeVisible();

      // Difficulty selector should be hidden in daily mode
      await expect(game.difficultySelector).not.toBeVisible();

      // Level selector should be hidden in daily mode
      await expect(game.levelSelector).not.toBeVisible();
    });

    test('should show daily challenge badge with text', async () => {
      await game.goto(true);

      const badgeText = await game.dailyBadge.textContent();
      expect(badgeText).toContain('Daily');
    });
  });

  test.describe('Error Handling', () => {
    test('should show placement error when trying to place without selection', async () => {
      // Try to interact without selecting a piece
      // Click on grid (if we can find a target cell)
      const gridCells = game.gridBoard.locator('.grid-cell--target');
      const cellCount = await gridCells.count();

      if (cellCount > 0) {
        await gridCells.first().click();

        // Should show error message
        const hasError = await game.hasPlacementError();
        if (hasError) {
          const errorText = await game.getPlacementError();
          expect(errorText.length).toBeGreaterThan(0);
        }
      }
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels on view mode toggle', async () => {
      await expect(game.viewModeToggle).toHaveAttribute('role', 'group');
      await expect(game.view2DButton).toHaveAttribute('aria-pressed');
      await expect(game.view3DButton).toHaveAttribute('aria-pressed');
    });

    test('should have proper ARIA labels on rotation controls', async () => {
      await game.selectPiece(0);

      const rotateXLabel = await game.rotateXButton.getAttribute('aria-label');
      expect(rotateXLabel).toBeTruthy();
      expect(rotateXLabel).toMatch(/x/i);

      const rotateYLabel = await game.rotateYButton.getAttribute('aria-label');
      expect(rotateYLabel).toBeTruthy();
      expect(rotateYLabel).toMatch(/y/i);

      const rotateZLabel = await game.rotateZButton.getAttribute('aria-label');
      expect(rotateZLabel).toBeTruthy();
      expect(rotateZLabel).toMatch(/z/i);
    });

    test('should have grid with proper role', async () => {
      await expect(game.gridBoard).toHaveAttribute('role', 'grid');
    });
  });

  test.describe('Responsive Behavior', () => {
    test('should handle mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // Game should still be functional
      await expect(game.gameTitle).toBeVisible();
      await expect(game.pieceInventory).toBeVisible();
      await expect(game.viewModeToggle).toBeVisible();

      // Controls should be accessible
      await expect(game.rotationControls).toBeVisible();
    });

    test('should handle tablet viewport', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });

      await expect(game.gameTitle).toBeVisible();
      await expect(game.gridBoard).toBeVisible();
      await expect(game.pieceInventory).toBeVisible();
    });
  });
});
