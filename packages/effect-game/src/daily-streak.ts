import { and, desc, eq, sql } from 'drizzle-orm'
import { Context, Effect, Layer } from 'effect'

import { schema } from '@math-games/db'

import { ClockService, DailyStreakError, withD1Retry } from '@math-games/effect-infra'

import { DbService } from './db'

export interface StreakInfo {
  current: number
  longest: number
  completedToday: boolean
  lastCompletedDate: string | null
}

export interface DailyCalendarEntry {
  date: string
  gameId: string
  score: number
  completed: boolean
}

export interface DailyCompletionResult {
  saved: boolean
  streak: StreakInfo
}

export interface DailyStreakShape {
  readonly recordDailyCompletion: (input: {
    playerId: string
    challengeDate: string
    gameId: string
    levelId: string
    score: number
    completed: boolean
  }) => Effect.Effect<DailyCompletionResult, DailyStreakError>

  readonly getStreak: (
    playerId: string,
  ) => Effect.Effect<StreakInfo, DailyStreakError>

  readonly getCalendar: (
    playerId: string,
    month: string,
  ) => Effect.Effect<DailyCalendarEntry[], DailyStreakError>
}

export const DailyStreakService =
  Context.Service<DailyStreakShape>('DailyStreakService')

function computeStreak(
  rows: { challengeDate: string; completed: boolean }[],
  today: string,
): StreakInfo {
  let current = 0
  let longest = 0
  let run = 0
  let completedToday = false
  let lastCompletedDate: string | null = null

  const completedDates = new Set<string>()
  for (const row of rows) {
    if (row.completed) {
      completedDates.add(row.challengeDate)
      if (!lastCompletedDate || row.challengeDate > lastCompletedDate) {
        lastCompletedDate = row.challengeDate
      }
    }
  }

  completedToday = completedDates.has(today)

  const sorted = [...completedDates].sort().reverse()
  for (let i = 0; i < sorted.length; i++) {
    const date = sorted[i]
    if (i === 0) {
      const diffFromToday = daysBetween(date, today)
      if (diffFromToday > 1) break
      run = 1
    } else {
      const prev = sorted[i - 1]
      if (daysBetween(date, prev) === 1) {
        run++
      } else {
        break
      }
    }
  }
  current = run

  run = 0
  const ascending = [...completedDates].sort()
  for (let i = 0; i < ascending.length; i++) {
    if (i === 0) {
      run = 1
    } else {
      const prev = ascending[i - 1]
      if (daysBetween(prev, ascending[i]) === 1) {
        run++
      } else {
        run = 1
      }
    }
    if (run > longest) longest = run
  }

  return { current, longest, completedToday, lastCompletedDate }
}

function daysBetween(a: string, b: string): number {
  const msPerDay = 86400000
  return Math.round(
    (new Date(b).getTime() - new Date(a).getTime()) / msPerDay,
  )
}

export const DailyStreakServiceLive = Layer.effect(
  DailyStreakService,
  Effect.all([DbService, ClockService]).pipe(
    Effect.map(([{ db }, clock]) => ({
      recordDailyCompletion: (input) =>
        Effect.gen(function* () {
          yield* withD1Retry(
        Effect.tryPromise({
          try: () =>
            db
              .insert(schema.dailyPlayerResults)
              .values({
                playerId: input.playerId,
                challengeDate: input.challengeDate,
                gameId: input.gameId,
                levelId: input.levelId,
                score: input.score,
                completed: input.completed,
                attempts: 1,
                completedAt: input.completed ? new Date() : undefined,
              })
              .onConflictDoUpdate({
                target: [
                  schema.dailyPlayerResults.playerId,
                  schema.dailyPlayerResults.challengeDate,
                ],
                set: {
                  score: sql`max(${schema.dailyPlayerResults.score}, ${input.score})`,
                  completed: sql`max(${schema.dailyPlayerResults.completed}, ${input.completed ? 1 : 0})`,
                  attempts: sql`${schema.dailyPlayerResults.attempts} + 1`,
                  completedAt: input.completed
                    ? sql`coalesce(${schema.dailyPlayerResults.completedAt}, unixepoch())`
                    : undefined,
                },
              }),
          catch: (cause) => new DailyStreakError({ cause }),
        }),
      )

      const today = yield* clock.dateKey()
      const recentRows = yield* withD1Retry(
        Effect.tryPromise({
          try: () =>
            db
              .select({
                challengeDate: schema.dailyPlayerResults.challengeDate,
                completed: schema.dailyPlayerResults.completed,
              })
              .from(schema.dailyPlayerResults)
              .where(
                eq(schema.dailyPlayerResults.playerId, input.playerId),
              )
              .orderBy(desc(schema.dailyPlayerResults.challengeDate))
              .limit(90),
          catch: (cause) => new DailyStreakError({ cause }),
        }),
      )

      const streak = computeStreak(
        recentRows.map((r) => ({
          challengeDate: r.challengeDate,
          completed: r.completed,
        })),
        today,
      )

      return { saved: true, streak }
    }),

  getStreak: (playerId) =>
    Effect.gen(function* () {
      const today = yield* clock.dateKey()

      const rows = yield* withD1Retry(
        Effect.tryPromise({
          try: () =>
            db
              .select({
                challengeDate: schema.dailyPlayerResults.challengeDate,
                completed: schema.dailyPlayerResults.completed,
              })
              .from(schema.dailyPlayerResults)
              .where(eq(schema.dailyPlayerResults.playerId, playerId))
              .orderBy(desc(schema.dailyPlayerResults.challengeDate))
              .limit(90),
          catch: (cause) => new DailyStreakError({ cause }),
        }),
      )

      return computeStreak(
        rows.map((r) => ({
          challengeDate: r.challengeDate,
          completed: r.completed,
        })),
        today,
      )
    }),

  getCalendar: (playerId, month) =>
    Effect.gen(function* () {
      const rows = yield* withD1Retry(
        Effect.tryPromise({
          try: () =>
            db
              .select({
                date: schema.dailyPlayerResults.challengeDate,
                gameId: schema.dailyPlayerResults.gameId,
                score: schema.dailyPlayerResults.score,
                completed: schema.dailyPlayerResults.completed,
              })
              .from(schema.dailyPlayerResults)
              .where(
                and(
                  eq(schema.dailyPlayerResults.playerId, playerId),
                  sql`${schema.dailyPlayerResults.challengeDate} like ${month + '-%'}`,
                ),
              )
              .orderBy(schema.dailyPlayerResults.challengeDate),
          catch: (cause) => new DailyStreakError({ cause }),
        }),
      )

      return rows.map((r) => ({
        date: r.date,
        gameId: r.gameId,
        score: r.score,
        completed: r.completed,
      }))
    }),
  })),
  ),
)
