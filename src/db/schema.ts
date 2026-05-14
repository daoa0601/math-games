import { sql } from 'drizzle-orm'
import {
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core'

export const players = sqliteTable(
  'players',
  {
    id: text('id').primaryKey(),
    displayName: text('display_name').notNull(),
    locale: text('locale', { enum: ['en', 'vi'] })
      .notNull()
      .default('en'),
    gradeBand: text('grade_band', {
      enum: ['elementary', 'middle', 'high'],
    }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [uniqueIndex('players_display_name_idx').on(table.displayName)],
)

export const gameProgress = sqliteTable(
  'game_progress',
  {
    playerId: text('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    gameId: text('game_id', {
      enum: ['magic-graph', 'sequence-race', 'shape-architect'],
    }).notNull(),
    levelId: text('level_id').notNull(),
    bestScore: integer('best_score').notNull().default(0),
    attempts: integer('attempts').notNull().default(0),
    completedAt: integer('completed_at', { mode: 'timestamp' }),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    primaryKey({
      columns: [table.playerId, table.gameId, table.levelId],
    }),
  ],
)

export const playerAchievements = sqliteTable(
  'player_achievements',
  {
    playerId: text('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    achievementId: text('achievement_id').notNull(),
    unlockedAt: integer('unlocked_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    primaryKey({
      columns: [table.playerId, table.achievementId],
    }),
  ],
)

export const dailyChallenges = sqliteTable(
  'daily_challenges',
  {
    challengeDate: text('challenge_date').primaryKey(),
    gameId: text('game_id', {
      enum: ['magic-graph', 'sequence-race', 'shape-architect'],
    }).notNull(),
    seed: text('seed').notNull(),
    configJson: text('config_json').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [uniqueIndex('daily_challenges_seed_idx').on(table.seed)],
)
