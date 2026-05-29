import { describe, it, expect } from 'vitest'
import { Effect, Exit, Layer } from 'effect'

import { KvCacheService } from '@math-games/effect-infra'
import type { KvCacheShape } from '@math-games/effect-infra'
import { getShapeArchitectCatalog } from '@math-games/game-shape-architect'
import type { LevelSolution } from '@math-games/game-shape-architect'

import { createSolveLevelEffect } from './shape-architect.server'
import { solutionCacheKey } from './shape-architect-solution-cache'

const levelId = getShapeArchitectCatalog().configs[0].id

function cacheLayer(initial: Record<string, unknown> = {}) {
  const store = new Map<string, unknown>(Object.entries(initial))
  const shape: KvCacheShape = {
    get: <T>(key: string) =>
      Effect.sync(() => (store.has(key) ? (store.get(key) as T) : null)),
    put: <T>(key: string, value: T, _ttlSeconds: number) =>
      Effect.sync(() => {
        store.set(key, value)
      }),
    delete: (key: string) =>
      Effect.sync(() => {
        store.delete(key)
      }),
  }
  return { layer: Layer.succeed(KvCacheService, shape), store }
}

describe('createSolveLevelEffect', () => {
  it('solves on a cache miss and writes the result through', async () => {
    const { layer, store } = cacheLayer()

    const solution = await Effect.runPromise(
      createSolveLevelEffect({ levelId }).pipe(Effect.provide(layer)),
    )

    expect(solution).not.toBeNull()
    expect((solution as LevelSolution).levelId).toBe(levelId)
    expect((solution as LevelSolution).steps.length).toBeGreaterThan(0)
    expect(store.has(solutionCacheKey(levelId))).toBe(true)
  })

  it('returns the cached solution without re-solving', async () => {
    const cached: LevelSolution = {
      levelId,
      type: '2D',
      steps: [],
      metrics: {
        pieceCount: 0,
        cellCount: 0,
        searchedStates: 0,
        timeMs: 0,
        algorithm: 'dlx',
      },
      solvedAt: '2026-01-01T00:00:00.000Z',
    }
    const { layer } = cacheLayer({ [solutionCacheKey(levelId)]: cached })

    const result = await Effect.runPromise(
      createSolveLevelEffect({ levelId }).pipe(Effect.provide(layer)),
    )

    expect(result).toEqual(cached)
  })

  it('fails for an unknown level', async () => {
    const { layer } = cacheLayer()

    const exit = await Effect.runPromiseExit(
      createSolveLevelEffect({ levelId: 'does-not-exist' }).pipe(
        Effect.provide(layer),
      ),
    )

    expect(Exit.isFailure(exit)).toBe(true)
  })
})
