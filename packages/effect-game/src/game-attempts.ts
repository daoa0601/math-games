import { and, avg, count, eq, max, sql } from "drizzle-orm";
import { Context, Effect, Layer } from "effect";

import { schema } from "@math-games/db";

import { GameAttemptsError, withD1Retry } from "@math-games/effect-infra";

import { DbService } from "./db";

export interface AttemptInput {
  playerId: string;
  gameId: string;
  levelId: string;
  score: number;
  completed: boolean;
  moves: number;
  durationMs?: number;
  mode: "practice" | "daily";
  completionJson?: string;
}

export interface Attempt {
  id: string;
  score: number;
  completed: boolean;
  moves: number;
  durationMs: number | null;
  mode: string;
  createdAt: Date | null;
}

export interface GameStats {
  totalAttempts: number;
  completionRate: number;
  averageScore: number;
  averageMoves: number;
  bestScoreByLevel: Record<string, number>;
}

export interface PerGameStatRow {
  gameId: string;
  attempts: number;
  /** 0..1 completed/attempts for this game. */
  completionRate: number;
}

export interface GameAttemptsShape {
  readonly record: (
    input: AttemptInput,
  ) => Effect.Effect<void, GameAttemptsError>;

  readonly getHistory: (
    playerId: string,
    gameId: string,
    levelId: string,
  ) => Effect.Effect<Attempt[], GameAttemptsError>;

  readonly getStats: (
    playerId: string,
    gameId: string,
  ) => Effect.Effect<GameStats, GameAttemptsError>;

  readonly getPerGameStats: (
    playerId: string,
  ) => Effect.Effect<PerGameStatRow[], GameAttemptsError>;
}

export const GameAttemptsService = Context.Service<GameAttemptsShape>(
  "GameAttemptsService",
);

function generateId(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export const GameAttemptsServiceLive = Layer.effect(
  GameAttemptsService,
  Effect.map(DbService, ({ db }) => ({
    record: (input) =>
      withD1Retry(
        Effect.tryPromise({
          try: () =>
            db.insert(schema.gameAttempts).values({
              id: generateId(),
              playerId: input.playerId,
              gameId: input.gameId,
              levelId: input.levelId,
              score: input.score,
              completed: input.completed,
              moves: input.moves,
              durationMs: input.durationMs,
              mode: input.mode,
              completionJson: input.completionJson,
            }),
          catch: (cause) => new GameAttemptsError({ cause }),
        }),
      ).pipe(Effect.asVoid),

    getHistory: (playerId, gameId, levelId) =>
      withD1Retry(
        Effect.tryPromise({
          try: () =>
            db
              .select({
                id: schema.gameAttempts.id,
                score: schema.gameAttempts.score,
                completed: schema.gameAttempts.completed,
                moves: schema.gameAttempts.moves,
                durationMs: schema.gameAttempts.durationMs,
                mode: schema.gameAttempts.mode,
                createdAt: schema.gameAttempts.createdAt,
              })
              .from(schema.gameAttempts)
              .where(
                and(
                  eq(schema.gameAttempts.playerId, playerId),
                  eq(schema.gameAttempts.gameId, gameId),
                  eq(schema.gameAttempts.levelId, levelId),
                ),
              )
              .orderBy(sql`${schema.gameAttempts.createdAt} desc`)
              .limit(50),
          catch: (cause) => new GameAttemptsError({ cause }),
        }),
      ),

    getStats: (playerId, gameId) =>
      Effect.gen(function* () {
        const [aggregates, bestScores] = yield* withD1Retry(
          Effect.tryPromise({
            try: () =>
              db.batch([
                db
                  .select({
                    totalAttempts: count(),
                    completedCount: sql<number>`sum(case when ${schema.gameAttempts.completed} then 1 else 0 end)`,
                    avgScore: avg(schema.gameAttempts.score),
                    avgMoves: avg(schema.gameAttempts.moves),
                  })
                  .from(schema.gameAttempts)
                  .where(
                    and(
                      eq(schema.gameAttempts.playerId, playerId),
                      eq(schema.gameAttempts.gameId, gameId),
                    ),
                  ),
                db
                  .select({
                    levelId: schema.gameAttempts.levelId,
                    best: max(schema.gameAttempts.score),
                  })
                  .from(schema.gameAttempts)
                  .where(
                    and(
                      eq(schema.gameAttempts.playerId, playerId),
                      eq(schema.gameAttempts.gameId, gameId),
                    ),
                  )
                  .groupBy(schema.gameAttempts.levelId),
              ]),
            catch: (cause) => new GameAttemptsError({ cause }),
          }),
        );

        const agg = aggregates[0];
        const total = agg.totalAttempts;
        const completed = Number(agg.completedCount);

        return {
          totalAttempts: total,
          completionRate: total > 0 ? completed / total : 0,
          averageScore: Number(agg.avgScore),
          averageMoves: Number(agg.avgMoves),
          bestScoreByLevel: Object.fromEntries(
            bestScores.map((r) => [r.levelId, r.best ?? 0]),
          ),
        };
      }),

    getPerGameStats: (playerId) =>
      withD1Retry(
        Effect.tryPromise({
          try: () =>
            db
              .select({
                gameId: schema.gameAttempts.gameId,
                attempts: count(),
                completedCount: sql<number>`sum(case when ${schema.gameAttempts.completed} then 1 else 0 end)`,
              })
              .from(schema.gameAttempts)
              .where(eq(schema.gameAttempts.playerId, playerId))
              .groupBy(schema.gameAttempts.gameId),
          catch: (cause) => new GameAttemptsError({ cause }),
        }),
      ).pipe(
        Effect.map((rows) =>
          rows.map((r) => ({
            gameId: r.gameId,
            attempts: r.attempts,
            completionRate:
              r.attempts > 0 ? Number(r.completedCount) / r.attempts : 0,
          })),
        ),
      ),
  })),
);
