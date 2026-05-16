import { createServerFn } from '@tanstack/react-start'
import { Effect, Schema } from 'effect'

import { AnalyticsDashboardService } from '@math-games/effect-classroom'
import { runServerEffect } from '@/services/run-server-effect'

const DateRangeInput = Schema.Struct({
  from: Schema.NonEmptyString,
  to: Schema.NonEmptyString,
})

const GameIdInput = Schema.Struct({
  gameId: Schema.NonEmptyString,
})

export const getCompletionRates = createServerFn({ method: 'GET' })
  .inputValidator(Schema.decodeUnknownSync(DateRangeInput))
  .handler(({ data }) =>
    runServerEffect(
      Effect.gen(function* () {
        const dashboard = yield* AnalyticsDashboardService
        return yield* dashboard.getCompletionRates(data)
      }),
    ),
  )

export const getLevelDifficulty = createServerFn({ method: 'GET' })
  .inputValidator(Schema.decodeUnknownSync(GameIdInput))
  .handler(({ data }) =>
    runServerEffect(
      Effect.gen(function* () {
        const dashboard = yield* AnalyticsDashboardService
        return yield* dashboard.getLevelDifficulty(data.gameId)
      }),
    ),
  )

export const getRetention = createServerFn({ method: 'GET' })
  .inputValidator(Schema.decodeUnknownSync(DateRangeInput))
  .handler(({ data }) =>
    runServerEffect(
      Effect.gen(function* () {
        const dashboard = yield* AnalyticsDashboardService
        return yield* dashboard.getRetention(data)
      }),
    ),
  )
