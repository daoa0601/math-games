/**
 * Zod schemas for runtime validation of localStorage data.
 * These schemas ensure data integrity and provide graceful fallbacks
 * when stored data is corrupted or from an older version.
 *
 * @see https://zod.dev/
 */

import { z } from 'zod';

// ============================================================================
// Player Profile Schemas
// ============================================================================

export const PlayerPreferencesSchema = z.object({
  soundEnabled: z.boolean(),
  practiceMode: z.boolean(),
  language: z.enum(['en', 'vi']),
});

export const BestTimesSchema = z.object({
  magicGraphFastest: z.number().nullable(),
  sequenceRaceFastest: z.number().nullable(),
  shapeArchitectFastest: z.number().nullable(),
});

export const PlayerStatsSchema = z.object({
  totalGamesPlayed: z.number().int().nonnegative(),
  totalPuzzlesSolved: z.number().int().nonnegative(),
  totalWins: z.number().int().nonnegative(),
  magicGraphSolved: z.number().int().nonnegative(),
  sequenceRaceWins: z.number().int().nonnegative(),
  shapeArchitectBuilt: z.number().int().nonnegative(),
  bestTimes: BestTimesSchema,
});

export const PlayerRankSchema = z.enum([
  'beginner',
  'learner',
  'apprentice',
  'intermediate',
  'advanced',
  'expert',
  'master',
  'grandmaster',
]);

export const PlayerProfileSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  stats: PlayerStatsSchema,
  rank: PlayerRankSchema,
  streak: z.number().int().nonnegative(),
  lastPlayedDate: z.string().nullable(),
  achievements: z.array(z.string()),
  preferences: PlayerPreferencesSchema,
  createdAt: z.string(),
  version: z.number().int(),
});

// ============================================================================
// Game Progress Schemas
// ============================================================================

export const GameProgressSchema = z.object({
  highestLevel: z.number().int().nonnegative(),
  completedLevels: z.array(z.number().int()),
  lastPlayed: z.string().nullable(),
});

// ============================================================================
// Daily Challenge Schemas
// ============================================================================

/**
 * Game ID enum for storage - matches the URL paths
 */
export const StorageGameIdSchema = z.enum([
  'magic-graph',
  'sequence-race',
  'shape-architect',
]);

/**
 * Per-game streak tracking.
 * Each game maintains its own consecutive day count.
 */
export const GameStreakSchema = z.object({
  currentStreak: z.number().int().nonnegative(),
  longestStreak: z.number().int().nonnegative(),
  lastCompletedDate: z.string().nullable(), // YYYY-MM-DD format
});

/**
 * Individual daily challenge completion record.
 * Tracks when and how fast a player completed a daily challenge.
 */
export const DailyChallengeCompletionSchema = z.object({
  date: z.string(), // YYYY-MM-DD format
  gameId: StorageGameIdSchema,
  completed: z.boolean(),
  timeSeconds: z.number().nonnegative().nullable(),
  completedAt: z.string().nullable(), // ISO timestamp
});

/**
 * Complete daily challenge state.
 * Stores completion history and per-game streaks.
 */
export const DailyChallengeStateSchema = z.object({
  completions: z.array(DailyChallengeCompletionSchema),
  streaks: z.object({
    'magic-graph': GameStreakSchema,
    'sequence-race': GameStreakSchema,
    'shape-architect': GameStreakSchema,
  }),
  version: z.number().int(),
});

// ============================================================================
// Leaderboard Schemas
// ============================================================================

/**
 * Individual leaderboard entry for a level.
 * Tracks best time achieved for personal records.
 */
export const LeaderboardEntrySchema = z.object({
  levelId: z.string(),
  gameId: StorageGameIdSchema,
  bestTime: z.number().positive(),
  achievedAt: z.string(), // ISO timestamp
  difficulty: z.string().optional(),
});

/**
 * Complete leaderboard state with all personal bests.
 */
export const LeaderboardStateSchema = z.object({
  entries: z.array(LeaderboardEntrySchema),
  version: z.number().int(),
});

// ============================================================================
// Type Exports (inferred from schemas)
// ============================================================================

export type PlayerPreferences = z.infer<typeof PlayerPreferencesSchema>;
export type BestTimes = z.infer<typeof BestTimesSchema>;
export type PlayerStats = z.infer<typeof PlayerStatsSchema>;
export type PlayerRank = z.infer<typeof PlayerRankSchema>;
export type PlayerProfile = z.infer<typeof PlayerProfileSchema>;
export type GameProgress = z.infer<typeof GameProgressSchema>;

// Daily Challenge types
export type StorageGameId = z.infer<typeof StorageGameIdSchema>;
export type GameStreak = z.infer<typeof GameStreakSchema>;
export type DailyChallengeCompletion = z.infer<typeof DailyChallengeCompletionSchema>;
export type DailyChallengeState = z.infer<typeof DailyChallengeStateSchema>;

// Leaderboard types
export type LeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>;
export type LeaderboardState = z.infer<typeof LeaderboardStateSchema>;
