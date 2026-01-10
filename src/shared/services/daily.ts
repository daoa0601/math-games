/**
 * Daily Challenge Service
 *
 * Manages daily puzzle state, completion tracking, and per-game streak calculation.
 * Each game maintains its own streak independently.
 *
 * @example
 * import { isDailyCompleted, completeDailyChallenge } from '@/shared/services/daily';
 *
 * // Check if today's MagicGraph challenge is done
 * if (!isDailyCompleted('magic-graph')) {
 *   // Show daily challenge
 * }
 *
 * // Complete a daily challenge
 * const result = completeDailyChallenge('magic-graph', 45); // 45 seconds
 * if (result.streakIncreased) {
 *   // Show streak animation
 * }
 */

import { TypedStorage } from '../utils/TypedStorage';
import {
  DailyChallengeStateSchema,
  type DailyChallengeState,
  type DailyChallengeCompletion,
  type StorageGameId,
  type GameStreak,
} from '../utils/schemas';
import { DAILY_CHALLENGE_KEY } from '../constants';
import { daysBetween } from '../utils/dateUtils';
import { getTodaySeed } from '../utils/seededRandom';

// ============================================================================
// Constants
// ============================================================================

const STORAGE_VERSION = 1;
const MAX_HISTORY_DAYS = 30; // Keep 30 days of completion history

const GAME_IDS: StorageGameId[] = ['magic-graph', 'sequence-race', 'shape-architect'];

// ============================================================================
// Default State
// ============================================================================

function createDefaultStreak(): GameStreak {
  return {
    currentStreak: 0,
    longestStreak: 0,
    lastCompletedDate: null,
  };
}

function createDefaultState(): DailyChallengeState {
  return {
    completions: [],
    streaks: {
      'magic-graph': createDefaultStreak(),
      'sequence-race': createDefaultStreak(),
      'shape-architect': createDefaultStreak(),
    },
    version: STORAGE_VERSION,
  };
}

// ============================================================================
// Storage Setup
// ============================================================================

const dailyChallengeStorage = new TypedStorage(
  DAILY_CHALLENGE_KEY,
  DailyChallengeStateSchema,
  createDefaultState(),
  {
    version: STORAGE_VERSION,
    onValidationError: (error) => {
      console.warn('[DailyChallenge] Validation error, resetting:', error);
    },
  }
);

// ============================================================================
// Public API - Query Functions
// ============================================================================

/**
 * Get the current daily challenge state
 */
export function getDailyChallengeState(): DailyChallengeState {
  return dailyChallengeStorage.get();
}

/**
 * Check if a specific game's daily challenge is completed today
 */
export function isDailyCompleted(gameId: StorageGameId): boolean {
  const state = getDailyChallengeState();
  const today = getTodaySeed();

  return state.completions.some(
    (c) => c.date === today && c.gameId === gameId && c.completed
  );
}

/**
 * Get today's completion for a specific game (or null if not completed)
 */
export function getTodayCompletion(
  gameId: StorageGameId
): DailyChallengeCompletion | null {
  const state = getDailyChallengeState();
  const today = getTodaySeed();

  return (
    state.completions.find(
      (c) => c.date === today && c.gameId === gameId
    ) || null
  );
}

/**
 * Get today's completion status for all games
 */
export function getTodayCompletions(): Map<
  StorageGameId,
  DailyChallengeCompletion | null
> {
  const state = getDailyChallengeState();
  const today = getTodaySeed();

  const result = new Map<StorageGameId, DailyChallengeCompletion | null>();

  for (const gameId of GAME_IDS) {
    const completion = state.completions.find(
      (c) => c.date === today && c.gameId === gameId
    );
    result.set(gameId, completion || null);
  }

  return result;
}

/**
 * Check if all three games are completed today
 * Optimized to use a single storage read and O(n) iteration with Set lookup
 */
export function isAllGamesCompletedToday(): boolean {
  const state = getDailyChallengeState();
  const today = getTodaySeed();

  // Build Set of completed games today in a single pass - O(n)
  const completedTodaySet = new Set<StorageGameId>();
  for (const c of state.completions) {
    if (c.date === today && c.completed) {
      completedTodaySet.add(c.gameId);
    }
  }

  // Check all games are in the set - O(k) where k is number of games (3)
  return GAME_IDS.every(gameId => completedTodaySet.has(gameId));
}

/**
 * Get streak info for a specific game
 */
export function getGameStreak(gameId: StorageGameId): GameStreak {
  const state = getDailyChallengeState();
  return state.streaks[gameId];
}

/**
 * Get best time for a daily challenge by date and game
 */
export function getDailyBestTime(
  gameId: StorageGameId,
  date: string
): number | null {
  const state = getDailyChallengeState();
  const completion = state.completions.find(
    (c) => c.date === date && c.gameId === gameId
  );
  return completion?.timeSeconds ?? null;
}

// ============================================================================
// Public API - Mutation Functions
// ============================================================================

export interface CompletionResult {
  /** Whether this is a new completion (first time today) */
  isNewCompletion: boolean;
  /** Whether a new personal best was set */
  isNewBest: boolean;
  /** Previous best time (null if first completion) */
  previousBest: number | null;
  /** Whether the streak increased */
  streakIncreased: boolean;
  /** Whether a streak record was broken */
  newStreakRecord: boolean;
  /** Current streak count for this game */
  currentStreak: number;
  /** Longest streak ever for this game */
  longestStreak: number;
}

/**
 * Record a daily challenge completion.
 * Updates best time if faster, and handles streak calculation.
 */
export function completeDailyChallenge(
  gameId: StorageGameId,
  timeSeconds: number
): CompletionResult {
  const today = getTodaySeed();
  const state = getDailyChallengeState();

  // Check if already completed today
  const existingIndex = state.completions.findIndex(
    (c) => c.date === today && c.gameId === gameId
  );

  const existingCompletion =
    existingIndex >= 0 ? state.completions[existingIndex] : null;
  const previousBest = existingCompletion?.timeSeconds ?? null;
  const isNewBest = previousBest === null || timeSeconds < previousBest;

  // Update or create completion
  const newState = dailyChallengeStorage.update((s) => {
    if (existingIndex >= 0 && isNewBest) {
      // Update best time for existing completion
      s.completions[existingIndex] = {
        ...s.completions[existingIndex],
        timeSeconds,
      };
    } else if (existingIndex < 0) {
      // Add new completion
      s.completions.push({
        date: today,
        gameId,
        completed: true,
        timeSeconds,
        completedAt: new Date().toISOString(),
      });

      // Update streak for this game
      const streakResult = updateGameStreak(s.streaks[gameId], today);
      s.streaks[gameId] = streakResult.streak;
    }

    // Prune old history
    pruneHistory(s);

    return s;
  });

  // Calculate result
  const isNewCompletion = existingIndex < 0;
  const currentStreak = newState.streaks[gameId].currentStreak;
  const longestStreak = newState.streaks[gameId].longestStreak;

  return {
    isNewCompletion,
    isNewBest,
    previousBest,
    streakIncreased: isNewCompletion && currentStreak > 1,
    newStreakRecord: currentStreak === longestStreak && currentStreak > 1,
    currentStreak,
    longestStreak,
  };
}

// ============================================================================
// Internal Helpers
// ============================================================================

interface StreakUpdateResult {
  streak: GameStreak;
  increased: boolean;
}

/**
 * Update streak for a game based on completion date
 */
function updateGameStreak(
  currentStreak: GameStreak,
  completionDate: string
): StreakUpdateResult {
  const { lastCompletedDate } = currentStreak;

  // First completion ever
  if (!lastCompletedDate) {
    const newStreak: GameStreak = {
      currentStreak: 1,
      longestStreak: 1,
      lastCompletedDate: completionDate,
    };
    return { streak: newStreak, increased: true };
  }

  // Same day - no change
  if (lastCompletedDate === completionDate) {
    return { streak: currentStreak, increased: false };
  }

  const daysDiff = daysBetween(lastCompletedDate, completionDate);

  if (daysDiff === 1) {
    // Consecutive day - increase streak
    const newCurrentStreak = currentStreak.currentStreak + 1;
    const newStreak: GameStreak = {
      currentStreak: newCurrentStreak,
      longestStreak: Math.max(currentStreak.longestStreak, newCurrentStreak),
      lastCompletedDate: completionDate,
    };
    return { streak: newStreak, increased: true };
  }

  // Streak broken - reset to 1
  const newStreak: GameStreak = {
    currentStreak: 1,
    longestStreak: currentStreak.longestStreak,
    lastCompletedDate: completionDate,
  };
  return { streak: newStreak, increased: false };
}

// daysBetween imported from '@/shared/utils/dateUtils'

/**
 * Remove completions older than MAX_HISTORY_DAYS
 */
function pruneHistory(state: DailyChallengeState): void {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - MAX_HISTORY_DAYS);
  const cutoff = cutoffDate.toISOString().split('T')[0];

  state.completions = state.completions.filter((c) => c.date >= cutoff);
}

// ============================================================================
// Debug/Reset Functions
// ============================================================================

/**
 * Reset all daily challenge data (for testing)
 */
export function resetDailyChallengeState(): void {
  dailyChallengeStorage.reset();
}

/**
 * Get completion history for a specific game (last N days)
 */
export function getCompletionHistory(
  gameId: StorageGameId,
  days: number = 7
): DailyChallengeCompletion[] {
  const state = getDailyChallengeState();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  const cutoff = cutoffDate.toISOString().split('T')[0];

  return state.completions
    .filter((c) => c.gameId === gameId && c.date >= cutoff)
    .sort((a, b) => b.date.localeCompare(a.date)); // Most recent first
}
