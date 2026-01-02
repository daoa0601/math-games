import { Page } from '@playwright/test';
import type { PlayerProfile } from '../../src/shared/schemas/playerProfile.schema';

/**
 * E2E Test Utilities and Fixtures
 *
 * Provides helpers for:
 * - localStorage manipulation (clear, seed player profile)
 * - Default test data fixtures
 * - State management between tests
 */

/**
 * Get today's date in YYYY-MM-DD format (matches app's getTodayDate())
 */
export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

// Storage keys used by the app (must match src/shared/constants/storageKeys.ts)
export const STORAGE_KEYS = {
  PLAYER_PROFILE: 'math-games-player',
  DAILY_CHALLENGE: 'math-games-daily-challenge',
  TUTORIAL_PROGRESS: 'math-games-tutorial-progress',
  SOUND_ENABLED: 'math-games-sound-enabled',
  LANGUAGE: 'math-games-lang',
} as const;

/**
 * Default player profile for testing
 * Matches PlayerProfile schema from src/shared/schemas/playerProfile.schema.ts
 * IMPORTANT: version must match STORAGE_VERSION in player.ts (currently 2) to avoid migration
 */
export const DEFAULT_TEST_PLAYER: PlayerProfile = {
  id: 'test-player-123',
  displayName: 'Test Player',
  stats: {
    totalGamesPlayed: 0,
    totalPuzzlesSolved: 0,
    totalWins: 0,
    magicGraphSolved: 0,
    sequenceRaceWins: 0,
    shapeArchitectBuilt: 0,
    bestTimes: {
      magicGraphFastest: null,
      sequenceRaceFastest: null,
      shapeArchitectFastest: null,
    },
  },
  rank: 'beginner',
  streak: 0,
  lastPlayedDate: null,
  achievements: [],
  preferences: {
    soundEnabled: false, // Disable sound in tests
    practiceMode: false,
    language: 'en',
  },
  createdAt: new Date().toISOString(),
  version: 2, // Must match STORAGE_VERSION in player.ts
};

/**
 * Player profile with some progress (for testing progression)
 */
export const INTERMEDIATE_TEST_PLAYER: PlayerProfile = {
  ...DEFAULT_TEST_PLAYER,
  id: 'test-player-intermediate',
  displayName: 'Intermediate Player',
  stats: {
    totalGamesPlayed: 30,
    totalPuzzlesSolved: 20,
    totalWins: 15,
    magicGraphSolved: 12,
    sequenceRaceWins: 8,
    shapeArchitectBuilt: 8,
    bestTimes: {
      magicGraphFastest: 45000, // 45 seconds
      sequenceRaceFastest: 60000, // 1 minute
      shapeArchitectFastest: 90000, // 1.5 minutes
    },
  },
  rank: 'intermediate',
  streak: 5,
  achievements: ['global_first_steps', 'mg_first_solve', 'sr_first_victory'],
  lastPlayedDate: getTodayDate(), // Use YYYY-MM-DD format to match app
  version: 2, // Must match STORAGE_VERSION in player.ts
};

/**
 * Clear all localStorage data
 */
export async function clearLocalStorage(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Seed localStorage with a player profile
 */
export async function seedPlayerProfile(
  page: Page,
  profile: PlayerProfile = DEFAULT_TEST_PLAYER
): Promise<void> {
  await page.evaluate(
    ({ key, data }) => {
      localStorage.setItem(key, JSON.stringify(data));
    },
    { key: STORAGE_KEYS.PLAYER_PROFILE, data: profile }
  );
}

/**
 * Get current player profile from localStorage
 */
export async function getPlayerProfile(page: Page): Promise<PlayerProfile | null> {
  return page.evaluate((key) => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }, STORAGE_KEYS.PLAYER_PROFILE);
}

/**
 * Update specific fields in player profile
 */
export async function updatePlayerProfile(
  page: Page,
  updates: Partial<PlayerProfile>
): Promise<void> {
  await page.evaluate(
    ({ key, updates }) => {
      const data = localStorage.getItem(key);
      if (data) {
        const profile = JSON.parse(data);
        const updated = { ...profile, ...updates };
        localStorage.setItem(key, JSON.stringify(updated));
      }
    },
    { key: STORAGE_KEYS.PLAYER_PROFILE, updates }
  );
}

/**
 * Mark a tutorial as completed
 */
export async function completeTutorial(page: Page, gameId: string): Promise<void> {
  await page.evaluate(
    ({ key, gameId }) => {
      const data = localStorage.getItem(key);
      const progress = data ? JSON.parse(data) : {};
      progress[gameId] = true;
      localStorage.setItem(key, JSON.stringify(progress));
    },
    { key: STORAGE_KEYS.TUTORIAL_PROGRESS, gameId }
  );
}

/**
 * Mark daily challenge as completed for a game
 */
export async function completeDailyChallenge(
  page: Page,
  gameId: string,
  date: string = new Date().toISOString().split('T')[0]
): Promise<void> {
  await page.evaluate(
    ({ key, gameId, date }) => {
      const data = localStorage.getItem(key);
      const challenges = data ? JSON.parse(data) : {};
      if (!challenges[gameId]) {
        challenges[gameId] = [];
      }
      if (!challenges[gameId].includes(date)) {
        challenges[gameId].push(date);
      }
      localStorage.setItem(key, JSON.stringify(challenges));
    },
    { key: STORAGE_KEYS.DAILY_CHALLENGES, gameId, date }
  );
}

/**
 * Setup fresh test state
 * - Navigates to the app first (required for localStorage access)
 * - Clears all storage
 * - Seeds default player profile
 * - Marks all tutorials as completed (to avoid tutorial overlays in tests)
 */
export async function setupFreshTestState(
  page: Page,
  profile: PlayerProfile = DEFAULT_TEST_PLAYER
): Promise<void> {
  // Navigate to app first - localStorage requires a valid origin
  await page.goto('/');
  await clearLocalStorage(page);
  await seedPlayerProfile(page, profile);
  // Mark all tutorials as completed to avoid overlays
  await completeTutorial(page, 'magic-graph');
  await completeTutorial(page, 'sequence-race');
  await completeTutorial(page, 'shape-architect');
}

/**
 * Wait for React hydration to complete
 * Useful for avoiding flaky tests due to hydration mismatch
 */
export async function waitForReactHydration(page: Page): Promise<void> {
  // Wait for React to be available
  await page.waitForFunction(() => {
    return typeof window !== 'undefined';
  });
  // Small delay for hydration to settle
  await page.waitForTimeout(100);
}
