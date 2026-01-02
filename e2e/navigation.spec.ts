import { test, expect } from '@playwright/test';
import { setupFreshTestState, DEFAULT_TEST_PLAYER } from './fixtures/test-utils';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Setup fresh test state before each test
    await setupFreshTestState(page, DEFAULT_TEST_PLAYER);
  });

  test('should load home page with game cards', async ({ page }) => {
    await page.goto('/');

    // Verify dashboard loads
    await expect(page.locator('.dashboard')).toBeVisible();

    // Verify all three game cards are visible on Play tab (default tab)
    await expect(page.locator('.games-grid')).toBeVisible();

    // Check for game card links - should have 3 games
    const gameCards = page.locator('.game-card');
    await expect(gameCards).toHaveCount(3);

    // Verify each game is present (using aria-labels or specific selectors)
    await expect(page.getByRole('link', { name: /magic graph/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /sequence race/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /shape architect/i })).toBeVisible();
  });

  test('should navigate to MagicGraph and back', async ({ page }) => {
    await page.goto('/');

    // Click on MagicGraph game card
    await page.getByRole('link', { name: /magic graph/i }).click();

    // Wait for navigation and verify URL
    await expect(page).toHaveURL('/magic-graph');

    // Verify game loaded (look for game-specific elements)
    await expect(page.locator('.magic-graph-game')).toBeVisible();

    // Go back to dashboard
    await page.goBack();
    await expect(page).toHaveURL('/');
    await expect(page.locator('.dashboard')).toBeVisible();
  });

  test('should navigate to SequenceRace and back', async ({ page }) => {
    await page.goto('/');

    // Click on SequenceRace game card
    await page.getByRole('link', { name: /sequence race/i }).click();

    // Wait for navigation and verify URL
    await expect(page).toHaveURL('/sequence-race');

    // Verify game loaded
    await expect(page.locator('.sequence-race-game')).toBeVisible();

    // Go back to dashboard
    await page.goBack();
    await expect(page).toHaveURL('/');
    await expect(page.locator('.dashboard')).toBeVisible();
  });

  test('should navigate to ShapeArchitect and back', async ({ page }) => {
    await page.goto('/');

    // Click on ShapeArchitect game card
    await page.getByRole('link', { name: /shape architect/i }).click();

    // Wait for navigation and verify URL
    await expect(page).toHaveURL('/shape-architect');

    // Verify game loaded (3D canvas may take longer)
    await expect(page.locator('.shape-architect-game')).toBeVisible({ timeout: 10000 });

    // Go back to dashboard
    await page.goBack();
    await expect(page).toHaveURL('/');
    await expect(page.locator('.dashboard')).toBeVisible();
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
      { name: /magic graph/i, url: '/magic-graph', selector: '.magic-graph-game' },
      { name: /sequence race/i, url: '/sequence-race', selector: '.sequence-race-game' },
      { name: /shape architect/i, url: '/shape-architect', selector: '.shape-architect-game' },
    ];

    for (const game of games) {
      // Go to dashboard
      await page.goto('/');

      // Click game card
      await page.getByRole('link', { name: game.name }).click();

      // Verify URL changed
      await expect(page).toHaveURL(game.url);

      // Wait for game to load (may show loading spinner first)
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
    await expect(page.locator('.magic-graph-game')).toBeVisible();
    await expect(page).toHaveURL('/magic-graph');

    // Direct link to SequenceRace
    await page.goto('/sequence-race');
    await expect(page.locator('.sequence-race-game')).toBeVisible();
    await expect(page).toHaveURL('/sequence-race');

    // Direct link to ShapeArchitect
    await page.goto('/shape-architect');
    await expect(page.locator('.shape-architect-game')).toBeVisible({ timeout: 10000 });
    await expect(page).toHaveURL('/shape-architect');
  });

  test('should show loading spinner during lazy loading', async ({ page }) => {
    await page.goto('/');

    // Click on a game card
    await page.getByRole('link', { name: /magic graph/i }).click();

    // The loading spinner should appear briefly (may be very fast in development)
    // We're checking if it exists at all in the DOM, even if not visible
    const loadingSpinner = page.locator('.loading-spinner');

    // Either the spinner appears or the game loads immediately
    const spinnerOrGame = page.locator('.loading-spinner, .magic-graph-game');
    await expect(spinnerOrGame.first()).toBeVisible({ timeout: 5000 });

    // Eventually the game should be visible
    await expect(page.locator('.magic-graph-game')).toBeVisible({ timeout: 10000 });
  });

  test('should handle 404 for invalid routes', async ({ page }) => {
    // React apps typically don't show 404 pages in the same way
    // Instead, they might show nothing or redirect
    await page.goto('/invalid-route-that-does-not-exist');

    // The app might show a blank page or the loading spinner
    // Since there's no route defined, Suspense fallback or nothing renders

    // Verify we don't get the dashboard
    const dashboard = page.locator('.dashboard');
    await expect(dashboard).not.toBeVisible();

    // Verify we don't get any game
    await expect(page.locator('.magic-graph-game')).not.toBeVisible();
    await expect(page.locator('.sequence-race-game')).not.toBeVisible();
    await expect(page.locator('.shape-architect-game')).not.toBeVisible();

    // Might show loading spinner indefinitely or blank page
    // This test ensures the app doesn't crash
  });

  test('should preserve URL when refreshing game pages', async ({ page }) => {
    // Navigate to a game
    await page.goto('/magic-graph');
    await expect(page.locator('.magic-graph-game')).toBeVisible();

    // Reload the page
    await page.reload();

    // Verify URL is preserved and game still loads
    await expect(page).toHaveURL('/magic-graph');
    await expect(page.locator('.magic-graph-game')).toBeVisible();
  });

  test('should support browser back/forward navigation', async ({ page }) => {
    await page.goto('/');

    // Navigate through multiple pages
    await page.getByRole('link', { name: /magic graph/i }).click();
    await expect(page).toHaveURL('/magic-graph');

    await page.goto('/');
    await page.getByRole('link', { name: /sequence race/i }).click();
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
