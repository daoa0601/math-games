import { Effect, Layer, ManagedRuntime } from "effect";
import { describe, expect, it } from "vitest";

import {
  ClockService,
  KvCacheServiceLive,
  RateLimitError,
  RateLimitService,
  RateLimitServiceLive,
} from "../index";
import { createFakeWorkerEnv } from "./fake-worker-env";

function fakeClockLayer(getCurrentTime: () => number) {
  return Layer.succeed(ClockService, {
    now: () => Effect.succeed(new Date(getCurrentTime())),
    dateKey: () =>
      Effect.succeed(new Date(getCurrentTime()).toISOString().slice(0, 10)),
  });
}

function createRateLimitHarness(now: number) {
  let currentTime = now;

  // Real KvCacheServiceLive over an in-memory KV, so the counter takes the
  // same serialization path it takes in production. `assert` ignores KV, so
  // routing it through the real layer here is harmless and keeps a single
  // seam for both code paths under test.
  const kvLayer = KvCacheServiceLive.pipe(
    Layer.provide(createFakeWorkerEnv().layer),
  );
  const runtime = ManagedRuntime.make(
    RateLimitServiceLive.pipe(
      Layer.provide(
        Layer.mergeAll(
          fakeClockLayer(() => currentTime),
          kvLayer,
        ),
      ),
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
    assertHourly: (key: string, max: number, nextTime?: number) => {
      if (nextTime !== undefined) currentTime = nextTime;

      return runtime.runPromise(
        Effect.gen(function* () {
          yield* (yield* RateLimitService).assertHourlyLimit(key, max);
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

describe("RateLimitService.assertHourlyLimit", () => {
  const HOUR_MS = 3_600_000;
  // Aligned to a bucket boundary so advancing within the test stays in-bucket.
  const T0 = 100 * HOUR_MS;

  it("rejects once the hourly cap is exceeded", async () => {
    const rateLimit = createRateLimitHarness(T0);
    const key = "hourly-cap";

    await expect(rateLimit.assertHourly(key, 3)).resolves.toBeUndefined();
    await expect(rateLimit.assertHourly(key, 3)).resolves.toBeUndefined();
    await expect(rateLimit.assertHourly(key, 3)).resolves.toBeUndefined();

    await expect(rateLimit.assertHourly(key, 3)).rejects.toBeInstanceOf(
      RateLimitError,
    );
  });

  it("resets the count in the next hour bucket", async () => {
    const rateLimit = createRateLimitHarness(T0);
    const key = "hourly-reset";

    await rateLimit.assertHourly(key, 2);
    await rateLimit.assertHourly(key, 2);
    await expect(rateLimit.assertHourly(key, 2)).rejects.toBeInstanceOf(
      RateLimitError,
    );

    await expect(
      rateLimit.assertHourly(key, 2, T0 + HOUR_MS),
    ).resolves.toBeUndefined();
  });

  it("tracks hourly counts per key", async () => {
    const rateLimit = createRateLimitHarness(T0);

    await rateLimit.assertHourly("hourly-a", 1);
    await expect(rateLimit.assertHourly("hourly-a", 1)).rejects.toBeInstanceOf(
      RateLimitError,
    );
    await expect(
      rateLimit.assertHourly("hourly-b", 1),
    ).resolves.toBeUndefined();
  });
});
