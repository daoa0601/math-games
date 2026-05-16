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
    gameId: text('game_id').notNull(),
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

export const dailyPlayerResults = sqliteTable(
  'daily_player_results',
  {
    playerId: text('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    challengeDate: text('challenge_date').notNull(),
    gameId: text('game_id').notNull(),
    levelId: text('level_id').notNull(),
    score: integer('score').notNull().default(0),
    completed: integer('completed', { mode: 'boolean' })
      .notNull()
      .default(false),
    attempts: integer('attempts').notNull().default(0),
    completedAt: integer('completed_at', { mode: 'timestamp' }),
  },
  (table) => [
    primaryKey({ columns: [table.playerId, table.challengeDate] }),
  ],
)

export const gameAttempts = sqliteTable('game_attempts', {
  id: text('id').primaryKey(),
  playerId: text('player_id')
    .notNull()
    .references(() => players.id, { onDelete: 'cascade' }),
  gameId: text('game_id').notNull(),
  levelId: text('level_id').notNull(),
  score: integer('score').notNull(),
  completed: integer('completed', { mode: 'boolean' }).notNull(),
  moves: integer('moves').notNull(),
  durationMs: integer('duration_ms'),
  mode: text('mode').notNull().default('practice'),
  completionJson: text('completion_json'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})

export const classrooms = sqliteTable('classrooms', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  teacherPlayerId: text('teacher_player_id')
    .notNull()
    .references(() => players.id, { onDelete: 'cascade' }),
  joinCode: text('join_code').notNull().unique(),
  gradeBand: text('grade_band'),
  locale: text('locale').default('en'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})

export const classroomMembers = sqliteTable(
  'classroom_members',
  {
    classroomId: text('classroom_id')
      .notNull()
      .references(() => classrooms.id, { onDelete: 'cascade' }),
    playerId: text('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    role: text('role').notNull().default('student'),
    joinedAt: integer('joined_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    primaryKey({ columns: [table.classroomId, table.playerId] }),
  ],
)

export const assignments = sqliteTable('assignments', {
  id: text('id').primaryKey(),
  classroomId: text('classroom_id')
    .notNull()
    .references(() => classrooms.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  gameId: text('game_id').notNull(),
  levelIds: text('level_ids').notNull(),
  dueDate: text('due_date'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})

export const accountLinks = sqliteTable('account_links', {
  playerId: text('player_id')
    .primaryKey()
    .references(() => players.id, { onDelete: 'cascade' }),
  email: text('email').notNull().unique(),
  magicLinkToken: text('magic_link_token'),
  tokenExpiresAt: integer('token_expires_at', { mode: 'timestamp' }),
  linkedAt: integer('linked_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})

export const leaderboardEntries = sqliteTable(
  'leaderboard_entries',
  {
    playerId: text('player_id')
      .notNull()
      .references(() => players.id, { onDelete: 'cascade' }),
    gameId: text('game_id').notNull(),
    levelId: text('level_id').notNull(),
    scope: text('scope').notNull(),
    score: integer('score').notNull(),
    moves: integer('moves').notNull(),
    achievedAt: integer('achieved_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    primaryKey({
      columns: [table.playerId, table.gameId, table.levelId, table.scope],
    }),
  ],
)

export const dailyChallenges = sqliteTable(
  'daily_challenges',
  {
    challengeDate: text('challenge_date').primaryKey(),
    gameId: text('game_id').notNull(),
    seed: text('seed').notNull(),
    configJson: text('config_json').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [uniqueIndex('daily_challenges_seed_idx').on(table.seed)],
)
