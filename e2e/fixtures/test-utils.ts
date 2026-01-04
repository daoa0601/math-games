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

// Storage keys used by the app (must match src/shared/services/*.ts)
export const STORAGE_KEYS = {
  PLAYER_PROFILE: 'math-games-player',
  DAILY_CHALLENGE: 'math-games-daily-challenge',
  TUTORIAL_PROGRESS: 'tutorial-progress', // Used by tutorialProgress.ts
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
 * Format matches tutorialProgress.ts schema with all required fields
 */
export async function completeTutorial(page: Page, gameId: string): Promise<void> {
  await page.evaluate(
    ({ key, gameId }) => {
      const data = localStorage.getItem(key);
      const progress = data
        ? JSON.parse(data)
        : { completedTutorials: {}, skippedTutorials: {}, lastCompletedStep: {} };
      // Ensure all required fields exist
      progress.completedTutorials = progress.completedTutorials || {};
      progress.skippedTutorials = progress.skippedTutorials || {};
      progress.lastCompletedStep = progress.lastCompletedStep || {};
      // Mark tutorial as completed
      progress.completedTutorials[gameId] = true;
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
    { key: STORAGE_KEYS.DAILY_CHALLENGE, gameId, date }
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

  // Set language to English BEFORE seeding profile
  // i18n reads from 'math-games-lang' key directly, not from player profile
  await page.evaluate((langKey) => {
    localStorage.setItem(langKey, 'en');
  }, STORAGE_KEYS.LANGUAGE);

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

/**
 * Wait for Three.js canvas with WebGL context to be ready
 * Use this instead of simple visibility checks for 3D scenes (ShapeArchitect)
 */
export async function waitForCanvasReady(
  page: Page,
  selector = 'canvas',
  timeout = 15000
): Promise<void> {
  // First wait for canvas element to be visible
  await page.waitForSelector(selector, { state: 'visible', timeout });

  // Then wait for WebGL context to be initialized
  await page.waitForFunction(
    (sel: string) => {
      const canvas = document.querySelector(sel) as HTMLCanvasElement;
      if (!canvas) return false;
      // Check for WebGL context (Three.js uses WebGL or WebGL2)
      try {
        return !!(canvas.getContext('webgl') || canvas.getContext('webgl2'));
      } catch {
        return false;
      }
    },
    selector,
    { timeout }
  );
}

/**
 * Wait for animation frame to ensure React render completed
 * Useful after state changes that trigger animations
 */
export async function waitForNextFrame(page: Page): Promise<void> {
  await page.evaluate(() => new Promise(requestAnimationFrame));
}

// ============================================================================
// GAME STATE SEEDING FOR FASTER TESTS
// ============================================================================

/**
 * CI detection for conditional test behavior
 */
export const isCI = !!process.env.CI;

/**
 * Optimized timeouts for CI vs local development
 */
export const TEST_TIMEOUTS = {
  aiMove: isCI ? 2000 : 3000,
  animation: isCI ? 200 : 300,
  gameLoad: isCI ? 8000 : 10000,
};

/**
 * Max iterations for game-loop tests (reduced on CI)
 */
export const MAX_GAME_MOVES = isCI ? 8 : 15;

/**
 * Sequence Race game state for localStorage seeding
 * This allows tests to start games near completion
 */
export interface SequenceRaceState {
  position: number;
  target: number;
  turn: 'player' | 'ai';
  difficulty: 'easy' | 'medium' | 'hard';
}

/**
 * Seed SequenceRace game state via URL params or localStorage
 * This bypasses the need to play through many turns
 * 
 * @param page - Playwright page
 * @param stepsFromTarget - How many steps away from target (2-3 for quick win)
 * @param difficulty - Game difficulty level
 */
export async function seedSequenceRaceNearWin(
  page: Page,
  stepsFromTarget: number = 2,
  difficulty: 'easy' | 'medium' | 'hard' = 'easy'
): Promise<void> {
  // Navigate with query params to seed near-win state
  // The game should detect these params and initialize accordingly
  await page.goto(`/sequence-race?test_mode=true&steps_from_target=${stepsFromTarget}&difficulty=${difficulty}`);
}

/**
 * Alternative: Inject game state directly via window object
 * Use this if URL params aren't supported by the game
 */
export async function injectSequenceRaceState(
  page: Page,
  position: number,
  target: number
): Promise<void> {
  await page.evaluate(({ pos, tgt }) => {
    // Try to access game state via window (if exposed for testing)
    const win = window as unknown as { __TEST_GAME_STATE__?: { position: number; target: number } };
    if (win.__TEST_GAME_STATE__) {
      win.__TEST_GAME_STATE__.position = pos;
      win.__TEST_GAME_STATE__.target = tgt;
    }
  }, { pos: position, tgt: target });
}

/**
 * Force game completion by triggering win condition
 * Useful for testing post-game UI without playing through
 */
export async function triggerGameEnd(
  page: Page,
  result: 'win' | 'lose' | 'timeout'
): Promise<void> {
  await page.evaluate((outcome) => {
    // Dispatch custom event that games can listen for in test mode
    window.dispatchEvent(new CustomEvent('__TEST_GAME_END__', {
      detail: { result: outcome }
    }));
  }, result);
}

// ============================================================================
// GAME-SPECIFIC READY HELPERS
// These ensure all critical game elements are loaded before tests proceed
// ============================================================================

/**
 * Wait for MagicGraph game to be fully ready
 * Checks for puzzle board, nodes, and number inventory
 */
export async function waitForMagicGraphReady(
  page: Page,
  timeout = TEST_TIMEOUTS.gameLoad
): Promise<void> {
  // Wait for main puzzle board
  await page.locator('.puzzle-board').waitFor({ state: 'visible', timeout });

  // Wait for at least one puzzle node to be rendered
  await page.locator('.puzzle-node').first().waitFor({ state: 'visible', timeout: 5000 });

  // Wait for number inventory to be populated
  await page.locator('.number-inventory').waitFor({ state: 'visible', timeout: 5000 });

  // Small delay for React state to settle
  await waitForNextFrame(page);
}

/**
 * Wait for SequenceRace game to be fully ready
 * Checks for race track and step cards
 */
export async function waitForSequenceRaceReady(
  page: Page,
  timeout = TEST_TIMEOUTS.gameLoad
): Promise<void> {
  // Wait for race track
  await page.locator('.race-track').waitFor({ state: 'visible', timeout });

  // Wait for step cards to be rendered
  await page.locator('.step-card').first().waitFor({ state: 'visible', timeout: 5000 });

  // Wait for game info panel
  await page.locator('.game-info-panel').waitFor({ state: 'visible', timeout: 5000 });

  await waitForNextFrame(page);
}

/**
 * Wait for ShapeArchitect game to be fully ready (2D mode)
 * Checks for grid board and piece inventory
 */
export async function waitForShapeArchitectReady(
  page: Page,
  timeout = TEST_TIMEOUTS.gameLoad
): Promise<void> {
  // Wait for grid board
  await page.locator('.grid-board').waitFor({ state: 'visible', timeout });

  // Wait for piece inventory
  await page.locator('.piece-inventory').waitFor({ state: 'visible', timeout: 5000 });

  // Wait for at least one piece to be available
  await page.locator('.piece-item').first().waitFor({ state: 'visible', timeout: 5000 });

  await waitForNextFrame(page);
}

/**
 * Wait for Dashboard to be fully ready
 * Checks for tabs and game cards
 */
export async function waitForDashboardReady(
  page: Page,
  timeout = TEST_TIMEOUTS.gameLoad
): Promise<void> {
  // Wait for dashboard container
  await page.locator('.dashboard').waitFor({ state: 'visible', timeout });

  // Wait for tab list
  await page.locator('[role="tablist"]').waitFor({ state: 'visible', timeout: 5000 });

  // Wait for at least one game card
  await page.locator('.game-card').first().waitFor({ state: 'visible', timeout: 5000 });

  await waitForNextFrame(page);
}

/**
 * Wait for element state change after an action
 * More reliable than arbitrary timeouts
 */
export async function waitForStateChange(
  page: Page,
  selector: string,
  expectedState: 'visible' | 'hidden' | 'attached' | 'detached' = 'visible',
  timeout = 3000
): Promise<void> {
  await page.locator(selector).waitFor({ state: expectedState, timeout });
}

/**
 * Retry an action until it succeeds or times out
 * Useful for flaky click operations
 */
export async function retryAction(
  action: () => Promise<void>,
  maxRetries = 3,
  delayMs = 500
): Promise<void> {
  let lastError: Error | undefined;

  for (let i = 0; i < maxRetries; i++) {
    try {
      await action();
      return;
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError;
}

