import { and, eq, isNotNull, sql } from 'drizzle-orm'
import { Context, Effect, Layer } from 'effect'

import { schema } from '@math-games/db'
import { computeRank, computeRankScore } from '@math-games/core'

import { ProgressWriteError, withD1Retry } from '@math-games/effect-infra'

import { DbService } from './db'

export interface RankDelta {
  rankUp: { from: string; to: string } | null
}

export interface RankShape {
  readonly computeRankDelta: (input: {
    playerId: string
    newCompletions: number
    newAchievements: number
  }) => Effect.Effect<RankDelta, ProgressWriteError>
}

export const RankService = Context.Service<RankShape>('RankService')

export const RankServiceLive = Layer.effect(
  RankService,
  Effect.map(DbService, ({ db }) => ({
    computeRankDelta: ({ playerId, newCompletions, newAchievements }) =>
      Effect.gen(function* () {
        const [completedCount, achievementCount] = yield* withD1Retry(
          Effect.tryPromise({
            try: async () => {
              const [c, a] = await db.batch([
                db
                  .select({ count: sql<number>`count(*)` })
                  .from(schema.gameProgress)
                  .where(
                    and(
                      eq(schema.gameProgress.playerId, playerId),
                      isNotNull(schema.gameProgress.completedAt),
                    ),
                  ),
                db
                  .select({ count: sql<number>`count(*)` })
                  .from(schema.playerAchievements)
                  .where(eq(schema.playerAchievements.playerId, playerId)),
              ])
              return [c[0]?.count ?? 0, a[0]?.count ?? 0] as const
            },
            catch: (cause) => new ProgressWriteError({ cause }),
          }),
        )

        const scoreBefore = computeRankScore(
          completedCount - newCompletions,
          achievementCount - newAchievements,
        )
        const scoreAfter = computeRankScore(completedCount, achievementCount)
        const rankBefore = computeRank(scoreBefore)
        const rankAfter = computeRank(scoreAfter)

        return {
          rankUp:
            rankAfter.name !== rankBefore.name
              ? { from: rankBefore.name, to: rankAfter.name }
              : null,
        }
      }),
  })),
)
