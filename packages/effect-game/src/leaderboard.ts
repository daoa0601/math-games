import { and, desc, eq, sql } from 'drizzle-orm'
import { Context, Effect, Layer } from 'effect'

import { schema } from '@math-games/db'

import { ProgressWriteError, withD1Retry } from '@math-games/effect-infra'

import { DbService } from './db'

export interface LeaderboardInput {
  playerId: string
  gameId: string
  levelId: string
  scope: string
  score: number
  moves: number
}

export interface LeaderboardEntry {
  playerId: string
  displayName: string
  score: number
  moves: number
  achievedAt: Date | null
}

export interface LeaderboardShape {
  readonly recordEntry: (
    input: LeaderboardInput,
  ) => Effect.Effect<void, ProgressWriteError>

  readonly getPersonalBests: (
    playerId: string,
    gameId: string,
  ) => Effect.Effect<
    Array<{ levelId: string; score: number; moves: number }>,
    ProgressWriteError
  >

  readonly getClassroomLeaderboard: (
    classroomId: string,
    gameId: string,
    levelId: string,
  ) => Effect.Effect<LeaderboardEntry[], ProgressWriteError>
}

export const LeaderboardService =
  Context.Service<LeaderboardShape>('LeaderboardService')

export const LeaderboardServiceLive = Layer.effect(
  LeaderboardService,
  Effect.map(DbService, ({ db }) => ({
    recordEntry: (input) =>
      withD1Retry(
        Effect.tryPromise({
          try: () =>
            db
              .insert(schema.leaderboardEntries)
              .values({
                playerId: input.playerId,
                gameId: input.gameId,
                levelId: input.levelId,
                scope: input.scope,
                score: input.score,
                moves: input.moves,
              })
              .onConflictDoUpdate({
                target: [
                  schema.leaderboardEntries.playerId,
                  schema.leaderboardEntries.gameId,
                  schema.leaderboardEntries.levelId,
                  schema.leaderboardEntries.scope,
                ],
                set: {
                  score: sql`max(${schema.leaderboardEntries.score}, ${input.score})`,
                  moves: sql`case when ${input.score} > ${schema.leaderboardEntries.score} then ${input.moves} else ${schema.leaderboardEntries.moves} end`,
                  achievedAt: sql`case when ${input.score} > ${schema.leaderboardEntries.score} then unixepoch() else ${schema.leaderboardEntries.achievedAt} end`,
                },
              }),
          catch: (cause) => new ProgressWriteError({ cause }),
        }),
      ).pipe(Effect.asVoid),

    getPersonalBests: (playerId, gameId) =>
      withD1Retry(
        Effect.tryPromise({
          try: () =>
            db
              .select({
                levelId: schema.leaderboardEntries.levelId,
                score: schema.leaderboardEntries.score,
                moves: schema.leaderboardEntries.moves,
              })
              .from(schema.leaderboardEntries)
              .where(
                and(
                  eq(schema.leaderboardEntries.playerId, playerId),
                  eq(schema.leaderboardEntries.gameId, gameId),
                  eq(schema.leaderboardEntries.scope, 'personal'),
                ),
              )
              .orderBy(desc(schema.leaderboardEntries.score)),
          catch: (cause) => new ProgressWriteError({ cause }),
        }),
      ),

    getClassroomLeaderboard: (classroomId, gameId, levelId) =>
      withD1Retry(
        Effect.tryPromise({
          try: () =>
            db
              .select({
                playerId: schema.leaderboardEntries.playerId,
                displayName: schema.players.displayName,
                score: schema.leaderboardEntries.score,
                moves: schema.leaderboardEntries.moves,
                achievedAt: schema.leaderboardEntries.achievedAt,
              })
              .from(schema.leaderboardEntries)
              .innerJoin(
                schema.players,
                eq(schema.leaderboardEntries.playerId, schema.players.id),
              )
              .where(
                and(
                  eq(schema.leaderboardEntries.gameId, gameId),
                  eq(schema.leaderboardEntries.levelId, levelId),
                  eq(schema.leaderboardEntries.scope, classroomId),
                ),
              )
              .orderBy(desc(schema.leaderboardEntries.score))
              .limit(50),
          catch: (cause) => new ProgressWriteError({ cause }),
        }),
      ),
  })),
)
