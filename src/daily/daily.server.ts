import { eq } from 'drizzle-orm'
import { Effect } from 'effect'

import { schema } from '@/db'
import { DailyChallengeError, DbService } from '@/services'

import {
  getUtcDateKey,
  parseDailyChallengeConfig,
  planDailyChallenge,
} from './daily.logic'
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

export function loadDailyChallenge(date = new Date()) {
  return Effect.gen(function* () {
    const { db } = yield* DbService
    const dateKey = getUtcDateKey(date)

    const existing = yield* Effect.tryPromise({
      try: () =>
        db
          .select()
          .from(schema.dailyChallenges)
          .where(eq(schema.dailyChallenges.challengeDate, dateKey))
          .limit(1),
      catch: (cause) => new DailyChallengeError({ cause }),
    })

    const existingRow = existing.at(0)

    if (existingRow) return toDailyChallengeRecord(existingRow)

    const planned = planDailyChallenge(dateKey)

    const inserted = yield* Effect.tryPromise({
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
    })

    const insertedRow = inserted.at(0)

    if (insertedRow) return toDailyChallengeRecord(insertedRow)

    const winner = yield* Effect.tryPromise({
      try: () =>
        db
          .select()
          .from(schema.dailyChallenges)
          .where(eq(schema.dailyChallenges.challengeDate, dateKey))
          .limit(1),
      catch: (cause) => new DailyChallengeError({ cause }),
    })

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
