import { describe, it, expect } from 'vitest'
import { Effect } from 'effect'

import type { KvCacheShape } from '@math-games/effect-infra'
import type { LevelSolution } from '@math-games/game-shape-architect'

import {
  SOLUTION_CACHE_TTL,
  readCachedSolution,
  solutionCacheKey,
  writeCachedSolution,
} from './shape-architect-solution-cache'

function makeInMemoryCache() {
  const store = new Map<string, unknown>()
  const ttls = new Map<string, number>()
  const cache: KvCacheShape = {
    get: <T>(key: string) =>
      Effect.sync(() => (store.has(key) ? (store.get(key) as T) : null)),
    put: <T>(key: string, value: T, ttlSeconds: number) =>
      Effect.sync(() => {
        store.set(key, value)
        ttls.set(key, ttlSeconds)
      }),
    delete: (key: string) =>
      Effect.sync(() => {
        store.delete(key)
      }),
  }
  return { cache, ttls }
}

const sample: LevelSolution = {
  levelId: 'catalog_easy_starter-fitted-blocks',
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

describe('shape-architect solution cache', () => {
  it('namespaces the cache key', () => {
    expect(solutionCacheKey('abc')).toBe('sa:solution:abc')
  })

  it('round-trips a solution and applies the shared TTL', () => {
    const { cache, ttls } = makeInMemoryCache()

    Effect.runSync(writeCachedSolution(cache, sample))
    const read = Effect.runSync(readCachedSolution(cache, sample.levelId))

    expect(read).toEqual(sample)
    expect(ttls.get(solutionCacheKey(sample.levelId))).toBe(SOLUTION_CACHE_TTL)
  })

  it('returns null on a miss', () => {
    const { cache } = makeInMemoryCache()
    expect(Effect.runSync(readCachedSolution(cache, 'missing'))).toBeNull()
  })
})
