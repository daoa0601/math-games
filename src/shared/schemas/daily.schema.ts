import { z } from 'zod';

// Storage game ID enum
export const StorageGameIdSchema = z.enum([
  'magic-graph',
  'sequence-race',
  'shape-architect',
]);
export type StorageGameId = z.infer<typeof StorageGameIdSchema>;

// Game streak tracking
export const GameStreakSchema = z.object({
  currentStreak: z.number().int().nonnegative(),
  longestStreak: z.number().int().nonnegative(),
  lastCompletedDate: z.string().nullable(),
});
export type GameStreak = z.infer<typeof GameStreakSchema>;

// Daily challenge completion
export const DailyChallengeCompletionSchema = z.object({
  date: z.string(),
  gameId: StorageGameIdSchema,
  completed: z.boolean(),
  timeSeconds: z.number().nonnegative().nullable(),
  completedAt: z.string().nullable(),
});
export type DailyChallengeCompletion = z.infer<typeof DailyChallengeCompletionSchema>;

// Daily challenge state
export const DailyChallengeStateSchema = z.object({
  completions: z.array(DailyChallengeCompletionSchema),
  streaks: z.object({
    'magic-graph': GameStreakSchema,
    'sequence-race': GameStreakSchema,
    'shape-architect': GameStreakSchema,
  }),
  version: z.number().int(),
});
export type DailyChallengeState = z.infer<typeof DailyChallengeStateSchema>;
