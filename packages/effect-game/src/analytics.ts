import { Context, Effect, Layer } from 'effect'

import { WorkerEnvService } from '@math-games/effect-infra'

export interface AnalyticsShape {
  readonly trackGameComplete: (params: {
    gameId: string
    levelId: string
    score: number
    completed: boolean
  }) => Effect.Effect<void>
  readonly trackDailyAttempt: (params: {
    gameId: string
    levelId: string
  }) => Effect.Effect<void>
  readonly trackAchievement: (params: {
    gameId: string
    achievementId: string
  }) => Effect.Effect<void>
}

export const AnalyticsService =
  Context.Service<AnalyticsShape>('AnalyticsService')

export const AnalyticsServiceLive = Layer.effect(
  AnalyticsService,
  Effect.map(WorkerEnvService, (env) => {
    const ae = env.getAnalytics()

    return {
      trackGameComplete: ({ gameId, levelId, score, completed }) =>
        Effect.sync(() => {
          ae.writeDataPoint({
            indexes: [gameId],
            blobs: ['game_complete', levelId, completed ? 'true' : 'false'],
            doubles: [score],
          })
        }),

      trackDailyAttempt: ({ gameId, levelId }) =>
        Effect.sync(() => {
          ae.writeDataPoint({
            indexes: [gameId],
            blobs: ['daily_attempt', levelId],
            doubles: [],
          })
        }),

      trackAchievement: ({ gameId, achievementId }) =>
        Effect.sync(() => {
          ae.writeDataPoint({
            indexes: [gameId],
            blobs: ['achievement_unlocked', achievementId],
            doubles: [],
          })
        }),
    }
  }),
)
