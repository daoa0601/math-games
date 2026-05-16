import { eq } from '@math-games/db'
import { Effect } from 'effect'

import { schema } from '@math-games/db'
import {
  ClockService,
  DailyChallengeError,
  DbService,
  KvCacheService,
} from '@math-games/services'
import { withD1Retry } from '@math-games/services'

import { parseDailyChallengeConfig, planDailyChallenge } from './daily.logic'
import type { DailyChallengeConfig } from './daily.logic'

export interface DailyChallengeRecord extends DailyChallengeConfig {
  challengeDate: string
  seed: string
}

function toDailyChallengeRecord(
  row: typeof schema.dailyChallenges.$inferSelect,
): DailyChallengeRecord {
  return {
    ...parseDailyChallengeConfig(row.configJson),
    challengeDate: row.challengeDate,
    seed: row.seed,
  }
}

function loadDailyChallengeFromD1() {
  return Effect.gen(function* () {
    const { db } = yield* DbService
    const dateKey = yield* (yield* ClockService).dateKey()

    const existing = yield* withD1Retry(
      Effect.tryPromise({
        try: () =>
          db
            .select()
            .from(schema.dailyChallenges)
            .where(eq(schema.dailyChallenges.challengeDate, dateKey))
            .limit(1),
        catch: (cause) => new DailyChallengeError({ cause }),
      }),
    )

    const existingRow = existing.at(0)

    if (existingRow) return toDailyChallengeRecord(existingRow)

    const planned = yield* Effect.promise(() => planDailyChallenge(dateKey))

    const inserted = yield* withD1Retry(
      Effect.tryPromise({
        try: () =>
          db
            .insert(schema.dailyChallenges)
            .values({
              challengeDate: planned.challengeDate,
              gameId: planned.gameId,
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

    const winner = yield* withD1Retry(
      Effect.tryPromise({
        try: () =>
          db
            .select()
            .from(schema.dailyChallenges)
            .where(eq(schema.dailyChallenges.challengeDate, dateKey))
            .limit(1),
        catch: (cause) => new DailyChallengeError({ cause }),
      }),
    )

    const winnerRow = winner.at(0)

    if (!winnerRow) {
      return yield* new DailyChallengeError({
        cause: new Error(
          `Daily challenge insert raced but no row found for ${dateKey}`,
        ),
      })
    }

    return toDailyChallengeRecord(winnerRow)
  })
}

const DAILY_CACHE_TTL = 86400

export function loadDailyChallenge() {
  return Effect.gen(function* () {
    const kvCache = yield* KvCacheService
    const dateKey = yield* (yield* ClockService).dateKey()
    const cacheKey = `daily:${dateKey}`

    const cached = yield* kvCache.get<DailyChallengeRecord>(cacheKey)
    if (cached) return cached

    const record = yield* loadDailyChallengeFromD1()

    yield* kvCache.put(cacheKey, record, DAILY_CACHE_TTL)

    return record
  })
}
