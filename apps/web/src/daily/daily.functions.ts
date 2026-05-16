import { createServerFn } from '@tanstack/react-start'
import { setResponseHeader } from '@tanstack/react-start/server'
import { Effect } from 'effect'

import { AnalyticsService } from '@math-games/effect-game'
import { runServerEffect } from '@/services/run-server-effect'

import { loadDailyChallenge } from './daily.server'

export const getDailyChallenge = createServerFn({ method: 'GET' }).handler(
  () => {
    setResponseHeader('cache-control', 'no-store')

    return runServerEffect(
      Effect.gen(function* () {
        const challenge = yield* loadDailyChallenge()

        const analytics = yield* AnalyticsService
        yield* analytics.trackDailyAttempt({
          gameId: challenge.gameId,
          levelId: challenge.levelId,
        })

        return challenge
      }),
    )
  },
)
