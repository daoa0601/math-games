import { and, eq, sql } from '@math-games/db'
import { Effect } from 'effect'

import { checkAchievements } from '@/achievements/achievements.logic'
import { schema } from '@math-games/db'
import { GAME_IDS } from '@/games/registry'
import { createPlayerIdentity } from '@/player/identity.server'
import { ProgressWriteError, withD1Retry } from '@math-games/effect-infra'
import { DbService } from '@math-games/effect-game'

export interface RecordGameProgressInput {
  playerId: string
  gameId: string
  levelId: string
  score: number
  completed: boolean
  difficulty?: string
  isOptimalSolution?: boolean
  wasWinner?: boolean
}

export interface GameProgressRecord {
  playerId: string
  gameId: string
  levelId: string
  bestScore: number
  attempts: number
  completedAt: string | null
  unlockedAchievements: string[]
}

function toProgressRecord(
  row: typeof schema.gameProgress.$inferSelect,
  unlockedAchievements: string[],
): GameProgressRecord {
  return {
    playerId: row.playerId,
    gameId: row.gameId,
    levelId: row.levelId,
    bestScore: row.bestScore,
    attempts: row.attempts,
    completedAt: row.completedAt?.toISOString() ?? null,
    unlockedAchievements,
  }
}

export function recordGameProgress(input: RecordGameProgressInput) {
  return Effect.gen(function* () {
    const { db } = yield* DbService

    const [existingAchievements, attemptsByGame] = yield* withD1Retry(
      Effect.tryPromise({
        try: () =>
          db.batch([
            db
              .select({
                achievementId: schema.playerAchievements.achievementId,
              })
              .from(schema.playerAchievements)
              .where(eq(schema.playerAchievements.playerId, input.playerId)),
            db
              .select({
                gameId: schema.gameProgress.gameId,
                totalAttempts: sql<number>`coalesce(sum(${schema.gameProgress.attempts}), 0)`,
              })
              .from(schema.gameProgress)
              .where(eq(schema.gameProgress.playerId, input.playerId))
              .groupBy(schema.gameProgress.gameId),
          ]),
        catch: (cause) => new ProgressWriteError({ cause }),
      }),
    )

    const gamesPlayedByType = Object.fromEntries(
      GAME_IDS.map((id) => [id, 0]),
    ) as Record<string, number>

    for (const row of attemptsByGame) {
      gamesPlayedByType[row.gameId] = Number(row.totalAttempts)
    }

    gamesPlayedByType[input.gameId] += 1

    const unlockedAchievements = checkAchievements(
      {
        gameId: input.gameId,
        completed: input.completed,
        difficulty: input.difficulty,
        isOptimalSolution: input.isOptimalSolution,
        wasWinner: input.wasWinner,
        gamesPlayedByType,
      },
      existingAchievements.map((row) => row.achievementId),
    )

    const upsertPlayer = db
      .insert(schema.players)
      .values(createPlayerIdentity(input.playerId))
      .onConflictDoUpdate({
        target: schema.players.id,
        set: { updatedAt: sql`(unixepoch())` },
      })

    const upsertProgress = db
      .insert(schema.gameProgress)
      .values({
        playerId: input.playerId,
        gameId: input.gameId,
        levelId: input.levelId,
        bestScore: input.score,
        attempts: 1,
        completedAt: input.completed ? new Date() : null,
      })
      .onConflictDoUpdate({
        target: [
          schema.gameProgress.playerId,
          schema.gameProgress.gameId,
          schema.gameProgress.levelId,
        ],
        set: {
          bestScore: sql`max(${schema.gameProgress.bestScore}, ${input.score})`,
          attempts: sql`${schema.gameProgress.attempts} + 1`,
          completedAt: input.completed
            ? sql`coalesce(${schema.gameProgress.completedAt}, unixepoch())`
            : schema.gameProgress.completedAt,
          updatedAt: sql`(unixepoch())`,
        },
      })

    const selectFinal = db
      .select()
      .from(schema.gameProgress)
      .where(
        and(
          eq(schema.gameProgress.playerId, input.playerId),
          eq(schema.gameProgress.gameId, input.gameId),
          eq(schema.gameProgress.levelId, input.levelId),
        ),
      )

    const writeBatch =
      unlockedAchievements.length > 0
        ? ([
            upsertPlayer,
            upsertProgress,
            db
              .insert(schema.playerAchievements)
              .values(
                unlockedAchievements.map((achievementId) => ({
                  playerId: input.playerId,
                  achievementId,
                })),
              )
              .onConflictDoNothing(),
            selectFinal,
          ] as const)
        : ([upsertPlayer, upsertProgress, selectFinal] as const)

    const writeResults = yield* withD1Retry(
      Effect.tryPromise({
        try: () => db.batch(writeBatch),
        catch: (cause) => new ProgressWriteError({ cause }),
      }),
    )

    const finalRows = writeResults[writeResults.length - 1] as Array<
      typeof schema.gameProgress.$inferSelect
    >

    const [progress] = finalRows

    return toProgressRecord(progress, unlockedAchievements)
  })
}
