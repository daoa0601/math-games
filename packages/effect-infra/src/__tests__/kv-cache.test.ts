import { Effect, Layer, ManagedRuntime } from "effect";
import { describe, expect, it } from "vitest";

import { KvCacheService, KvCacheServiceLive } from "../index";
import { createFakeWorkerEnv } from "./fake-worker-env";

function createKvHarness() {
  const { layer: envLayer, store } = createFakeWorkerEnv();
  const runtime = ManagedRuntime.make(
    KvCacheServiceLive.pipe(Layer.provide(envLayer)),
  );

  return {
    store,
    get: <T>(key: string) =>
      runtime.runPromise(
        Effect.gen(function* () {
          return yield* (yield* KvCacheService).get<T>(key);
        }),
      ),
    put: <T>(key: string, value: T, ttlSeconds: number) =>
      runtime.runPromise(
        Effect.gen(function* () {
          yield* (yield* KvCacheService).put(key, value, ttlSeconds);
        }),
      ),
  };
}

describe("KvCacheService", () => {
  it("round-trips object values", async () => {
    const cache = createKvHarness();
    await cache.put("obj", { levels: [1, 2, 3] }, 60);

    await expect(cache.get<{ levels: number[] }>("obj")).resolves.toEqual({
      levels: [1, 2, 3],
    });
  });

  it("round-trips primitive number values (rate-limit counters)", async () => {
    const cache = createKvHarness();
    await cache.put("counter", 7, 3600);

    await expect(cache.get<number>("counter")).resolves.toBe(7);
  });

  it("returns null for a missing key", async () => {
    const cache = createKvHarness();

    await expect(cache.get("absent")).resolves.toBeNull();
  });

  it("returns null for corrupted non-JSON payloads", async () => {
    const cache = createKvHarness();
    cache.store.set("corrupt", "{not json");

    await expect(cache.get("corrupt")).resolves.toBeNull();
  });
});
