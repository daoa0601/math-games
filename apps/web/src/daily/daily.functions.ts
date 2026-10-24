import { createServerFn } from '@tanstack/react-start'
import { setResponseHeader } from '@tanstack/react-start/server'
import { Effect } from 'effect'

import { AnalyticsService } from '@math-games/effect-game'
import { loadPlayerProfileOverview } from '@/player/profile.server'
import { runServerEffect } from '@/services/run-server-effect'

import { loadDailyChallenge } from './daily.server'

// The daily challenge and the profile overview load in one request, not two
// parallel server-function calls: a cookieless visitor's identity is minted
// once per request, so two requests would pin each half to a different player.
export const getDailyChallengeAndOverview = createServerFn({
  method: 'GET',
}).handler(() => {
  setResponseHeader('cache-control', 'no-store')

  return runServerEffect(
    Effect.all(
      {
        challenge: Effect.gen(function* () {
          const challenge = yield* loadDailyChallenge()

          const analytics = yield* AnalyticsService
          yield* analytics.trackDailyAttempt({
            gameId: challenge.gameId,
            levelId: challenge.levelId,
          })

          return challenge
        }),
        overview: loadPlayerProfileOverview(),
      },
      { concurrency: 'unbounded' },
    ),
  )
})
