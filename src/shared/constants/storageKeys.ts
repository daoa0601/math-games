/**
 * Centralized localStorage Key Constants
 *
 * All localStorage keys used by the application.
 * Prevents typos and provides a single source of truth.
 */

// ============================================================================
// Key Prefix
// ============================================================================

/**
 * Common prefix for all app localStorage keys
 */
export const STORAGE_PREFIX = 'math-games';

// ============================================================================
// Player Profile Keys
// ============================================================================

/**
 * Player profile data (stats, achievements, preferences)
 */
export const PLAYER_KEY = `${STORAGE_PREFIX}-player`;

/**
 * Language preference (en | vi)
 */
export const LANGUAGE_KEY = `${STORAGE_PREFIX}-lang`;

/**
 * Sound enabled preference
 */
export const SOUND_ENABLED_KEY = `${STORAGE_PREFIX}-sound-enabled`;

/**
 * High contrast mode preference
 */
export const HIGH_CONTRAST_KEY = `${STORAGE_PREFIX}-high-contrast`;

// ============================================================================
// Game Progress Keys
// ============================================================================

/**
 * Get the storage key for a specific game's progress
 */
export function getGameProgressKey(gameId: string): string {
  return `${STORAGE_PREFIX}-${gameId}`;
}

// ============================================================================
// Daily Challenge Keys
// ============================================================================

/**
 * Daily challenge state (completions, streaks)
 */
export const DAILY_CHALLENGE_KEY = `${STORAGE_PREFIX}-daily-challenge`;

/**
 * Leaderboard state (personal best times)
 */
export const LEADERBOARD_KEY = `${STORAGE_PREFIX}-leaderboard`;

// ============================================================================
// All Keys (for debugging/clearing)
// ============================================================================

/**
 * List of all known localStorage keys (excluding game-specific ones)
 */
export const ALL_STATIC_KEYS = [
  PLAYER_KEY,
  LANGUAGE_KEY,
  SOUND_ENABLED_KEY,
  HIGH_CONTRAST_KEY,
  DAILY_CHALLENGE_KEY,
  LEADERBOARD_KEY,
] as const;
