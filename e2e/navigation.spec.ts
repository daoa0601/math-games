import { test, expect } from '@playwright/test';
import { setupFreshTestState, DEFAULT_TEST_PLAYER } from './fixtures/test-utils';

/**
 * Navigation E2E Tests
 *
 * Tests the navigation between dashboard and games.
 */
test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Setup fresh test state before each test
    await setupFreshTestState(page, DEFAULT_TEST_PLAYER);
  });

  test('should load home page with game cards', async ({ page }) => {
    await page.goto('/');

    // Verify page loads
    await expect(page.locator('.page')).toBeVisible();

    // Verify game cards grid is visible
    await expect(page.locator('.grid')).toBeVisible();

    // Check for game card links - should have 3 games
    const gameCards = page.locator('.slab');
    await expect(gameCards).toHaveCount(3);

    // Verify each game is present by title text
    // Note: "Sequence Race" was renamed to "Sequence Sprinter"
    await expect(page.locator('.slab').filter({ hasText: /magic graph/i })).toBeVisible();
    await expect(page.locator('.slab').filter({ hasText: /sequence sprinter|sequence race/i })).toBeVisible();
    await expect(page.locator('.slab').filter({ hasText: /shape architect/i })).toBeVisible();
  });

  test('should navigate to MagicGraph and back', async ({ page }) => {
    await page.goto('/');

    // Click on MagicGraph game card
    await page.locator('[data-testid="game-card-magicGraph"]').click();

    // Wait for navigation and verify URL
    await expect(page).toHaveURL('/magic-graph');

    // Verify game loaded
    await expect(page.locator('[data-testid="magic-graph-game"]')).toBeVisible();

    // Go back to dashboard
    await page.goBack();
    await expect(page).toHaveURL('/');
    await expect(page.locator('.page')).toBeVisible();
  });

  test('should navigate to SequenceRace and back', async ({ page }) => {
    await page.goto('/');

    // Click on SequenceRace game card
    await page.locator('[data-testid="game-card-sequenceRace"]').click();

    // Wait for navigation and verify URL
    await expect(page).toHaveURL('/sequence-race');

    // Verify game loaded
    await expect(page.locator('[data-testid="sequence-race-game"]')).toBeVisible();

    // Go back to dashboard
    await page.goBack();
    await expect(page).toHaveURL('/');
    await expect(page.locator('.page')).toBeVisible();
  });

  test('should navigate to ShapeArchitect and back', async ({ page }) => {
    await page.goto('/');

    // Click on ShapeArchitect game card
    await page.locator('[data-testid="game-card-shapeArchitect"]').click();

    // Wait for navigation and verify URL
    await expect(page).toHaveURL('/shape-architect');

    // Verify game loaded (3D canvas may take longer)
    await expect(page.locator('[data-testid="shape-architect-game"]')).toBeVisible({ timeout: 10000 });

    // Go back to dashboard
    await page.goBack();
    await expect(page).toHaveURL('/');
    await expect(page.locator('.page')).toBeVisible();
  });

  test('should lazy load games without errors', async ({ page }) => {
    // Track console errors
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');

    // Navigate to each game to trigger lazy loading
    const games = [
      { testId: 'game-card-magicGraph', url: '/magic-graph', selector: '[data-testid="magic-graph-game"]' },
      { testId: 'game-card-sequenceRace', url: '/sequence-race', selector: '[data-testid="sequence-race-game"]' },
      { testId: 'game-card-shapeArchitect', url: '/shape-architect', selector: '[data-testid="shape-architect-game"]' },
    ];

    for (const game of games) {
      // Go to dashboard
      await page.goto('/');

      // Click game card
      await page.locator(`[data-testid="${game.testId}"]`).click();

      // Verify URL changed
      await expect(page).toHaveURL(game.url);

      // Wait for game to load
      await expect(page.locator(game.selector)).toBeVisible({ timeout: 10000 });
    }

    // Verify no critical errors occurred during lazy loading
    const criticalErrors = errors.filter(
      (err) => !err.includes('favicon') && !err.includes('sourcemap')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('should handle deep linking to game routes', async ({ page }) => {
    // Test direct navigation to game URLs (not from dashboard)

    // Direct link to MagicGraph
    await page.goto('/magic-graph');
    await expect(page.locator('[data-testid="magic-graph-game"]')).toBeVisible();
    await expect(page).toHaveURL('/magic-graph');

    // Direct link to SequenceRace
    await page.goto('/sequence-race');
    await expect(page.locator('[data-testid="sequence-race-game"]')).toBeVisible();
    await expect(page).toHaveURL('/sequence-race');

    // Direct link to ShapeArchitect
    await page.goto('/shape-architect');
    await expect(page.locator('[data-testid="shape-architect-game"]')).toBeVisible({ timeout: 10000 });
    await expect(page).toHaveURL('/shape-architect');
  });

  test('should preserve URL when refreshing game pages', async ({ page }) => {
    // Navigate to a game
    await page.goto('/magic-graph');
    await expect(page.locator('[data-testid="magic-graph-game"]')).toBeVisible();

    // Reload the page
    await page.reload();

    // Verify URL is preserved and game still loads
    await expect(page).toHaveURL('/magic-graph');
    await expect(page.locator('[data-testid="magic-graph-game"]')).toBeVisible();
  });

  test('should support browser back/forward navigation', async ({ page }) => {
    await page.goto('/');

    // Navigate through multiple pages
    await page.locator('[data-testid="game-card-magicGraph"]').click();
    await expect(page).toHaveURL('/magic-graph');

    await page.goto('/');
    await page.locator('[data-testid="game-card-sequenceRace"]').click();
    await expect(page).toHaveURL('/sequence-race');

    // Use browser back button
    await page.goBack();
    await expect(page).toHaveURL('/');

    await page.goBack();
    await expect(page).toHaveURL('/magic-graph');

    // Use browser forward button
    await page.goForward();
    await expect(page).toHaveURL('/');

    await page.goForward();
    await expect(page).toHaveURL('/sequence-race');
  });
});
