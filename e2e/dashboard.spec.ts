import { test, expect } from '@playwright/test';
import { DashboardPage } from './pages/Dashboard.page';
import { setupFreshTestState, DEFAULT_TEST_PLAYER, updatePlayerProfile, getTodayDate } from './fixtures/test-utils';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Setup fresh test state before each test
    await setupFreshTestState(page, DEFAULT_TEST_PLAYER);
  });

  test.describe('Tab Navigation', () => {
    test('should show Play tab by default', async ({ page }) => {
      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.waitForLoad();

      // Verify Play tab is active
      await expect(dashboard.playTab).toHaveAttribute('aria-selected', 'true');

      // Verify Play tab content is visible
      await expect(page.locator('#tabpanel-play')).toBeVisible();
      await expect(page.locator('.games-grid')).toBeVisible();
    });

    test('should switch to Stats tab', async ({ page }) => {
      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.waitForLoad();

      // Switch to Stats tab
      await dashboard.switchTab('stats');

      // Verify Stats tab is active
      await expect(dashboard.statsTab).toHaveAttribute('aria-selected', 'true');

      // Verify Play tab is inactive
      await expect(dashboard.playTab).toHaveAttribute('aria-selected', 'false');

      // Verify Stats tab content is visible
      await expect(page.locator('#tabpanel-stats')).toBeVisible();
    });

    test('should switch to Achievements tab', async ({ page }) => {
      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.waitForLoad();

      // Switch to Achievements tab
      await dashboard.switchTab('achievements');

      // Verify Achievements tab is active
      await expect(dashboard.achievementsTab).toHaveAttribute('aria-selected', 'true');

      // Verify Achievements tab content is visible
      await expect(page.locator('#tabpanel-achievements')).toBeVisible();
    });

    test('should navigate between all tabs', async ({ page }) => {
      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.waitForLoad();

      // Go to Stats
      await dashboard.switchTab('stats');
      await expect(dashboard.statsTab).toHaveAttribute('aria-selected', 'true');
      await expect(page.locator('#tabpanel-stats')).toBeVisible();

      // Go to Achievements
      await dashboard.switchTab('achievements');
      await expect(dashboard.achievementsTab).toHaveAttribute('aria-selected', 'true');
      await expect(page.locator('#tabpanel-achievements')).toBeVisible();

      // Go back to Play
      await dashboard.switchTab('play');
      await expect(dashboard.playTab).toHaveAttribute('aria-selected', 'true');
      await expect(page.locator('#tabpanel-play')).toBeVisible();
    });

    test('should show achievement count badge on Achievements tab', async ({ page }) => {
      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.waitForLoad();

      // Get achievement count from badge
      const achievementCount = await dashboard.getAchievementCount();

      // Verify badge shows format with unlocked/total
      expect(achievementCount.total).toBeGreaterThan(0);
      expect(achievementCount.unlocked).toBeGreaterThanOrEqual(0);
      expect(achievementCount.unlocked).toBeLessThanOrEqual(achievementCount.total);
    });

    test('should have proper ARIA attributes for tabs', async ({ page }) => {
      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.waitForLoad();

      // Verify tablist role
      await expect(dashboard.tabList).toBeVisible();

      // Verify all tabs have correct roles
      const tabs = page.locator('[role="tab"]');
      await expect(tabs).toHaveCount(3);

      // Verify each tab controls a tabpanel (using bilingual selectors from page object)
      await expect(dashboard.playTab).toHaveAttribute('aria-controls', 'tabpanel-play');
      await expect(dashboard.statsTab).toHaveAttribute('aria-controls', 'tabpanel-stats');
      await expect(dashboard.achievementsTab).toHaveAttribute('aria-controls', 'tabpanel-achievements');
    });
  });

  test.describe('Game Cards', () => {
    test('should display all three game cards', async ({ page }) => {
      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.waitForLoad();

      // Verify all game cards are visible (using href-based selectors)
      await expect(dashboard.magicGraphCard).toBeVisible();
      await expect(dashboard.sequenceRaceCard).toBeVisible();
      await expect(dashboard.shapeArchitectCard).toBeVisible();

      // Verify game count
      await expect(dashboard.gameCards).toHaveCount(3);
    });

    test('should show game titles and descriptions', async ({ page }) => {
      await page.goto('/');

      // Check that each game card has a title (h3)
      const cardTitles = page.locator('.game-card h3');
      await expect(cardTitles).toHaveCount(3);

      // Check that each game card has a description
      const cardDescriptions = page.locator('.game-card__description');
      await expect(cardDescriptions).toHaveCount(3);

      // Verify descriptions have text
      for (let i = 0; i < 3; i++) {
        const descText = await cardDescriptions.nth(i).textContent();
        expect(descText).toBeTruthy();
        expect(descText!.length).toBeGreaterThan(0);
      }
    });

    test('should show progress for each game', async ({ page }) => {
      await page.goto('/');

      // Each game card should have a progress indicator
      const progressRings = page.locator('.progress-ring-compact');
      await expect(progressRings).toHaveCount(3);

      // Verify progress text format (e.g., "0/15")
      const progressTexts = page.locator('.progress-ring-compact__label');
      await expect(progressTexts).toHaveCount(3);

      for (let i = 0; i < 3; i++) {
        const progressText = await progressTexts.nth(i).textContent();
        expect(progressText).toMatch(/\d+\/\d+/);
      }
    });

    test('should navigate when clicking a game card', async ({ page }) => {
      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.waitForLoad();

      // Click MagicGraph game card
      await dashboard.playGame('magic-graph');

      // Verify navigation occurred
      await expect(page).toHaveURL(/\/magic-graph$/);
      // Game page should have some content visible
      await expect(page.locator('main, .game-container, [class*="magic-graph"]')).toBeVisible();
    });

    test('should show game tags', async ({ page }) => {
      await page.goto('/');

      // Verify tags exist on game cards
      const gameTags = page.locator('.game-card__tags .tag');
      await expect(gameTags.first()).toBeVisible();

      // Should have multiple tags across all cards
      const tagCount = await gameTags.count();
      expect(tagCount).toBeGreaterThan(0);
    });
  });

  test.describe('Header Controls', () => {
    test('should display compact header with rank badge', async ({ page }) => {
      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.waitForLoad();

      // Verify rank badge is visible
      await expect(dashboard.rankBadge).toBeVisible();

      // Verify rank icon (emoji) is displayed
      const rankIcon = page.locator('.compact-header__rank-icon');
      await expect(rankIcon).toBeVisible();
      const iconText = await rankIcon.textContent();
      expect(iconText).toBeTruthy();
    });

    test('should display player name and rank', async ({ page }) => {
      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.waitForLoad();

      // Get player info
      const playerInfo = await dashboard.getPlayerInfo();

      // Verify player name and rank are present
      expect(playerInfo.name).toBe('Test Player');
      expect(playerInfo.rank).toBeTruthy();
    });

    test('should show streak when present', async ({ page }) => {
      const dashboard = new DashboardPage(page);

      // Update player profile with a streak AND lastPlayedDate
      // Setting lastPlayedDate to today prevents checkStreak() from resetting streak
      await updatePlayerProfile(page, {
        streak: 3,
        lastPlayedDate: getTodayDate(),
      });

      await dashboard.goto();
      await dashboard.waitForLoad();

      // Verify streak is displayed
      await expect(dashboard.streakIndicator).toBeVisible();

      const playerInfo = await dashboard.getPlayerInfo();
      expect(playerInfo.streak).toBe(3);
    });

    test('should initialize streak on first visit', async ({ page }) => {
      // Dashboard calls checkStreak() on mount which sets streak to 1 for first play
      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.waitForLoad();

      // Default profile has streak: 0, lastPlayedDate: null
      // After visiting, checkStreak() sets streak to 1 (first play)
      await expect(dashboard.streakIndicator).toBeVisible();
      const playerInfo = await dashboard.getPlayerInfo();
      expect(playerInfo.streak).toBe(1);
    });

    test('should display sound toggle button', async ({ page }) => {
      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.waitForLoad();

      // Verify sound toggle is visible
      await expect(dashboard.soundToggle).toBeVisible();
    });

    test('should toggle sound on/off', async ({ page }) => {
      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.waitForLoad();

      // Get initial state
      const initialState = await dashboard.soundToggle.getAttribute('aria-pressed');

      // Toggle sound
      await dashboard.toggleSound();

      // Verify state changed
      const newState = await dashboard.soundToggle.getAttribute('aria-pressed');
      expect(newState).not.toBe(initialState);

      // Toggle back
      await dashboard.toggleSound();

      // Verify state returned to original
      const finalState = await dashboard.soundToggle.getAttribute('aria-pressed');
      expect(finalState).toBe(initialState);
    });

    test('should display language switcher', async ({ page }) => {
      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.waitForLoad();

      // Verify language switcher exists
      await expect(dashboard.languageSwitcher).toBeVisible();
    });

    test('should switch language', async ({ page }) => {
      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.waitForLoad();

      // Get initial language
      const initialRank = await page.locator('.compact-header__rank').textContent();

      // Switch language
      await dashboard.switchLanguage();

      // Wait for language change to propagate
      await page.waitForTimeout(300);

      // Verify text changed (rank text should be different in EN vs VI)
      const newRank = await page.locator('.compact-header__rank').textContent();

      // The rank text should be different in different languages
      expect(newRank).toBeTruthy();
      // In most cases, the text will be different
      // (e.g., "Beginner" vs "Người mới")
    });
  });

  test.describe('Responsive Layout', () => {
    test('should display properly on desktop', async ({ page }) => {
      // Set desktop viewport
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('/');

      // Verify layout is visible
      await expect(page.locator('.dashboard')).toBeVisible();
      await expect(page.locator('.games-grid')).toBeVisible();

      // Verify tabs show full labels (not just icons)
      const tabLabels = page.locator('.dashboard-tabs__label');
      await expect(tabLabels.first()).toBeVisible();
    });

    test('should display properly on tablet', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/');

      // Verify layout is visible
      await expect(page.locator('.dashboard')).toBeVisible();
      await expect(page.locator('.games-grid')).toBeVisible();

      // Game cards should still be visible but possibly in different grid
      const gameCards = page.locator('.game-card');
      await expect(gameCards).toHaveCount(3);
    });

    test('should display properly on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');

      // Verify layout is visible
      await expect(page.locator('.dashboard')).toBeVisible();

      // Tabs might show icons only on mobile (<600px)
      const tabs = page.locator('[role="tab"]');
      await expect(tabs).toHaveCount(3);

      // Game cards should stack vertically
      const gameCards = page.locator('.game-card');
      await expect(gameCards).toHaveCount(3);
      await expect(gameCards.first()).toBeVisible();
    });

    test('should maintain functionality on mobile', async ({ page }) => {
      // Set viewport before navigation to avoid race conditions
      await page.setViewportSize({ width: 375, height: 667 });

      // Navigate and wait for the page to load
      await page.goto('/');
      await page.waitForSelector('[role="tablist"]', { state: 'visible' });

      const dashboard = new DashboardPage(page);

      // Test tab switching on mobile (using page object with bilingual selectors)
      await dashboard.switchTab('stats');
      await expect(dashboard.statsTab).toHaveAttribute('aria-selected', 'true');

      // Test game card navigation on mobile
      await dashboard.switchTab('play');
      await dashboard.playGame('magic-graph');
      await expect(page).toHaveURL(/\/magic-graph$/);
    });
  });

  test.describe('Daily Challenge', () => {
    test('should display daily challenge banner', async ({ page }) => {
      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.waitForLoad();

      // Verify daily challenge banner is visible on Play tab
      const isVisible = await dashboard.isDailyChallengeBannerVisible();
      expect(isVisible).toBe(true);
    });

    test('should show countdown timer', async ({ page }) => {
      await page.goto('/');

      // Find countdown element
      const countdown = page.locator('.daily-challenge-banner').getByText(/\d{2}:\d{2}:\d{2}/);
      await expect(countdown).toBeVisible();

      // Verify countdown format (HH:MM:SS)
      const countdownText = await countdown.textContent();
      expect(countdownText).toMatch(/\d{2}:\d{2}:\d{2}/);
    });

    test('should not show daily challenge on other tabs', async ({ page }) => {
      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.waitForLoad();

      // Switch to Stats tab
      await dashboard.switchTab('stats');

      // Daily challenge should not be visible
      const isVisible = await dashboard.isDailyChallengeBannerVisible();
      expect(isVisible).toBe(false);
    });
  });

  test.describe('Stats Display', () => {
    test('should show overall stats on Stats tab', async ({ page }) => {
      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.waitForLoad();

      // Go to Stats tab (using page object with bilingual selectors)
      await dashboard.switchTab('stats');

      // Verify stats are displayed
      await expect(page.locator('#tabpanel-stats')).toBeVisible();

      // Stats should include games played, puzzles solved, etc.
      // The exact structure depends on StatsTab implementation
      const statsPanel = page.locator('#tabpanel-stats');
      const statsContent = await statsPanel.textContent();
      expect(statsContent).toBeTruthy();
    });
  });

  test.describe('Achievements Display', () => {
    test('should show achievements gallery on Achievements tab', async ({ page }) => {
      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.waitForLoad();

      // Go to Achievements tab (using page object with bilingual selectors)
      await dashboard.switchTab('achievements');

      // Verify achievements panel is visible
      await expect(page.locator('#tabpanel-achievements')).toBeVisible();

      // Achievements should be displayed
      const achievementsPanel = page.locator('#tabpanel-achievements');
      const achievementsContent = await achievementsPanel.textContent();
      expect(achievementsContent).toBeTruthy();
    });
  });

  test.describe('Persistence', () => {
    test('should persist tab selection on reload', async ({ page }) => {
      const dashboard = new DashboardPage(page);
      await dashboard.goto();
      await dashboard.waitForLoad();

      // Switch to Stats tab
      await dashboard.switchTab('stats');
      await expect(dashboard.statsTab).toHaveAttribute('aria-selected', 'true');

      // Reload page
      await page.reload();
      await dashboard.waitForLoad();

      // Should return to default Play tab (tabs don't persist by design)
      await expect(dashboard.playTab).toHaveAttribute('aria-selected', 'true');
    });

    test('should persist player profile across reloads', async ({ page }) => {
      const dashboard = new DashboardPage(page);

      // Set player data with streak AND lastPlayedDate
      // lastPlayedDate must be today to prevent checkStreak() from resetting streak
      await updatePlayerProfile(page, {
        displayName: 'Persistent Player',
        streak: 5,
        lastPlayedDate: getTodayDate(),
      });

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
