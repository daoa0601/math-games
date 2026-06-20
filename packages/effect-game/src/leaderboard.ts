import { and, desc, eq, sql } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { Context, Effect, Layer } from "effect";

import { schema } from "@math-games/db";

import { ProgressWriteError, withD1Retry } from "@math-games/effect-infra";

import { DbService } from "./db";

export interface LeaderboardInput {
  playerId: string;
  gameId: string;
  levelId: string;
  scope: string;
  score: number;
  moves: number;
}

export interface LeaderboardEntry {
  playerId: string;
  displayName: string;
  score: number;
  moves: number;
  achievedAt: Date | null;
}

export interface LeaderboardShape {
  readonly recordEntry: (
    input: LeaderboardInput,
  ) => Effect.Effect<void, ProgressWriteError>;

  /**
   * Atomically upsert every entry in a single D1 batch. Used so a player's
   * personal + classroom leaderboard writes for one submission either all land
   * or none do (and cost one round trip instead of N).
   */
  readonly recordEntries: (
    inputs: LeaderboardInput[],
  ) => Effect.Effect<void, ProgressWriteError>;

  readonly getPersonalBests: (
    playerId: string,
    gameId: string,
  ) => Effect.Effect<
    Array<{ levelId: string; score: number; moves: number }>,
    ProgressWriteError
  >;

  readonly getClassroomLeaderboard: (
    classroomId: string,
    gameId: string,
    levelId: string,
  ) => Effect.Effect<LeaderboardEntry[], ProgressWriteError>;
}

export const LeaderboardService =
  Context.Service<LeaderboardShape>("LeaderboardService");

export const LeaderboardServiceLive = Layer.effect(
  LeaderboardService,
  Effect.map(DbService, ({ db }) => {
    const buildEntryUpsert = (input: LeaderboardInput) =>
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
        });

    const recordEntries = (inputs: LeaderboardInput[]) =>
      inputs.length === 0
        ? Effect.void
        : withD1Retry(
            Effect.tryPromise({
              // drizzle's db.batch signature requires a fixed tuple (for
              // per-statement result inference); for a runtime-sized list we
              // cast through unknown — the standard escape for dynamic batches.
              try: () =>
                db.batch(
                  inputs.map(buildEntryUpsert) as unknown as [
                    BatchItem<"sqlite">,
                    ...BatchItem<"sqlite">[],
                  ],
                ),
              catch: (cause) => new ProgressWriteError({ cause }),
            }),
          ).pipe(Effect.asVoid);

    return {
      // Single-sourced: a one-entry batch is identical to a direct upsert.
      recordEntry: (input) => recordEntries([input]),
      recordEntries,

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
                    eq(schema.leaderboardEntries.scope, "personal"),
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
    };
  }),
);
