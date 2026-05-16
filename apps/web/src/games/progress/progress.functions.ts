import { createServerFn } from '@tanstack/react-start'
import { eq } from '@math-games/db'
import { Effect } from 'effect'

import { schema } from '@math-games/db'
import { DbService, PlayerIdentityService, runServerEffect } from '@math-games/services'
import { withD1Retry } from '@math-games/services'
import { ProgressWriteError } from '@math-games/core'

import { computeRecommendations } from './recommendations'

export const getPlayerGameState = createServerFn({ method: 'GET' }).handler(
  () =>
    runServerEffect(
      Effect.gen(function* () {
        const playerId = yield* (yield* PlayerIdentityService).resolveId()
        const { db } = yield* DbService

        const rows = yield* withD1Retry(
          Effect.tryPromise({
            try: () =>
              db
                .select({
                  gameId: schema.gameProgress.gameId,
                  levelId: schema.gameProgress.levelId,
                  bestScore: schema.gameProgress.bestScore,
                  completedAt: schema.gameProgress.completedAt,
                })
                .from(schema.gameProgress)
                .where(eq(schema.gameProgress.playerId, playerId)),
            catch: (cause) => new ProgressWriteError({ cause }),
          }),
        )

        return computeRecommendations(rows)
      }),
    ),
)
