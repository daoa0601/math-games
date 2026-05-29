import { eq } from '@math-games/db'
import { Effect } from 'effect'

import { schema } from '@math-games/db'
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
  HeaderService,
  KvCacheService,
  OriginGuardService,
  ProgressWriteError,
  RateLimitService,
  TurnstileService,
  withD1Retry,
} from '@math-games/effect-infra'
import {
  AnalyticsService,
  DailyStreakService,
  DbService,
  GameAttemptsService,
  LeaderboardService,
  PlayerIdentityService,
  RankService,
} from '@math-games/effect-game'
import { runServerEffect } from '@/services/run-server-effect'

import { toClientCatalog } from '@math-games/core'
import type { GameModule, GameProgressRequest } from '@math-games/core'

const CATALOG_CACHE_TTL = 3600

export function createGetCatalogHandler<TModule extends GameModule<any>>(
  module: TModule,
) {
  type Catalog = ReturnType<TModule['getCatalog']>

  return () =>
    runServerEffect(
      Effect.gen(function* () {
        yield* (yield* HeaderService).setResponse(
          'cache-control',
          'public, max-age=300',
        )

        const kvCache = yield* KvCacheService

        const cached = yield* kvCache.get<Catalog>(`catalog:${module.id}`)
        if (cached) return cached

        // Strip SERVER-ONLY manifest fields (solution traces/hints) before the
        // catalog is cached or sent to the browser.
        const catalog = toClientCatalog(module.getCatalog()) as Catalog

        yield* kvCache.put(`catalog:${module.id}`, catalog, CATALOG_CACHE_TTL)

        return catalog
      }),
    )
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

    const attemptsService = yield* GameAttemptsService
    yield* attemptsService.record({
      playerId,
      gameId: module.id,
      levelId: data.levelId,
      score: result.score,
      completed: result.completed,
      moves: result.moves,
      mode: data.challengeDate ? 'daily' : 'practice',
      completionJson: JSON.stringify(data.completion),
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

    if (data.challengeDate) {
      const streakService = yield* DailyStreakService
      yield* streakService.recordDailyCompletion({
        playerId,
        challengeDate: data.challengeDate,
        gameId: module.id,
        levelId: data.levelId,
        score: result.score,
        completed: result.completed,
      })
    }

    const wasNewCompletion =
      result.completed &&
      progress.completedAt !== null &&
      progress.attempts === 1

    const rankService = yield* RankService
    const { rankUp } = yield* rankService.computeRankDelta({
      playerId,
      newCompletions: wasNewCompletion ? 1 : 0,
      newAchievements: progress.unlockedAchievements.length,
    })

    yield* recordLeaderboardEntries({
      playerId,
      gameId: module.id,
      levelId: data.levelId,
      score: result.score,
      moves: result.moves,
    })

    return { ...progress, feedback: result.feedback, rankUp }
  })
}

function recordLeaderboardEntries(entry: {
  playerId: string
  gameId: string
  levelId: string
  score: number
  moves: number
}) {
  return Effect.gen(function* () {
    const leaderboard = yield* LeaderboardService
    yield* leaderboard.recordEntry({ ...entry, scope: 'personal' })

    const { db } = yield* DbService
    const classroomRows = yield* withD1Retry(
      Effect.tryPromise({
        try: () =>
          db
            .select({ classroomId: schema.classroomMembers.classroomId })
            .from(schema.classroomMembers)
            .where(eq(schema.classroomMembers.playerId, entry.playerId)),
        catch: (cause) => new ProgressWriteError({ cause }),
      }),
    )
    for (const row of classroomRows) {
      yield* leaderboard.recordEntry({ ...entry, scope: row.classroomId })
    }
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
