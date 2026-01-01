import { z } from 'zod';

// Player preferences
export const PlayerPreferencesSchema = z.object({
  soundEnabled: z.boolean(),
  practiceMode: z.boolean(),
  language: z.enum(['en', 'vi']),
});
export type PlayerPreferences = z.infer<typeof PlayerPreferencesSchema>;

// Best times for each game
export const BestTimesSchema = z.object({
  magicGraphFastest: z.number().nullable(),
  sequenceRaceFastest: z.number().nullable(),
  shapeArchitectFastest: z.number().nullable(),
});
export type BestTimes = z.infer<typeof BestTimesSchema>;

// Player statistics
export const PlayerStatsSchema = z.object({
  totalGamesPlayed: z.number().int().nonnegative(),
  totalPuzzlesSolved: z.number().int().nonnegative(),
  totalWins: z.number().int().nonnegative(),
  magicGraphSolved: z.number().int().nonnegative(),
  sequenceRaceWins: z.number().int().nonnegative(),
  shapeArchitectBuilt: z.number().int().nonnegative(),
  bestTimes: BestTimesSchema,
});
export type PlayerStats = z.infer<typeof PlayerStatsSchema>;

// Player rank enum
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
export type PlayerRank = z.infer<typeof PlayerRankSchema>;

// Full player profile
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
export type PlayerProfile = z.infer<typeof PlayerProfileSchema>;
