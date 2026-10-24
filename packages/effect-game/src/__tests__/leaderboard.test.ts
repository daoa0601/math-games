import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";

import { DbService } from "../db";
import {
  LeaderboardService,
  LeaderboardServiceLive,
  type LeaderboardInput,
} from "../leaderboard";

function createHarness() {
  const batchCalls: number[] = [];
  const upserts: Array<Record<string, unknown>> = [];

  // Minimal drizzle stub: each insert captures its row, and db.batch records
  // how many statements it was asked to run atomically.
  const dbLayer = Layer.succeed(DbService, {
    db: {
      insert: (_table: unknown) => ({
        values: (vals: Record<string, unknown>) => {
          upserts.push(vals);
          return {
            onConflictDoUpdate: (_opts: unknown) => ({ __stmt: true }),
          };
        },
      }),
      batch: (stmts: unknown[]) => {
        batchCalls.push(stmts.length);
        return Promise.resolve(stmts.map(() => ({ rows: [] })));
      },
    } as never,
  });

  const layer = LeaderboardServiceLive.pipe(Layer.provide(dbLayer));

  return {
    recordEntry: (input: LeaderboardInput) =>
      Effect.runPromise(
        Effect.gen(function* () {
          yield* (yield* LeaderboardService).recordEntry(input);
        }).pipe(Effect.provide(layer)),
      ),
    recordEntries: (inputs: LeaderboardInput[]) =>
      Effect.runPromise(
        Effect.gen(function* () {
          yield* (yield* LeaderboardService).recordEntries(inputs);
        }).pipe(Effect.provide(layer)),
      ),
    batchCalls,
    upserts,
  };
}

const baseEntry = {
  playerId: "player-1",
  gameId: "magic-graph",
  levelId: "mg-1",
  score: 90,
  moves: 4,
} satisfies Omit<LeaderboardInput, "scope">;

describe("LeaderboardService.recordEntries", () => {
  it("issues a single atomic batch containing one upsert per entry", async () => {
    const harness = createHarness();
    const inputs: LeaderboardInput[] = [
      { ...baseEntry, scope: "personal" },
      { ...baseEntry, scope: "class-a" },
      { ...baseEntry, scope: "class-b" },
    ];

    await harness.recordEntries(inputs);

    // Personal + both classrooms land in ONE db.batch call (atomic), not three
    // separate round trips.
    expect(harness.batchCalls).toEqual([3]);
    expect(harness.upserts.map((u) => u.scope)).toEqual([
      "personal",
      "class-a",
      "class-b",
    ]);
  });

  it("skips the DB entirely for an empty entry list", async () => {
    const harness = createHarness();

    await harness.recordEntries([]);

    expect(harness.batchCalls).toEqual([]);
    expect(harness.upserts).toEqual([]);
  });
});

describe("LeaderboardService.recordEntry", () => {
  it("delegates to the same batched write path as a single-entry batch", async () => {
    const harness = createHarness();

    await harness.recordEntry({ ...baseEntry, scope: "personal" });

    expect(harness.batchCalls).toEqual([1]);
  });
});
