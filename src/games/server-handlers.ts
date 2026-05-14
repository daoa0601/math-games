import { setResponseHeader } from '@tanstack/react-start/server'
import { Effect, Schema } from 'effect'

import { recordGameProgress } from '@/games/progress/progress.server'
import { savePlayerProfile } from '@/player/profile.server'
import { PlayerProfileInput } from '@/player/profile.schema'
import {
  GameProgressValidationError,
  HeaderService,
  OriginGuardService,
  PlayerIdentityService,
  PlayerProfileValidationError,
  RateLimitService,
} from '@/services'

import { GameProgressRequest } from './game-progress.schema'
import type { GameModule } from './game-module'

function decodeOrFail<TSchema extends Schema.Decoder<unknown>>(
  schema: TSchema,
  raw: unknown,
  toError: (
    message: string,
  ) => GameProgressValidationError | PlayerProfileValidationError,
): Effect.Effect<
  TSchema['Type'],
  GameProgressValidationError | PlayerProfileValidationError
> {
  return Effect.try({
    try: () => Schema.decodeUnknownSync(schema)(raw),
    catch: (e) => toError(e instanceof Error ? e.message : 'Validation failed'),
  })
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
  rawData: unknown,
) {
  return Effect.gen(function* () {
    const data = yield* decodeOrFail(
      GameProgressRequest,
      rawData,
      (msg) => new GameProgressValidationError({ reason: msg }),
    )

    yield* (yield* OriginGuardService).assert()

    yield* (yield* HeaderService).setResponse('cache-control', 'no-store')

    const playerId = yield* (yield* PlayerIdentityService).resolveId()

    yield* (yield* RateLimitService).assert(`record:${module.id}:${playerId}`)

    const result = yield* module.validateAndComputeScore(
      data.levelId,
      data.completion,
    )

    return yield* recordGameProgress({
      playerId,
      gameId: module.id,
      levelId: data.levelId,
      ...result,
    })
  })
}

export function createUpdateProfilePipeline(rawData: unknown) {
  return Effect.gen(function* () {
    const data = yield* Effect.try({
      try: () => Schema.decodeUnknownSync(PlayerProfileInput)(rawData),
      catch: (e) =>
        new PlayerProfileValidationError({
          reason:
            e instanceof Error ? e.message : 'Invalid player profile payload',
        }),
    })

    yield* (yield* OriginGuardService).assert()

    yield* (yield* HeaderService).setResponse('cache-control', 'no-store')

    const playerId = yield* (yield* PlayerIdentityService).resolveId()

    yield* (yield* RateLimitService).assert(`profile:${playerId}`)

    return yield* savePlayerProfile(data)
  })
}
