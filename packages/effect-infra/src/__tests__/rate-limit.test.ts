import { Effect, Layer, ManagedRuntime } from "effect";
import { describe, expect, it } from "vitest";

import {
  ClockService,
  KvCacheService,
  RateLimitError,
  RateLimitService,
  RateLimitServiceLive,
} from "../index";

function createRateLimitHarness(now: number) {
  let currentTime = now;

  const clockLayer = Layer.succeed(ClockService, {
    now: () => Effect.succeed(new Date(currentTime)),
    dateKey: () =>
      Effect.succeed(new Date(currentTime).toISOString().slice(0, 10)),
  });
  const kvLayer = Layer.succeed(KvCacheService, {
    get: () => Effect.succeed(null),
    put: () => Effect.void,
    delete: () => Effect.void,
  });
  const runtime = ManagedRuntime.make(
    RateLimitServiceLive.pipe(
      Layer.provide(Layer.mergeAll(clockLayer, kvLayer)),
    ),
  );

  return {
    assert: (key: string, nextTime: number) => {
      currentTime = nextTime;

      return runtime.runPromise(
        Effect.gen(function* () {
          yield* (yield* RateLimitService).assert(key);
        }),
      );
    },
  };
}

describe("RateLimitService", () => {
  it("allows the first call for a key", async () => {
    const rateLimit = createRateLimitHarness(1_000_000);

    await expect(
      rateLimit.assert("service-first-call", 1_000_000),
    ).resolves.toBeUndefined();
  });

  it("rejects rapid duplicate calls within the 250ms window", async () => {
    const rateLimit = createRateLimitHarness(1_000_000);
    const key = "service-rapid";
    await rateLimit.assert(key, 1_000_000);

    await expect(rateLimit.assert(key, 1_000_100)).rejects.toBeInstanceOf(
      RateLimitError,
    );
  });

  it("allows calls after the 250ms window expires", async () => {
    const rateLimit = createRateLimitHarness(2_000_000);
    const key = "service-expired";
    await rateLimit.assert(key, 2_000_000);

    await expect(rateLimit.assert(key, 2_000_251)).resolves.toBeUndefined();
  });

  it("allows exactly at the 250ms boundary", async () => {
    const rateLimit = createRateLimitHarness(3_000_000);
    const key = "service-boundary";
    await rateLimit.assert(key, 3_000_000);

    await expect(rateLimit.assert(key, 3_000_250)).resolves.toBeUndefined();
  });

  it("tracks different keys independently", async () => {
    const rateLimit = createRateLimitHarness(4_000_000);

    await rateLimit.assert("service-key-a", 4_000_000);
    await rateLimit.assert("service-key-b", 4_000_000);

    await expect(
      rateLimit.assert("service-key-a", 4_000_100),
    ).rejects.toBeInstanceOf(RateLimitError);
    await expect(
      rateLimit.assert("service-key-b", 4_000_100),
    ).rejects.toBeInstanceOf(RateLimitError);
    await expect(
      rateLimit.assert("service-key-c", 4_000_100),
    ).resolves.toBeUndefined();
  });

  it("isolates state by runtime", async () => {
    const firstRuntime = createRateLimitHarness(4_500_000);
    const secondRuntime = createRateLimitHarness(4_500_000);
    const key = "service-runtime-state";

    await firstRuntime.assert(key, 4_500_000);

    await expect(firstRuntime.assert(key, 4_500_100)).rejects.toBeInstanceOf(
      RateLimitError,
    );
    await expect(secondRuntime.assert(key, 4_500_100)).resolves.toBeUndefined();
  });

  it("updates the timestamp on each successful call", async () => {
    const rateLimit = createRateLimitHarness(5_000_000);
    const key = "service-update";
    await rateLimit.assert(key, 5_000_000);
    await rateLimit.assert(key, 5_000_251);

    await expect(rateLimit.assert(key, 5_000_400)).rejects.toBeInstanceOf(
      RateLimitError,
    );
    await expect(rateLimit.assert(key, 5_000_502)).resolves.toBeUndefined();
  });
});
