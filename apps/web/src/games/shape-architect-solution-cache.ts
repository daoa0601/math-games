import type { KvCacheShape } from '@math-games/effect-infra'
import {
  SOLUTION_CACHE_TTL,
  solutionCacheKey,
} from '@math-games/game-shape-architect'
import type { LevelSolution } from '@math-games/game-shape-architect'

// Effect-native read/write over the app's KvCacheService, keyed by the shared
// package contract (solutionCacheKey/SOLUTION_CACHE_TTL) so the lazy server
// function and the eager level-forge worker read and write the same slots.

export { SOLUTION_CACHE_TTL, solutionCacheKey }

export function readCachedSolution(cache: KvCacheShape, levelId: string) {
  return cache.get<LevelSolution>(solutionCacheKey(levelId))
}

export function writeCachedSolution(
  cache: KvCacheShape,
  solution: LevelSolution,
) {
  return cache.put(
    solutionCacheKey(solution.levelId),
    solution,
    SOLUTION_CACHE_TTL,
  )
}
