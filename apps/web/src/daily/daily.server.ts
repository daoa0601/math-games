import { and, eq, sql } from '@math-games/db'
import { Effect } from 'effect'

import { schema } from '@math-games/db'
import {
  ClockService,
  DailyChallengeError,
  KvCacheService,
  withD1Retry,
} from '@math-games/effect-infra'
import {
  DbService,
  GameAttemptsService,
  PlayerIdentityService,
} from '@math-games/effect-game'

import { parseDailyChallengeConfig, planDailyChallenge } from './daily.logic'
import type { DailyChallengeConfig } from './daily.logic'

export interface DailyChallengeRecord extends DailyChallengeConfig {
  playerId: string
  challengeDate: string
  seed: string
}

function toDailyChallengeRecord(
  row: typeof schema.playerDailySelections.$inferSelect,
): DailyChallengeRecord {
  return {
    ...parseDailyChallengeConfig(row.configJson),
    playerId: row.playerId,
    challengeDate: row.challengeDate,
    seed: row.seed,
  }
}

function loadDailyChallengeForPlayer(playerId: string, dateKey: string) {
  return Effect.gen(function* () {
    const { db } = yield* DbService

    const readExisting = () =>
      withD1Retry(
        Effect.tryPromise({
          try: () =>
            db
              .select()
              .from(schema.playerDailySelections)
              .where(
                and(
                  eq(schema.playerDailySelections.playerId, playerId),
                  eq(schema.playerDailySelections.challengeDate, dateKey),
                ),
              )
              .limit(1),
          catch: (cause) => new DailyChallengeError({ cause }),
        }),
      )

    const existingRow = (yield* readExisting()).at(0)
    if (existingRow) return toDailyChallengeRecord(existingRow)

    const perGameStats = yield* (yield* GameAttemptsService).getPerGameStats(
      playerId,
    )
    const planned = planDailyChallenge(dateKey, playerId, perGameStats)

    const inserted = yield* withD1Retry(
      Effect.tryPromise({
        try: () =>
          db
            .insert(schema.playerDailySelections)
            .values({
              playerId,
              challengeDate: planned.challengeDate,
              gameId: planned.gameId,
              levelId: planned.levelId,
              seed: planned.seed,
              configJson: planned.configJson,
            })
            .onConflictDoNothing()
            .returning(),
        catch: (cause) => new DailyChallengeError({ cause }),
      }),
    )

    const insertedRow = inserted.at(0)
    if (insertedRow) return toDailyChallengeRecord(insertedRow)

    // A parallel load won the insert (composite PK) — read its row.
    const winnerRow = (yield* readExisting()).at(0)
    if (!winnerRow) {
      return yield* new DailyChallengeError({
        cause: new Error(
          `Daily selection insert raced but no row for ${playerId} ${dateKey}`,
        ),
      })
    }
    return toDailyChallengeRecord(winnerRow)
  })
}

const DAILY_CACHE_TTL = 86400

export function loadDailyChallenge() {
  return Effect.gen(function* () {
    const { db } = yield* DbService
    const identity = yield* (yield* PlayerIdentityService).resolve()

    // FK safety: player_daily_selections references players.id, and this loader
    // can run before the profile loader (both fire in parallel). Idempotent
    // upsert mirrors loadPlayerProfileOverview.
    yield* withD1Retry(
      Effect.tryPromise({
        try: () =>
          db
            .insert(schema.players)
            .values(identity)
            .onConflictDoUpdate({
              target: schema.players.id,
              set: { updatedAt: sql`(unixepoch())` },
            }),
        catch: (cause) => new DailyChallengeError({ cause }),
      }),
    )

    const kvCache = yield* KvCacheService
    const dateKey = yield* (yield* ClockService).dateKey()
    const cacheKey = `daily:${dateKey}:${identity.id}`

    const cached = yield* kvCache.get<DailyChallengeRecord>(cacheKey)
    if (cached) return cached

    const record = yield* loadDailyChallengeForPlayer(identity.id, dateKey)

    yield* kvCache.put(cacheKey, record, DAILY_CACHE_TTL)

    return record
  })
}
