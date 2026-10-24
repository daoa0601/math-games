import { and, eq } from '@math-games/db'
import { Effect } from 'effect'

import { schema } from '@math-games/db'
import { seedHash } from '@/daily/daily.strategy'
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
  ClockService,
  DailyChallengeError,
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

import {
  buildAttemptDiagnostics,
  GameProgressValidationError,
  toClientCatalog,
} from '@math-games/core'
import type { GameModule, GameProgressRequest } from '@math-games/core'

const CATALOG_CACHE_TTL = 3600

// Keyed by the catalog's content as well as the game id: after a deploy that
// changes the level set, a warm entry from the previous deploy would otherwise
// keep serving level ids the server no longer resolves for the rest of the TTL.
export function catalogCacheKey(moduleId: string, catalog: unknown): string {
  return `catalog:${moduleId}:${seedHash(JSON.stringify(catalog)).toString(36)}`
}

// One key per module per isolate; the catalog is static for a deploy.
const catalogKeys = new WeakMap<GameModule<any>, string>()

export function createGetCatalogEffect<TModule extends GameModule<any>>(
  module: TModule,
) {
  type Catalog = ReturnType<TModule['getCatalog']>

  return Effect.gen(function* () {
    yield* (yield* HeaderService).setResponse(
      'cache-control',
      'public, max-age=300',
    )

    const kvCache = yield* KvCacheService

    // Strip SERVER-ONLY manifest fields (solution traces/hints) before the
    // catalog is cached or sent to the browser.
    const buildCatalog = () => toClientCatalog(module.getCatalog()) as Catalog

    let built: Catalog | undefined
    let cacheKey = catalogKeys.get(module)
    if (cacheKey === undefined) {
      built = buildCatalog()
      cacheKey = catalogCacheKey(module.id, built)
      catalogKeys.set(module, cacheKey)
    }

    const cached = yield* kvCache.get<Catalog>(cacheKey)
    if (cached) return cached

    const catalog = built ?? buildCatalog()
    yield* kvCache.put(cacheKey, catalog, CATALOG_CACHE_TTL)

    return catalog
  })
}

export function createGetCatalogHandler<TModule extends GameModule<any>>(
  module: TModule,
) {
  return () => runServerEffect(createGetCatalogEffect(module))
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

    const dailyChallengeDate = data.challengeDate
    if (dailyChallengeDate) {
      yield* assertDailySelection({
        playerId,
        challengeDate: dailyChallengeDate,
        gameId: module.id,
        levelId: data.levelId,
      })
    }

    const { feedback, manifest, ...progressResult } = result

    const progress = yield* recordGameProgress({
      playerId,
      gameId: module.id,
      levelId: data.levelId,
      skillTags: manifest?.skillTags,
      ...progressResult,
    })

    // Log the level's diagnostic tags (skills/misconceptions it exercises) so
    // attempts are keyed to skills for mastery achievements and teacher
    // misconception summaries.
    const diagnostics = buildAttemptDiagnostics(manifest)

    const attemptsService = yield* GameAttemptsService
    yield* attemptsService.record({
      playerId,
      gameId: module.id,
      levelId: data.levelId,
      score: result.score,
      completed: result.completed,
      moves: result.moves,
      mode: dailyChallengeDate ? 'daily' : 'practice',
      completionJson: diagnostics ? JSON.stringify(diagnostics) : undefined,
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

    if (dailyChallengeDate) {
      const streakService = yield* DailyStreakService
      yield* streakService.recordDailyCompletion({
        playerId,
        challengeDate: dailyChallengeDate,
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

    return { ...progress, feedback, rankUp }
  })
}

function assertDailySelection(input: {
  playerId: string
  challengeDate: string
  gameId: string
  levelId: string
}) {
  return Effect.gen(function* () {
    const today = yield* (yield* ClockService).dateKey()
    if (input.challengeDate !== today) {
      return yield* new GameProgressValidationError({
        reason: "Daily challenge submissions must use today's assigned level.",
      })
    }

    const { db } = yield* DbService
    const rows = yield* withD1Retry(
      Effect.tryPromise({
        try: () =>
          db
            .select({
              gameId: schema.playerDailySelections.gameId,
              levelId: schema.playerDailySelections.levelId,
            })
            .from(schema.playerDailySelections)
            .where(
              and(
                eq(schema.playerDailySelections.playerId, input.playerId),
                eq(
                  schema.playerDailySelections.challengeDate,
                  input.challengeDate,
                ),
              ),
            )
            .limit(1),
        catch: (cause) => new DailyChallengeError({ cause }),
      }),
    )

    const row = rows.at(0)
    if (!row || row.gameId !== input.gameId || row.levelId !== input.levelId) {
      return yield* new GameProgressValidationError({
        reason: "Daily challenge does not match today's assigned level.",
      })
    }
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

    // One atomic batch: personal scope + every classroom the player belongs
    // to. Replaces the prior personal-then-per-classroom loop (N+1 round
    // trips, non-atomic).
    const leaderboard = yield* LeaderboardService
    yield* leaderboard.recordEntries([
      { ...entry, scope: 'personal' },
      ...classroomRows.map((row) => ({ ...entry, scope: row.classroomId })),
    ])
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
