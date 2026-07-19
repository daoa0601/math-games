// ========================================
// Client-side metrics + Worker health (Effect services)
// ========================================
//
// Two services share this file because they answer the same operational
// question from different sides:
//
//   - ClientMetricsService: appends perf/vitals/error rows from the browser
//     into the `client_metrics` D1 table. Reads the mg_player cookie without
//     creating a new player — metrics events must never mint player rows.
//   - HealthService: synthesizes a Worker health snapshot (db reachable,
//     binding surface present) for the `/health` endpoint.
//
// Both depend only on D1 + WorkerEnv, so they stay runtime-cheap and never
// touch Analytics Engine (which is fire-and-forget and not queryable).

import { and, count, eq, gte, sql } from "drizzle-orm";
import { Context, Effect, Layer } from "effect";

import { schema } from "@math-games/db";

import { GameAttemptsError, withD1Retry } from "@math-games/effect-infra";
import { HeaderService } from "@math-games/effect-infra";
import { parsePlayerIdCookie } from "./identity.server";

import { DbService } from "./db";

// ----------------------------------------
// ClientMetricsService
// ----------------------------------------

export type ClientMetricKind = "perf" | "vitals" | "error" | "usage";

export interface ClientMetricInput {
  kind: ClientMetricKind;
  name: string;
  gameId?: string;
  levelId?: string;
  value?: number;
  payloadJson?: string;
}

export interface ClientMetricsAggregate {
  name: string;
  samples: number;
  avgValue: number | null;
  minValue: number | null;
  maxValue: number | null;
}

export interface ClientMetricsShape {
  readonly record: (
    input: ClientMetricInput,
  ) => Effect.Effect<void, GameAttemptsError>;
  readonly getAggregate: (
    kind: ClientMetricKind,
    name: string,
    since: Date,
  ) => Effect.Effect<ClientMetricsAggregate, GameAttemptsError>;
}

export const ClientMetricsService = Context.Service<ClientMetricsShape>(
  "ClientMetricsService",
);

function generateId(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export const ClientMetricsServiceLive = Layer.effect(
  ClientMetricsService,
  Effect.all({
    dbContainer: DbService,
    headers: HeaderService,
  }).pipe(
    Effect.map(({ dbContainer, headers }) => ({
      record: (input) =>
        Effect.gen(function* () {
          const cookieHeader = yield* headers.getRequest("cookie");
          const playerId = parsePlayerIdCookie(cookieHeader);

          yield* withD1Retry(
            Effect.tryPromise({
              try: () =>
                dbContainer.db.insert(schema.clientMetrics).values({
                  id: generateId(),
                  playerId: playerId ?? null,
                  kind: input.kind,
                  name: input.name,
                  gameId: input.gameId ?? null,
                  levelId: input.levelId ?? null,
                  value: input.value ?? null,
                  payloadJson: input.payloadJson ?? null,
                }),
              catch: (cause) => new GameAttemptsError({ cause }),
            }),
          ).pipe(Effect.asVoid);
        }),

      getAggregate: (kind, name, since) =>
        withD1Retry(
          Effect.tryPromise({
            try: () =>
              dbContainer.db
                .select({
                  samples: count(),
                  avgValue: sql<
                    number | null
                  >`AVG(${schema.clientMetrics.value})`,
                  minValue: sql<
                    number | null
                  >`MIN(${schema.clientMetrics.value})`,
                  maxValue: sql<
                    number | null
                  >`MAX(${schema.clientMetrics.value})`,
                })
                .from(schema.clientMetrics)
                .where(
                  and(
                    eq(schema.clientMetrics.kind, kind),
                    eq(schema.clientMetrics.name, name),
                    gte(schema.clientMetrics.createdAt, since),
                  ),
                ),
            catch: (cause) => new GameAttemptsError({ cause }),
          }),
        ).pipe(
          Effect.map((rows) => {
            const row = rows[0] ?? {
              samples: 0,
              avgValue: null,
              minValue: null,
              maxValue: null,
            };
            return { name, ...row };
          }),
        ),
    })),
  ),
);

// ----------------------------------------
// HealthService
// ----------------------------------------

export interface HealthSnapshot {
  status: "ok" | "down";
  checkedAt: string;
  /** D1 round-trip latency in ms (undefined if not reachable). */
  dbLatencyMs?: number;
  /** Marker row returned by the D1 probe (proves the binding is live). */
  dbMarker: string;
}

export interface HealthShape {
  readonly snapshot: () => Effect.Effect<HealthSnapshot>;
}

export const HealthService = Context.Service<HealthShape>("HealthService");

export const HealthServiceLive = Layer.effect(
  HealthService,
  Effect.map(DbService, (dbContainer) => ({
    snapshot: () =>
      Effect.gen(function* () {
        const startedAt = performance.now();
        const result = yield* Effect.tryPromise({
          try: () =>
            dbContainer.db
              .select({
                marker: sql<string>`'d1-alive'`,
                now: sql<number>`unixepoch()`,
              })
              .from(sql`sqlite_master`)
              .limit(1),
          catch: () => new Error("d1-unreachable"),
        }).pipe(
          Effect.timeout("2 seconds"),
          Effect.orElseSucceed(() => null),
        );

        if (!result || result.length === 0) {
          return {
            status: "down" as const,
            checkedAt: new Date().toISOString(),
            dbMarker: "d1-unreachable",
          };
        }

        const latency = performance.now() - startedAt;
        const row = result[0] as { marker?: string };
        return {
          status: "ok" as const,
          checkedAt: new Date().toISOString(),
          dbLatencyMs: Math.round(latency * 100) / 100,
          dbMarker: row.marker ?? "d1-alive",
        };
      }),
  })),
);
