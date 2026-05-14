import { setResponseHeader } from '@tanstack/react-start/server'
import { Effect } from 'effect'

import { recordGameProgress } from '@/games/progress/progress.server'
import { savePlayerProfile } from '@/player/profile.server'
import type { UpdatePlayerProfileInput } from '@/player/profile.validation'
import {
  GameProgressValidationError,
  OriginGuardService,
  PlayerIdentityService,
  RateLimitService,
} from '@/services'

import type { GameModule } from './game-module'

export interface GameProgressRequest {
  levelId: string
  completion: unknown
}

export function validateGameProgressRequest(
  data: unknown,
): GameProgressRequest {
  if (data === null || typeof data !== 'object') {
    throw new GameProgressValidationError({
      reason: 'Invalid progress payload',
    })
  }

  const obj = data as Record<string, unknown>

  if (typeof obj.levelId !== 'string' || obj.levelId.length === 0) {
    throw new GameProgressValidationError({ reason: 'Invalid levelId' })
  }

  if (obj.completion === undefined || obj.completion === null) {
    throw new GameProgressValidationError({
      reason: 'Missing completion payload',
    })
  }

  return { levelId: obj.levelId, completion: obj.completion }
}

export function createGetCatalogHandler<TModule extends GameModule<any>>(
  module: TModule,
) {
  return (): ReturnType<TModule['getCatalog']> => {
    setResponseHeader('cache-control', 'public, max-age=300')

    return module.getCatalog() as ReturnType<TModule['getCatalog']>
  }
}

export function createRecordProgressPipeline<TModule extends GameModule<any>>(
  module: TModule,
  data: GameProgressRequest,
) {
  return Effect.gen(function* () {
    yield* (yield* OriginGuardService).assert()

    yield* Effect.sync(() => setResponseHeader('cache-control', 'no-store'))

    const playerId = (yield* PlayerIdentityService).getCurrentId()

    yield* (yield* RateLimitService).assert(
      `record:${module.id}:${playerId}`,
    )

    const level = module.resolveLevelConfig(data.levelId)

    if (!level) {
      return yield* new GameProgressValidationError({
        reason: `Unknown level: ${data.levelId}`,
      })
    }

    const validation = module.validateGameState(level, data.completion)

    if (validation === null) {
      return yield* new GameProgressValidationError({
        reason: 'Invalid game state',
      })
    }

    const { completed, moves } = validation
    const score = module.computeScore({ completed, moves })
    const difficulty = level.difficulty
    const extras =
      module.progressExtras?.({
        levelId: data.levelId,
        score,
        completed,
        difficulty,
      }) ?? {}

    return yield* recordGameProgress({
      playerId,
      gameId: module.id,
      levelId: data.levelId,
      score,
      completed,
      difficulty,
      ...extras,
    })
  })
}

export function createUpdateProfilePipeline(data: UpdatePlayerProfileInput) {
  return Effect.gen(function* () {
    yield* (yield* OriginGuardService).assert()

    yield* Effect.sync(() => setResponseHeader('cache-control', 'no-store'))

    const playerId = (yield* PlayerIdentityService).getCurrentId()

    yield* (yield* RateLimitService).assert(`profile:${playerId}`)

    return yield* savePlayerProfile(data)
  })
}
