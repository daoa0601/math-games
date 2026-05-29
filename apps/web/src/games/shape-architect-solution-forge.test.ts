import { describe, it, expect } from 'vitest'

import { getShapeArchitectCatalog } from '@math-games/game-shape-architect'
import type { LevelSolution } from '@math-games/game-shape-architect'

import {
  buildPracticePoolSpecs,
  forgePracticePool,
  forgeShapeArchitectSolutions,
} from './shape-architect-solution-forge'
import type { ForgeKv } from './shape-architect-solution-forge'
import { solutionCacheKey } from './shape-architect-solution-cache'

function makeKv() {
  const store = new Map<string, string>()
  const kv: ForgeKv = {
    get: (key) => Promise.resolve(store.get(key) ?? null),
    put: (key, value) => {
      store.set(key, value)
      return Promise.resolve()
    },
  }
  return { kv, store }
}

const catalogIds = getShapeArchitectCatalog().configs.map((config) => config.id)

describe('forgeShapeArchitectSolutions', () => {
  it('solves and caches every catalog level on the first run', async () => {
    const { kv, store } = makeKv()

    const report = await forgeShapeArchitectSolutions(kv)

    expect(report.solved.sort()).toEqual([...catalogIds].sort())
    expect(report.cached).toEqual([])
    expect(report.failed).toEqual([])

    // Every level now has a parseable solution stored under its key.
    for (const id of catalogIds) {
      const raw = store.get(solutionCacheKey(id))
      expect(raw).toBeTypeOf('string')
      const solution = JSON.parse(raw!) as LevelSolution
      expect(solution.levelId).toBe(id)
      expect(solution.steps.length).toBeGreaterThan(0)
    }
  })

  it('skips levels that are already cached on a second run', async () => {
    const { kv } = makeKv()

    await forgeShapeArchitectSolutions(kv)
    const second = await forgeShapeArchitectSolutions(kv)

    expect(second.cached.sort()).toEqual([...catalogIds].sort())
    expect(second.solved).toEqual([])
    expect(second.failed).toEqual([])
  })
})

describe('buildPracticePoolSpecs', () => {
  it('expands to perDifficulty seeds across each difficulty', () => {
    const specs = buildPracticePoolSpecs(3, ['easy', 'hard'])

    expect(specs).toHaveLength(6)
    expect(specs.filter((spec) => spec.difficulty === 'easy')).toHaveLength(3)
    expect(specs.map((spec) => spec.seed)).toContain('pool-1')
    expect(specs.map((spec) => spec.seed)).toContain('pool-3')
  })
})

describe('forgePracticePool', () => {
  it('solves and caches each practice spec, then treats them as cached', async () => {
    const { kv } = makeKv()
    const specs = buildPracticePoolSpecs(2, ['easy', 'medium'])

    const first = await forgePracticePool(specs, kv)
    expect(first.solved).toHaveLength(specs.length)
    expect(first.failed).toEqual([])

    const second = await forgePracticePool(specs, kv)
    expect(second.cached.sort()).toEqual([...first.solved].sort())
    expect(second.solved).toEqual([])
  })
})
