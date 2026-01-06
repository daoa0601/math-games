import { test, expect } from '@playwright/test';
import { DashboardPage } from './pages/Dashboard.page';
import { setupFreshTestState, DEFAULT_TEST_PLAYER, updatePlayerProfile, getTodayDate } from './fixtures/test-utils';

/**
 * Dashboard E2E Tests
 *
 * Tests the main dashboard page including:
 * - Game cards grid
 * - Navigation to games
 * - Bottom navigation
 * - Compact header with player info
 * - Daily challenge banner
 */
test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Setup fresh test state before each test
    await setupFreshTestState(page, DEFAULT_TEST_PLAYER);
  });

  test.describe('Page Load', () => {
    test('should load dashboard with main elements', async ({ page }) => {
      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.waitForLoad();

      // Verify page container is visible
      await expect(page.locator('.page')).toBeVisible();

      // Verify header is visible
      await expect(dashboard.header).toBeVisible();

      // Verify navigation is visible
      await expect(dashboard.nav).toBeVisible();

      // Verify game cards grid is visible
      await expect(dashboard.gamesGrid).toBeVisible();
    });
  });

  test.describe('Game Cards', () => {
    test('should display all three game cards', async ({ page }) => {
      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.waitForLoad();

      // Verify all game cards are visible
      await expect(dashboard.magicGraphCard).toBeVisible();
      await expect(dashboard.sequenceRaceCard).toBeVisible();
      await expect(dashboard.shapeArchitectCard).toBeVisible();

      // Verify game count
      await expect(dashboard.gameCards).toHaveCount(3);
    });

    test('should show game titles', async ({ page }) => {
      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.waitForLoad();

      // Check that each game card has a title
      const cardTitles = await dashboard.getAllGameCards();
      expect(cardTitles.length).toBe(3);

      // Verify titles contain expected games
      const titles = cardTitles.join(' ').toLowerCase();
      expect(titles).toContain('magic');
      expect(titles).toContain('sequence');
      expect(titles).toContain('shape');
    });

    test('should navigate to MagicGraph when clicking its card', async ({ page }) => {
      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.waitForLoad();

      // Click MagicGraph game card
      await dashboard.playGame('magic-graph');

      // Verify navigation occurred
      await expect(page).toHaveURL(/\/magic-graph$/);

      // Game page should have game container visible
      await expect(page.locator('[data-testid="magic-graph-game"]')).toBeVisible();
    });

    test('should navigate to SequenceRace when clicking its card', async ({ page }) => {
      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.waitForLoad();

      // Click SequenceRace game card
      await dashboard.playGame('sequence-race');

      // Verify navigation occurred
      await expect(page).toHaveURL(/\/sequence-race$/);

      // Game page should have game container visible
      await expect(page.locator('[data-testid="sequence-race-game"]')).toBeVisible();
    });

    test('should navigate to ShapeArchitect when clicking its card', async ({ page }) => {
      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.waitForLoad();

      // Click ShapeArchitect game card
      await dashboard.playGame('shape-architect');

      // Verify navigation occurred
      await expect(page).toHaveURL(/\/shape-architect$/);

      // Game page should have game container visible
      await expect(page.locator('[data-testid="shape-architect-game"]')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Header', () => {
    test('should display compact header with player info', async ({ page }) => {
      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.waitForLoad();

      // Verify header elements are visible
      await expect(dashboard.header).toBeVisible();

      // Get player info
      const playerInfo = await dashboard.getPlayerInfo();

      // Verify player name is present
      expect(playerInfo.name).toBe('Test Player');
    });

    test('should show streak when present', async ({ page }) => {
      // Update player profile with a streak AND lastPlayedDate
      await updatePlayerProfile(page, {
        streak: 3,
        lastPlayedDate: getTodayDate(),
      });

      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.waitForLoad();

      // Verify streak is displayed
      await expect(dashboard.streakIndicator).toBeVisible();

      const playerInfo = await dashboard.getPlayerInfo();
      expect(playerInfo.streak).toBe(3);
    });
  });

  test.describe('Bottom Navigation', () => {
    test('should display navigation tabs', async ({ page }) => {
      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.waitForLoad();

      // Verify navigation is visible
      await expect(dashboard.nav).toBeVisible();

      // Verify home tab is visible
      await expect(dashboard.homeTab).toBeVisible();
    });

    test('should highlight active tab', async ({ page }) => {
      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.waitForLoad();

      // Home tab should be active by default
      const activeTab = await dashboard.getActiveTab();
      expect(activeTab?.toLowerCase()).toContain('home');
    });

    test('should switch tabs when clicked', async ({ page }) => {
      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.waitForLoad();

      // Switch to learn tab
      await dashboard.switchTab('learn');

      // Verify panel content changed
      await expect(page.locator('#panel-learn')).toBeVisible();
    });
  });

  test.describe('Daily Challenge', () => {
    test('should display daily challenge banner on home tab', async ({ page }) => {
      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.waitForLoad();

      // Verify daily challenge banner is visible
      const isVisible = await dashboard.isDailyChallengeBannerVisible();
      expect(isVisible).toBe(true);
    });

    test('should show countdown timer', async ({ page }) => {
      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.waitForLoad();

      // Find countdown element
      const countdown = page.locator('[data-testid="daily-challenge-banner"]').getByText(/\d{2}:\d{2}:\d{2}/);
      await expect(countdown).toBeVisible();

      // Verify countdown format (HH:MM:SS)
      const countdownText = await countdown.textContent();
      expect(countdownText).toMatch(/\d{2}:\d{2}:\d{2}/);
    });
  });

  test.describe('Responsive Layout', () => {
    test('should display properly on desktop', async ({ page }) => {
      // Set desktop viewport
      await page.setViewportSize({ width: 1280, height: 720 });

      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.waitForLoad();

      // Verify layout is visible
      await expect(page.locator('.page')).toBeVisible();
      await expect(dashboard.gamesGrid).toBeVisible();

      // Game cards should be visible
      await expect(dashboard.gameCards).toHaveCount(3);
    });

    test('should display properly on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.waitForLoad();

      // Verify layout is visible
      await expect(page.locator('.page')).toBeVisible();

      // Game cards should stack vertically
      await expect(dashboard.gameCards).toHaveCount(3);
      await expect(dashboard.gameCards.first()).toBeVisible();
    });

    test('should maintain navigation functionality on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.waitForLoad();

      // Test game card navigation on mobile
      await dashboard.playGame('magic-graph');
      await expect(page).toHaveURL(/\/magic-graph$/);
    });
  });

  test.describe('Persistence', () => {
    test('should persist player profile across reloads', async ({ page }) => {
      // Set player data with streak AND lastPlayedDate
      await updatePlayerProfile(page, {
        displayName: 'Persistent Player',
        streak: 5,
        lastPlayedDate: getTodayDate(),
      });

      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.waitForLoad();

      // Verify player name persisted
      const playerInfo = await dashboard.getPlayerInfo();
      expect(playerInfo.name).toBe('Persistent Player');
      expect(playerInfo.streak).toBe(5);

      // Reload page
      await page.reload();
      await dashboard.waitForLoad();

      // Verify data persisted after reload
      const playerInfoAfterReload = await dashboard.getPlayerInfo();
      expect(playerInfoAfterReload.name).toBe('Persistent Player');
      expect(playerInfoAfterReload.streak).toBe(5);
    });
  });
});
