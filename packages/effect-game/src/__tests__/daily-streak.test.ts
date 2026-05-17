import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";

import { ClockService } from "@math-games/effect-infra";

import { DbService } from "../db";
import { DailyStreakService, DailyStreakServiceLive } from "../daily-streak";

function createHarness(opts: {
  today: string;
  existingRows: Array<{ challengeDate: string; completed: boolean }>;
}) {
  let insertedValues: Array<Record<string, unknown>> = [];

  const clockLayer = Layer.succeed(ClockService, {
    now: () => Effect.succeed(new Date(opts.today)),
    dateKey: () => Effect.succeed(opts.today),
  });

  // Create a minimal DB stub that returns the configured rows
  // for select queries and records inserts
  const dbLayer = Layer.succeed(DbService, {
    db: {
      insert: () => ({
        values: (vals: Record<string, unknown>) => {
          insertedValues.push(vals);
          return {
            onConflictDoUpdate: () => Promise.resolve(),
          };
        },
      }),
      select: () => {
        const chain = {
          from: () => chain,
          where: () => chain,
          orderBy: () => chain,
          limit: () =>
            Promise.resolve(
              opts.existingRows.map((r) => ({
                challengeDate: r.challengeDate,
                completed: r.completed,
              })),
            ),
        };
        return chain;
      },
    } as never,
  });

  const layer = DailyStreakServiceLive.pipe(
    Layer.provide(Layer.mergeAll(clockLayer, dbLayer)),
  );

  return {
    getStreak: (playerId: string) =>
      Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* DailyStreakService;
          return yield* service.getStreak(playerId);
        }).pipe(Effect.provide(layer)),
      ),
    recordDailyCompletion: (input: {
      playerId: string;
      challengeDate: string;
      gameId: string;
      levelId: string;
      score: number;
      completed: boolean;
    }) =>
      Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* DailyStreakService;
          return yield* service.recordDailyCompletion(input);
        }).pipe(Effect.provide(layer)),
      ),
    get insertedValues() {
      return insertedValues;
    },
  };
}

describe("DailyStreakService.getStreak", () => {
  it("returns zero streak when no rows exist", async () => {
    const harness = createHarness({
      today: "2025-01-15",
      existingRows: [],
    });

    const streak = await harness.getStreak("player-1");

    expect(streak.current).toBe(0);
    expect(streak.longest).toBe(0);
    expect(streak.completedToday).toBe(false);
    expect(streak.lastCompletedDate).toBe(null);
  });

  it("returns streak of 1 when only today is completed", async () => {
    const harness = createHarness({
      today: "2025-01-15",
      existingRows: [{ challengeDate: "2025-01-15", completed: true }],
    });

    const streak = await harness.getStreak("player-1");

    expect(streak.current).toBe(1);
    expect(streak.longest).toBe(1);
    expect(streak.completedToday).toBe(true);
    expect(streak.lastCompletedDate).toBe("2025-01-15");
  });

  it("counts consecutive days as a streak", async () => {
    const harness = createHarness({
      today: "2025-01-15",
      existingRows: [
        { challengeDate: "2025-01-13", completed: true },
        { challengeDate: "2025-01-14", completed: true },
        { challengeDate: "2025-01-15", completed: true },
      ],
    });

    const streak = await harness.getStreak("player-1");

    expect(streak.current).toBe(3);
    expect(streak.longest).toBe(3);
    expect(streak.completedToday).toBe(true);
  });

  it("maintains current streak of yesterday + today", async () => {
    const harness = createHarness({
      today: "2025-01-15",
      existingRows: [
        { challengeDate: "2025-01-14", completed: true },
        { challengeDate: "2025-01-15", completed: true },
      ],
    });

    const streak = await harness.getStreak("player-1");

    expect(streak.current).toBe(2);
  });

  it("breaks streak when a day is skipped", async () => {
    const harness = createHarness({
      today: "2025-01-15",
      existingRows: [
        { challengeDate: "2025-01-12", completed: true },
        { challengeDate: "2025-01-13", completed: true },
        // gap on 2025-01-14
        { challengeDate: "2025-01-15", completed: true },
      ],
    });

    const streak = await harness.getStreak("player-1");

    expect(streak.current).toBe(1);
    expect(streak.longest).toBe(2);
  });

  it("keeps longest streak even when current is lower", async () => {
    const harness = createHarness({
      today: "2025-01-20",
      existingRows: [
        // old 4-day streak
        { challengeDate: "2025-01-10", completed: true },
        { challengeDate: "2025-01-11", completed: true },
        { challengeDate: "2025-01-12", completed: true },
        { challengeDate: "2025-01-13", completed: true },
        // gap
        // current 2-day streak
        { challengeDate: "2025-01-19", completed: true },
        { challengeDate: "2025-01-20", completed: true },
      ],
    });

    const streak = await harness.getStreak("player-1");

    expect(streak.current).toBe(2);
    expect(streak.longest).toBe(4);
  });

  it("ignores incomplete entries for streak counting", async () => {
    const harness = createHarness({
      today: "2025-01-15",
      existingRows: [
        { challengeDate: "2025-01-13", completed: true },
        { challengeDate: "2025-01-14", completed: false },
        { challengeDate: "2025-01-15", completed: true },
      ],
    });

    const streak = await harness.getStreak("player-1");

    expect(streak.current).toBe(1);
    expect(streak.completedToday).toBe(true);
  });

  it("reports completedToday as false when today is not completed", async () => {
    const harness = createHarness({
      today: "2025-01-15",
      existingRows: [
        { challengeDate: "2025-01-14", completed: true },
        { challengeDate: "2025-01-15", completed: false },
      ],
    });

    const streak = await harness.getStreak("player-1");

    expect(streak.completedToday).toBe(false);
    expect(streak.current).toBe(1);
  });

  it("continues streak from yesterday when today is not yet played", async () => {
    const harness = createHarness({
      today: "2025-01-15",
      existingRows: [
        { challengeDate: "2025-01-13", completed: true },
        { challengeDate: "2025-01-14", completed: true },
      ],
    });

    const streak = await harness.getStreak("player-1");

    expect(streak.current).toBe(2);
    expect(streak.completedToday).toBe(false);
  });

  it("resets current streak when last completion was more than 1 day ago", async () => {
    const harness = createHarness({
      today: "2025-01-20",
      existingRows: [
        { challengeDate: "2025-01-15", completed: true },
        { challengeDate: "2025-01-16", completed: true },
      ],
    });

    const streak = await harness.getStreak("player-1");

    expect(streak.current).toBe(0);
    expect(streak.longest).toBe(2);
  });
});

describe("DailyStreakService.recordDailyCompletion", () => {
  it("returns saved:true and the computed streak", async () => {
    const harness = createHarness({
      today: "2025-01-15",
      existingRows: [{ challengeDate: "2025-01-15", completed: true }],
    });

    const result = await harness.recordDailyCompletion({
      playerId: "player-1",
      challengeDate: "2025-01-15",
      gameId: "magic-graph",
      levelId: "level-1",
      score: 100,
      completed: true,
    });

    expect(result.saved).toBe(true);
    expect(result.streak.current).toBe(1);
    expect(result.streak.completedToday).toBe(true);
  });
});
