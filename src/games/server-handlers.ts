import { setResponseHeader } from '@tanstack/react-start/server'
import { Effect } from 'effect'

import { recordGameProgress } from '@/games/progress/progress.server'
import {
  importPlayerAchievements,
  savePlayerProfile,
} from '@/player/profile.server'
import type {
  AchievementImportInput,
  PlayerProfileInput,
} from '@/player/profile.schema'
import {
  AnalyticsService,
  HeaderService,
  KvCacheService,
  OriginGuardService,
  PlayerIdentityService,
  RateLimitService,
  TurnstileService,
  runServerEffect,
} from '@/services'

import type { GameProgressRequest } from './game-progress.schema'
import type { GameModule } from './game-module'

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
  data: GameProgressRequest,
) {
  return Effect.gen(function* () {
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

export function createUpdateProfilePipeline(data: PlayerProfileInput) {
  return Effect.gen(function* () {
    yield* (yield* OriginGuardService).assert()

    yield* (yield* HeaderService).setResponse('cache-control', 'no-store')

    const playerId = yield* (yield* PlayerIdentityService).resolveId()

    yield* (yield* RateLimitService).assert(`profile:${playerId}`)

    return yield* savePlayerProfile(data)
  })
}

export function createImportAchievementsPipeline(data: AchievementImportInput) {
  return Effect.gen(function* () {
    yield* (yield* OriginGuardService).assert()

    yield* (yield* HeaderService).setResponse('cache-control', 'no-store')

    const playerId = yield* (yield* PlayerIdentityService).resolveId()

    yield* (yield* RateLimitService).assert(`achievements:${playerId}`)

    return yield* importPlayerAchievements(data)
  })
}
