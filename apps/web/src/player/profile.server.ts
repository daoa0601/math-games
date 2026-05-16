/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion -- Drizzle D1 nullable timestamp inference is narrower than the runtime row shape */

import { asc, eq, sql } from '@math-games/db'
import { Effect } from 'effect'

import { getAchievementById } from '@/achievements/achievements.logic'
import { schema } from '@math-games/db'
import { PlayerProfileError, PlayerProfileWriteError, withD1Retry } from '@math-games/effect-infra'
import { DbService, PlayerIdentityService } from '@math-games/effect-game'

import type {
  AchievementImportInput,
  GradeBand,
  Locale,
  PlayerProfileInput,
} from './profile.schema'

export interface PlayerProfileRecord {
  id: string
  displayName: string
  locale: Locale
  gradeBand: GradeBand
  createdAt: string
  updatedAt: string
}

export interface PlayerProgressSummary {
  gameId: string
  levelId: string
  bestScore: number
  attempts: number
  completedAt: string | null
}

export interface PlayerProfileOverview {
  profile: PlayerProfileRecord
  progress: PlayerProgressSummary[]
  achievements: string[]
}

export interface AchievementImportResult {
  achievementIds: string[]
  importedCount: number
}

function toPlayerProfileRecord(
  row: typeof schema.players.$inferSelect,
): PlayerProfileRecord {
  return {
    id: row.id,
    displayName: row.displayName,
    locale: row.locale,
    gradeBand: row.gradeBand,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

function toProgressSummary(
  row: typeof schema.gameProgress.$inferSelect,
): PlayerProgressSummary {
  const completedAt = row.completedAt as Date | null

  return {
    gameId: row.gameId,
    levelId: row.levelId,
    bestScore: row.bestScore,
    attempts: row.attempts,
    completedAt: completedAt?.toISOString() ?? null,
  }
}

export function loadPlayerProfileOverview() {
  return Effect.gen(function* () {
    const { db } = yield* DbService
    const identity = yield* (yield* PlayerIdentityService).resolve()

    yield* withD1Retry(
      Effect.tryPromise({
        try: () =>
          db
            .insert(schema.players)
            .values(identity)
            .onConflictDoUpdate({
              target: schema.players.id,
              set: { updatedAt: sql`(unixepoch())` },
            }),
        catch: (cause) => new PlayerProfileError({ cause }),
      }),
    )

    const [playerRows, progress, achievements] = yield* withD1Retry(
      Effect.tryPromise({
        try: () =>
          db.batch([
            db
              .select()
              .from(schema.players)
              .where(eq(schema.players.id, identity.id))
              .limit(1),
            db
              .select()
              .from(schema.gameProgress)
              .where(eq(schema.gameProgress.playerId, identity.id))
              .orderBy(
                asc(schema.gameProgress.gameId),
                asc(schema.gameProgress.levelId),
              ),
            db
              .select()
              .from(schema.playerAchievements)
              .where(eq(schema.playerAchievements.playerId, identity.id))
              .orderBy(asc(schema.playerAchievements.achievementId)),
          ] as const),
        catch: (cause) => new PlayerProfileError({ cause }),
      }),
    )

    return {
      profile: toPlayerProfileRecord(playerRows[0]),
      progress: progress.map(toProgressSummary),
      achievements: achievements.map((row) => row.achievementId),
    }
  })
}

export function savePlayerProfile(input: PlayerProfileInput) {
  return Effect.gen(function* () {
    const { db } = yield* DbService
    const identity = yield* (yield* PlayerIdentityService).resolve()

    yield* withD1Retry(
      Effect.tryPromise({
        try: () =>
          db
            .insert(schema.players)
            .values({
              id: identity.id,
              displayName: input.displayName,
              locale: input.locale,
              gradeBand: input.gradeBand,
            })
            .onConflictDoUpdate({
              target: schema.players.id,
              set: {
                displayName: input.displayName,
                locale: input.locale,
                gradeBand: input.gradeBand,
                updatedAt: sql`(unixepoch())`,
              },
            }),
        catch: (cause) => new PlayerProfileWriteError({ cause }),
      }),
    )

    const [player] = yield* withD1Retry(
      Effect.tryPromise({
        try: () =>
          db
            .select()
            .from(schema.players)
            .where(eq(schema.players.id, identity.id))
            .limit(1),
        catch: (cause) => new PlayerProfileWriteError({ cause }),
      }),
    )

    return toPlayerProfileRecord(player)
  })
}

export function importPlayerAchievements(input: AchievementImportInput) {
  return Effect.gen(function* () {
    const { db } = yield* DbService
    const identity = yield* (yield* PlayerIdentityService).resolve()
    const achievementIds = Array.from(new Set(input.achievementIds)).filter(
      (achievementId) => getAchievementById(achievementId) !== undefined,
    )

    const upsertPlayer = db
      .insert(schema.players)
      .values(identity)
      .onConflictDoUpdate({
        target: schema.players.id,
        set: { updatedAt: sql`(unixepoch())` },
      })

    const selectAchievements = db
      .select({ achievementId: schema.playerAchievements.achievementId })
      .from(schema.playerAchievements)
      .where(eq(schema.playerAchievements.playerId, identity.id))
      .orderBy(asc(schema.playerAchievements.achievementId))

    const finalRows =
      achievementIds.length > 0
        ? yield* withD1Retry(
            Effect.tryPromise({
              try: async () => {
                const [, , rows] = await db.batch([
                  upsertPlayer,
                  db
                    .insert(schema.playerAchievements)
                    .values(
                      achievementIds.map((achievementId) => ({
                        playerId: identity.id,
                        achievementId,
                      })),
                    )
                    .onConflictDoNothing(),
                  selectAchievements,
                ] as const)

                return rows
              },
              catch: (cause): PlayerProfileWriteError =>
                new PlayerProfileWriteError({ cause }),
            }),
          )
        : yield* withD1Retry(
            Effect.tryPromise({
              try: async () => {
                const [, rows] = await db.batch([
                  upsertPlayer,
                  selectAchievements,
                ] as const)

                return rows
              },
              catch: (cause): PlayerProfileWriteError =>
                new PlayerProfileWriteError({ cause }),
            }),
          )

    return {
      achievementIds: finalRows.map((row) => row.achievementId),
      importedCount: achievementIds.length,
    }
  })
}
