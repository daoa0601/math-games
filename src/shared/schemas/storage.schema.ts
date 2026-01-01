import { z } from 'zod';
import { StorageGameIdSchema } from './daily.schema';

// Game progress
export const GameProgressSchema = z.object({
  highestLevel: z.number().int().nonnegative(),
  completedLevels: z.array(z.number().int()),
  lastPlayed: z.string().nullable(),
});
export type GameProgress = z.infer<typeof GameProgressSchema>;

// Leaderboard entry
export const LeaderboardEntrySchema = z.object({
  levelId: z.string(),
  gameId: StorageGameIdSchema,
  bestTime: z.number().positive(),
  achievedAt: z.string(),
  difficulty: z.string().optional(),
});
export type LeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>;

// Leaderboard state
export const LeaderboardStateSchema = z.object({
  entries: z.array(LeaderboardEntrySchema),
  version: z.number().int(),
});
export type LeaderboardState = z.infer<typeof LeaderboardStateSchema>;
