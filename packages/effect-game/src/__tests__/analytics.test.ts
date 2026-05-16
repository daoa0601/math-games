import { Effect, Layer } from 'effect'
import { describe, expect, it } from 'vitest'

import { WorkerEnvService } from '@math-games/effect-infra'

import { AnalyticsService, AnalyticsServiceLive } from '../analytics'

interface DataPoint {
  indexes: string[]
  blobs: string[]
  doubles: number[]
}

function createHarness() {
  const dataPoints: DataPoint[] = []

  const envLayer = Layer.succeed(WorkerEnvService, {
    getD1: () => ({}) as never,
    getKV: () => ({}) as never,
    getAnalytics: () => ({
      writeDataPoint: (point: DataPoint) => {
        dataPoints.push(point)
      },
    }),
    getR2: () => ({}) as never,
    getTurnstileSecret: () => undefined,
  })

  const layer = AnalyticsServiceLive.pipe(Layer.provide(envLayer))

  return {
    run: <T, R>(effect: Effect.Effect<T, never, R>) =>
      Effect.runPromise(effect.pipe(Effect.provide(layer) as never)),
    dataPoints,
  }
}

describe('AnalyticsService', () => {
  it('trackGameComplete writes a data point with game_complete blob', async () => {
    const { run, dataPoints } = createHarness()

    await run(
      Effect.gen(function* () {
        const analytics = yield* AnalyticsService
        yield* analytics.trackGameComplete({
          gameId: 'magic-graph',
          levelId: 'level-3',
          score: 850,
          completed: true,
        })
      }),
    )

    expect(dataPoints.length).toBe(1)
    expect(dataPoints[0].indexes).toEqual(['magic-graph'])
    expect(dataPoints[0].blobs[0]).toBe('game_complete')
    expect(dataPoints[0].blobs[1]).toBe('level-3')
    expect(dataPoints[0].blobs[2]).toBe('true')
    expect(dataPoints[0].doubles).toEqual([850])
  })

  it('trackGameComplete records false for incomplete games', async () => {
    const { run, dataPoints } = createHarness()

    await run(
      Effect.gen(function* () {
        const analytics = yield* AnalyticsService
        yield* analytics.trackGameComplete({
          gameId: 'sequence-race',
          levelId: 'level-1',
          score: 200,
          completed: false,
        })
      }),
    )

    expect(dataPoints[0].blobs[2]).toBe('false')
  })

  it('trackDailyAttempt writes a daily_attempt data point', async () => {
    const { run, dataPoints } = createHarness()

    await run(
      Effect.gen(function* () {
        const analytics = yield* AnalyticsService
        yield* analytics.trackDailyAttempt({
          gameId: 'shape-architect',
          levelId: 'daily-2025-01-15',
        })
      }),
    )

    expect(dataPoints.length).toBe(1)
    expect(dataPoints[0].indexes).toEqual(['shape-architect'])
    expect(dataPoints[0].blobs[0]).toBe('daily_attempt')
    expect(dataPoints[0].blobs[1]).toBe('daily-2025-01-15')
    expect(dataPoints[0].doubles).toEqual([])
  })

  it('trackAchievement writes an achievement_unlocked data point', async () => {
    const { run, dataPoints } = createHarness()

    await run(
      Effect.gen(function* () {
        const analytics = yield* AnalyticsService
        yield* analytics.trackAchievement({
          gameId: 'magic-graph',
          achievementId: 'first-perfect-score',
        })
      }),
    )

    expect(dataPoints.length).toBe(1)
    expect(dataPoints[0].indexes).toEqual(['magic-graph'])
    expect(dataPoints[0].blobs[0]).toBe('achievement_unlocked')
    expect(dataPoints[0].blobs[1]).toBe('first-perfect-score')
    expect(dataPoints[0].doubles).toEqual([])
  })

  it('accumulates multiple data points across calls', async () => {
    const { run, dataPoints } = createHarness()

    await run(
      Effect.gen(function* () {
        const analytics = yield* AnalyticsService
        yield* analytics.trackGameComplete({
          gameId: 'magic-graph',
          levelId: 'l1',
          score: 100,
          completed: true,
        })
        yield* analytics.trackDailyAttempt({
          gameId: 'magic-graph',
          levelId: 'daily',
        })
        yield* analytics.trackAchievement({
          gameId: 'magic-graph',
          achievementId: 'ach-1',
        })
      }),
    )

    expect(dataPoints.length).toBe(3)
  })
})
