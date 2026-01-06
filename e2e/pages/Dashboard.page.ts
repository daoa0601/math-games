import { Page, Locator } from '@playwright/test';

/**
 * Dashboard Page Object
 *
 * Represents the main dashboard page (/) with:
 * - Bottom navigation (Home, Profile, Learn, Settings)
 * - Game cards grid on Home tab
 * - Compact header with rank and streak
 */
export class DashboardPage {
  readonly page: Page;

  // Header elements
  readonly header: Locator;
  readonly rankIcon: Locator;
  readonly playerName: Locator;
  readonly rankName: Locator;
  readonly streakIndicator: Locator;
  readonly streakCount: Locator;

  // Bottom navigation tabs
  readonly nav: Locator;
  readonly homeTab: Locator;
  readonly profileTab: Locator;
  readonly learnTab: Locator;
  readonly settingsTab: Locator;

  // Game cards (on Home tab)
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
    this.rankIcon = page.locator('.compact-header__rank-icon');
    this.playerName = page.locator('.compact-header__name');
    this.rankName = page.locator('.compact-header__rank-name');
    this.streakIndicator = page.locator('.compact-header__streak');
    this.streakCount = page.locator('.compact-header__streak-count');

    // Bottom navigation - uses .nav class with role="tablist"
    this.nav = page.locator('.nav[role="tablist"]');
    this.homeTab = page.locator('.nav__item').filter({ hasText: /home|trang chủ/i }).first();
    this.profileTab = page.locator('.nav__item').filter({ hasText: /profile|hồ sơ/i }).first();
    this.learnTab = page.locator('.nav__item').filter({ hasText: /learn|học/i }).first();
    this.settingsTab = page.locator('.nav__item').filter({ hasText: /settings|cài đặt/i }).first();

    // Game cards - uses .slab class
    this.gamesGrid = page.locator('.grid');
    this.gameCards = page.locator('.slab');

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
    // Wait for page container
    await this.page.waitForSelector('.page', { state: 'visible' });

    // Wait for header to load
    await this.header.waitFor({ state: 'visible' });

    // Wait for nav to be visible
    await this.nav.waitFor({ state: 'visible' });

    // Small delay for animations
    await this.page.waitForTimeout(200);
  }

  /**
   * Switch to a specific tab
   */
  async switchTab(tab: 'home' | 'profile' | 'learn' | 'settings'): Promise<void> {
    const tabLocator = {
      home: this.homeTab,
      profile: this.profileTab,
      learn: this.learnTab,
      settings: this.settingsTab,
    }[tab];

    await tabLocator.click();
    await this.page.waitForTimeout(300); // Animation delay
  }

  /**
   * Get the currently active tab
   */
  async getActiveTab(): Promise<string | null> {
    const activeTab = this.page.locator('.nav__item--active');
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
    const rank = await this.rankName.textContent();

    // Get streak count (0 if not visible)
    let streak = 0;
    if (await this.streakIndicator.isVisible()) {
      const streakText = await this.streakCount.textContent();
      streak = parseInt(streakText || '0', 10);
    }

    return { name, rank, streak };
  }

  /**
   * Check if daily challenge banner is visible
   */
  async isDailyChallengeBannerVisible(): Promise<boolean> {
    return this.dailyChallengeBanner.isVisible();
  }

  /**
   * Get all visible game cards
   */
  async getAllGameCards(): Promise<string[]> {
    const cards = await this.gameCards.all();
    const titles = await Promise.all(
      cards.map(card => card.locator('.slab__title').textContent())
    );
    return titles.filter((title): title is string => title !== null);
  }

  /**
   * Get game card by title text
   */
  getGameCardByTitle(title: string): Locator {
    return this.page.locator('.slab').filter({ hasText: title });
  }
}
