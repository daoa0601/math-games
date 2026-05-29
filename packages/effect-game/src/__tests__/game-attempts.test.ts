import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";

import { schema } from "@math-games/db";

import { DbService } from "../db";
import {
  GameAttemptsService,
  GameAttemptsServiceLive,
  type AttemptInput,
} from "../game-attempts";

function createHarness() {
  const insertedTables: unknown[] = [];
  const insertedValues: Array<Record<string, unknown>> = [];

  // Minimal drizzle stub: capture the target table and the inserted row, and
  // resolve the insert (record awaits `db.insert(table).values(row)` directly).
  const dbLayer = Layer.succeed(DbService, {
    db: {
      insert: (table: unknown) => {
        insertedTables.push(table);
        return {
          values: (vals: Record<string, unknown>) => {
            insertedValues.push(vals);
            return Promise.resolve();
          },
        };
      },
    } as never,
  });

  const layer = GameAttemptsServiceLive.pipe(Layer.provide(dbLayer));

  return {
    record: (input: AttemptInput) =>
      Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* GameAttemptsService;
          return yield* service.record(input);
        }).pipe(Effect.provide(layer)),
      ),
    get insertedTables() {
      return insertedTables;
    },
    get insertedValues() {
      return insertedValues;
    },
  };
}

describe("GameAttemptsService.record", () => {
  it("persists the attempt to game_attempts, including the diagnostic completionJson", async () => {
    const harness = createHarness();
    const completionJson = JSON.stringify({
      skillTags: ["constraint_propagation"],
      misconceptionTags: ["ignores_overlapping_line"],
    });

    await harness.record({
      playerId: "player-1",
      gameId: "magic-graph",
      levelId: "mg-demo-1",
      score: 100,
      completed: true,
      moves: 4,
      durationMs: 42000,
      mode: "practice",
      completionJson,
    });

    expect(harness.insertedTables[0]).toBe(schema.gameAttempts);
    expect(harness.insertedValues).toHaveLength(1);

    const row = harness.insertedValues[0];
    expect(row).toMatchObject({
      playerId: "player-1",
      gameId: "magic-graph",
      levelId: "mg-demo-1",
      score: 100,
      completed: true,
      moves: 4,
      durationMs: 42000,
      mode: "practice",
      completionJson,
    });
    // A row id is always generated.
    expect(typeof row.id).toBe("string");
    expect(row.id).not.toBe("");
  });

  it("stores an undefined completionJson (DB null) when the level has no diagnostics", async () => {
    const harness = createHarness();

    await harness.record({
      playerId: "player-1",
      gameId: "pattern-detective",
      levelId: "pd-1",
      score: 0,
      completed: false,
      moves: 1,
      mode: "daily",
    });

    expect(harness.insertedValues[0].completionJson).toBeUndefined();
  });
});
