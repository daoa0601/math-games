import { Context, Effect, Layer } from 'effect'

import { solvePuzzle } from '@/games/ShapeArchitect/logic/solver'
import { solvePuzzleDLX } from '@/games/ShapeArchitect/logic/dlx-solver'
import type { LevelConfig } from '@/games/ShapeArchitect/logic/types'

import { SolverTimeoutError } from './errors'

export interface SolverShape {
  readonly solve: (
    level: LevelConfig,
    options?: { maxTimeMs?: number; algorithm?: 'backtrack' | 'dlx' },
  ) => Effect.Effect<
    {
      solvable: boolean
      solution?: unknown
      searchedStates: number
      timeMs: number
      timedOut: boolean
    },
    SolverTimeoutError
  >
}

export const SolverService = Context.Service<SolverShape>('SolverService')

export const SolverServiceLive = Layer.succeed(SolverService, {
  solve: (level, options) =>
    Effect.gen(function* () {
      const maxTimeMs = options?.maxTimeMs ?? 5000
      const solver =
        options?.algorithm === 'dlx' ? solvePuzzleDLX : solvePuzzle

      const result = yield* Effect.tryPromise({
        try: () => Promise.resolve(solver(level, maxTimeMs)),
        catch: () =>
          new SolverTimeoutError({ searchedStates: 0, timeMs: maxTimeMs }),
      })

      if (result.timedOut) {
        return yield* new SolverTimeoutError({
          searchedStates: result.searchedStates,
          timeMs: result.timeMs,
        })
      }

      return result
    }),
})
