import { and, avg, count, eq, gte, lte, sql } from "drizzle-orm";
import { Context, Effect, Layer } from "effect";

import { schema } from "@math-games/db";

import { DailyChallengeError, withD1Retry } from "@math-games/effect-infra";
import { DbService } from "@math-games/effect-game";

export interface DateRange {
  from: string;
  to: string;
}

export interface CompletionRateReport {
  byGame: Array<{
    gameId: string;
    starts: number;
    completions: number;
    rate: number;
  }>;
  byDifficulty: Array<{
    difficulty: string;
    starts: number;
    completions: number;
    rate: number;
  }>;
}

export interface LevelDifficultyReport {
  levels: Array<{
    levelId: string;
    averageAttempts: number;
    completionRate: number;
    averageScore: number;
  }>;
}

export interface RetentionReport {
  dailyActive: Array<{ date: string; players: number }>;
}

export interface AnalyticsDashboardShape {
  readonly getCompletionRates: (
    dateRange: DateRange,
  ) => Effect.Effect<CompletionRateReport, DailyChallengeError>;

  readonly getLevelDifficulty: (
    gameId: string,
  ) => Effect.Effect<LevelDifficultyReport, DailyChallengeError>;

  readonly getRetention: (
    dateRange: DateRange,
  ) => Effect.Effect<RetentionReport, DailyChallengeError>;
}

export const AnalyticsDashboardService =
  Context.Service<AnalyticsDashboardShape>("AnalyticsDashboardService");

export const AnalyticsDashboardServiceLive = Layer.effect(
  AnalyticsDashboardService,
  Effect.map(DbService, ({ db }) => ({
    getCompletionRates: (dateRange) =>
      Effect.gen(function* () {
        const [byGame, byMode] = yield* withD1Retry(
          Effect.tryPromise({
            try: () =>
              db.batch([
                db
                  .select({
                    gameId: schema.gameAttempts.gameId,
                    starts: count(),
                    completions: sql<number>`sum(case when ${schema.gameAttempts.completed} then 1 else 0 end)`,
                  })
                  .from(schema.gameAttempts)
                  .where(
                    and(
                      gte(
                        schema.gameAttempts.createdAt,
                        new Date(dateRange.from),
                      ),
                      lte(
                        schema.gameAttempts.createdAt,
                        new Date(dateRange.to),
                      ),
                    ),
                  )
                  .groupBy(schema.gameAttempts.gameId),
                db
                  .select({
                    difficulty: schema.gameAttempts.mode,
                    starts: count(),
                    completions: sql<number>`sum(case when ${schema.gameAttempts.completed} then 1 else 0 end)`,
                  })
                  .from(schema.gameAttempts)
                  .where(
                    and(
                      gte(
                        schema.gameAttempts.createdAt,
                        new Date(dateRange.from),
                      ),
                      lte(
                        schema.gameAttempts.createdAt,
                        new Date(dateRange.to),
                      ),
                    ),
                  )
                  .groupBy(schema.gameAttempts.mode),
              ]),
            catch: (cause) => new DailyChallengeError({ cause }),
          }),
        );

        return {
          byGame: byGame.map((r) => ({
            gameId: r.gameId,
            starts: r.starts,
            completions: Number(r.completions),
            rate: r.starts > 0 ? Number(r.completions) / r.starts : 0,
          })),
          byDifficulty: byMode.map((r) => ({
            difficulty: r.difficulty,
            starts: r.starts,
            completions: Number(r.completions),
            rate: r.starts > 0 ? Number(r.completions) / r.starts : 0,
          })),
        };
      }),

    getLevelDifficulty: (gameId) =>
      Effect.gen(function* () {
        const rows = yield* withD1Retry(
          Effect.tryPromise({
            try: () =>
              db
                .select({
                  levelId: schema.gameAttempts.levelId,
                  averageAttempts: sql<number>`count(*) * 1.0 / count(distinct ${schema.gameAttempts.playerId})`,
                  completionRate: sql<number>`sum(case when ${schema.gameAttempts.completed} then 1.0 else 0.0 end) / count(*)`,
                  averageScore: avg(schema.gameAttempts.score),
                })
                .from(schema.gameAttempts)
                .where(eq(schema.gameAttempts.gameId, gameId))
                .groupBy(schema.gameAttempts.levelId),
            catch: (cause) => new DailyChallengeError({ cause }),
          }),
        );

        return {
          levels: rows.map((r) => ({
            levelId: r.levelId,
            averageAttempts: Number(r.averageAttempts),
            completionRate: Number(r.completionRate),
            averageScore: Number(r.averageScore),
          })),
        };
      }),

    getRetention: (dateRange) =>
      Effect.gen(function* () {
        const rows = yield* withD1Retry(
          Effect.tryPromise({
            try: () =>
              db
                .select({
                  date: sql<string>`date(${schema.gameAttempts.createdAt}, 'unixepoch')`,
                  players: sql<number>`count(distinct ${schema.gameAttempts.playerId})`,
                })
                .from(schema.gameAttempts)
                .where(
                  and(
                    gte(
                      schema.gameAttempts.createdAt,
                      new Date(dateRange.from),
                    ),
                    lte(schema.gameAttempts.createdAt, new Date(dateRange.to)),
                  ),
                )
                .groupBy(
                  sql`date(${schema.gameAttempts.createdAt}, 'unixepoch')`,
                )
                .orderBy(
                  sql`date(${schema.gameAttempts.createdAt}, 'unixepoch')`,
                ),
            catch: (cause) => new DailyChallengeError({ cause }),
          }),
        );

        return {
          dailyActive: rows.map((r) => ({
            date: r.date,
            players: Number(r.players),
          })),
        };
      }),
  })),
);
