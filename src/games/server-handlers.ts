import { setResponseHeader } from '@tanstack/react-start/server'
import { Effect, Schema } from 'effect'

import { recordGameProgress } from '@/games/progress/progress.server'
import {
  importPlayerAchievements,
  savePlayerProfile,
} from '@/player/profile.server'
import {
  AchievementImportInput,
  PlayerProfileInput,
} from '@/player/profile.schema'
import {
  AnalyticsService,
  GameProgressValidationError,
  HeaderService,
  KvCacheService,
  OriginGuardService,
  PlayerIdentityService,
  PlayerProfileValidationError,
  RateLimitService,
  TurnstileService,
  runServerEffect,
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

const CATALOG_CACHE_TTL = 3600

export function createGetCatalogHandler<TModule extends GameModule<any>>(
  module: TModule,
) {
  type Catalog = ReturnType<TModule['getCatalog']>

  return () => {
    setResponseHeader('cache-control', 'public, max-age=300')

    return runServerEffect(
      Effect.gen(function* () {
        const kvCache = yield* KvCacheService

        const cached = yield* kvCache.get<Catalog>(`catalog:${module.id}`)
        if (cached) return cached

        const catalog = module.getCatalog() as Catalog

        yield* kvCache.put(`catalog:${module.id}`, catalog, CATALOG_CACHE_TTL)

        return catalog
      }),
    )
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

    if (data.turnstileToken !== undefined && data.turnstileToken !== '') {
      yield* (yield* TurnstileService).verify(data.turnstileToken)
    }

    const playerId = yield* (yield* PlayerIdentityService).resolveId()

    const rateLimiter = yield* RateLimitService
    yield* rateLimiter.assert(`record:${module.id}:${playerId}`)
    yield* rateLimiter.assertHourlyLimit(`progress:${playerId}`, 200)

    const result = yield* module.validateAndComputeScore(
      data.levelId,
      data.completion,
    )

    const progress = yield* recordGameProgress({
      playerId,
      gameId: module.id,
      levelId: data.levelId,
      ...result,
    })

    const analytics = yield* AnalyticsService
    yield* analytics.trackGameComplete({
      gameId: module.id,
      levelId: data.levelId,
      score: result.score,
      completed: result.completed,
    })

    for (const achievementId of progress.unlockedAchievements) {
      yield* analytics.trackAchievement({ gameId: module.id, achievementId })
    }

    return progress
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

export function createImportAchievementsPipeline(rawData: unknown) {
  return Effect.gen(function* () {
    const data = yield* Effect.try({
      try: () => Schema.decodeUnknownSync(AchievementImportInput)(rawData),
      catch: (e) =>
        new PlayerProfileValidationError({
          reason: e instanceof Error ? e.message : 'Invalid achievement import',
        }),
    })

    yield* (yield* OriginGuardService).assert()

    yield* (yield* HeaderService).setResponse('cache-control', 'no-store')

    const playerId = yield* (yield* PlayerIdentityService).resolveId()

    yield* (yield* RateLimitService).assert(`achievements:${playerId}`)

    return yield* importPlayerAchievements(data)
  })
}
