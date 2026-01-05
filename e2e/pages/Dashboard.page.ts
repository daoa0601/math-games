import { Page, Locator } from '@playwright/test';

/**
 * Dashboard Page Object
 *
 * Represents the main dashboard page (/) with:
 * - Tab navigation (Play, Stats, Achievements)
 * - Game cards grid
 * - Header with settings controls
 * - Player profile display
 */
export class DashboardPage {
  readonly page: Page;

  // Header elements
  readonly header: Locator;
  readonly rankBadge: Locator;
  readonly playerName: Locator;
  readonly playerRank: Locator;
  readonly streakIndicator: Locator;
  readonly streakCount: Locator;
  readonly soundToggle: Locator;
  readonly languageSwitcher: Locator;

  // Tab navigation
  readonly tabList: Locator;
  readonly playTab: Locator;
  readonly statsTab: Locator;
  readonly achievementsTab: Locator;
  readonly learnTab: Locator;

  // Tab panels
  readonly playTabPanel: Locator;
  readonly statsTabPanel: Locator;
  readonly achievementsTabPanel: Locator;
  readonly learnTabPanel: Locator;

  // Game cards (in Play tab)
  readonly gamesGrid: Locator;
  readonly gameCards: Locator;
  readonly magicGraphCard: Locator;
  readonly sequenceRaceCard: Locator;
  readonly shapeArchitectCard: Locator;

  // Daily challenge banner
  readonly dailyChallengeBanner: Locator;

  constructor(page: Page) {
    this.page = page;

    // Header elements
    this.header = page.locator('.compact-header');
    this.rankBadge = page.locator('.compact-header__rank-badge');
    this.playerName = page.locator('.compact-header__name');
    this.playerRank = page.locator('.compact-header__rank');
    this.streakIndicator = page.locator('.compact-header__streak');
    this.streakCount = page.locator('.compact-header__streak-count');

    // Controls - use class selectors for reliability
    this.soundToggle = page.locator('.sound-toggle');
    this.languageSwitcher = page.locator('.lang-switcher');

    // Tab navigation (using data-testid for reliability)
    this.tabList = page.locator('[role="tablist"]');
    this.playTab = page.locator('[data-testid="tab-play"]');
    this.statsTab = page.locator('[data-testid="tab-stats"]');
    this.achievementsTab = page.locator('[data-testid="tab-achievements"]');
    this.learnTab = page.locator('[data-testid="tab-learn"]');

    // Tab panels
    this.playTabPanel = page.locator('#tabpanel-play');
    this.statsTabPanel = page.locator('#tabpanel-stats');
    this.achievementsTabPanel = page.locator('#tabpanel-achievements');
    this.learnTabPanel = page.locator('#tabpanel-learn');

    // Game cards - using data-testid for reliability
    this.gamesGrid = page.locator('.games-grid');
    this.gameCards = page.locator('.game-card');

    // Individual game cards by data-testid
    this.magicGraphCard = page.locator('[data-testid="game-card-magicGraph"]');
    this.sequenceRaceCard = page.locator('[data-testid="game-card-sequenceRace"]');
    this.shapeArchitectCard = page.locator('[data-testid="game-card-shapeArchitect"]');

    // Daily challenge banner
    this.dailyChallengeBanner = page.locator('[data-testid="daily-challenge-banner"]');
  }

  /**
   * Navigate to the dashboard
   */
  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  /**
   * Wait for dashboard to be fully loaded
   */
  async waitForLoad(): Promise<void> {
    // Wait for dashboard container
    await this.page.waitForSelector('.dashboard', { state: 'visible' });

    // Wait for header to load
    await this.header.waitFor({ state: 'visible' });

    // Wait for tabs to be visible
    await this.playTab.waitFor({ state: 'visible' });

    // Small delay for animations
    await this.page.waitForTimeout(200);
  }

  /**
   * Switch to a specific tab
   */
  async switchTab(tab: 'play' | 'stats' | 'achievements' | 'learn'): Promise<void> {
    const tabLocator = {
      play: this.playTab,
      stats: this.statsTab,
      achievements: this.achievementsTab,
      learn: this.learnTab,
    }[tab];

    await tabLocator.click();

    // Wait for tab panel to be visible
    const panelLocator = {
      play: this.playTabPanel,
      stats: this.statsTabPanel,
      achievements: this.achievementsTabPanel,
      learn: this.learnTabPanel,
    }[tab];

    await panelLocator.waitFor({ state: 'visible' });
    await this.page.waitForTimeout(300); // Animation delay
  }

  /**
   * Get the currently active tab
   */
  async getActiveTab(): Promise<string | null> {
    const activeTab = this.page.locator('[role="tab"][aria-selected="true"]');
    return activeTab.textContent();
  }

  /**
   * Check if a game card is visible
   */
  async isGameCardVisible(game: 'magic-graph' | 'sequence-race' | 'shape-architect'): Promise<boolean> {
    const card = {
      'magic-graph': this.magicGraphCard,
      'sequence-race': this.sequenceRaceCard,
      'shape-architect': this.shapeArchitectCard,
    }[game];

    return card.isVisible();
  }

  /**
   * Click on a game card to navigate to the game
   */
  async playGame(game: 'magic-graph' | 'sequence-race' | 'shape-architect'): Promise<void> {
    const card = {
      'magic-graph': this.magicGraphCard,
      'sequence-race': this.sequenceRaceCard,
      'shape-architect': this.shapeArchitectCard,
    }[game];

    await card.click();

    // Wait for navigation
    await this.page.waitForURL(new RegExp(`/${game}`));
  }

  /**
   * Get player stats from the header
   */
  async getPlayerInfo(): Promise<{
    name: string | null;
    rank: string | null;
    streak: number;
  }> {
    const name = await this.playerName.textContent();
    const rank = await this.playerRank.textContent();

    // Get streak count (0 if not visible)
    let streak = 0;
    if (await this.streakIndicator.isVisible()) {
      const streakText = await this.streakCount.textContent();
      streak = parseInt(streakText || '0', 10);
    }

    return { name, rank, streak };
  }

  /**
   * Toggle sound on/off
   */
  async toggleSound(): Promise<void> {
    await this.soundToggle.click();
  }

  /**
   * Check if sound is enabled
   */
  async isSoundEnabled(): Promise<boolean> {
    const ariaPressed = await this.soundToggle.getAttribute('aria-pressed');
    return ariaPressed === 'true';
  }

  /**
   * Switch language
   */
  async switchLanguage(): Promise<void> {
    await this.languageSwitcher.click();
  }

  /**
   * Get current language
   */
  async getCurrentLanguage(): Promise<'en' | 'vi'> {
    const text = await this.languageSwitcher.textContent();
    // If button shows "VI" it means current is English, showing option to switch to Vietnamese
    return text?.includes('VI') ? 'en' : 'vi';
  }

  /**
   * Check if daily challenge banner is visible
   */
  async isDailyChallengeBannerVisible(): Promise<boolean> {
    return this.dailyChallengeBanner.isVisible();
  }

  /**
   * Get achievement count from achievements tab badge
   */
  async getAchievementCount(): Promise<{ unlocked: number; total: number }> {
    const badgeText = await this.page.locator('.dashboard-tabs__badge').textContent();
    if (!badgeText) return { unlocked: 0, total: 0 };

    const [unlocked, total] = badgeText.split('/').map(s => parseInt(s.trim(), 10));
    return { unlocked: unlocked || 0, total: total || 0 };
  }

  /**
   * Get all visible game cards
   */
  async getAllGameCards(): Promise<string[]> {
    const cards = await this.gameCards.all();
    const titles = await Promise.all(
      cards.map(card => card.locator('.game-card__title').textContent())
    );
    return titles.filter((title): title is string => title !== null);
  }

  /**
   * Get game card by title text
   */
  getGameCardByTitle(title: string): Locator {
    return this.page.locator('.game-card').filter({ hasText: title });
  }
}
