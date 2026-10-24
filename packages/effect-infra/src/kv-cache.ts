import { Context, Effect, Layer } from "effect";

import { WorkerEnvService } from "./worker-env";

export interface KvCacheShape {
  readonly get: <T>(key: string) => Effect.Effect<T | null>;
  readonly put: <T>(
    key: string,
    value: T,
    ttlSeconds: number,
  ) => Effect.Effect<void>;
  readonly delete: (key: string) => Effect.Effect<void>;
}

export const KvCacheService = Context.Service<KvCacheShape>("KvCacheService");

export const KvCacheServiceLive = Layer.effect(
  KvCacheService,
  Effect.map(WorkerEnvService, (env) => {
    const kv = env.getKV();

    return {
      get: <T>(key: string): Effect.Effect<T | null> =>
        Effect.promise(async () => {
          try {
            const raw = await kv.get(key, "text");
            if (raw === null) return null;
            return JSON.parse(raw) as T;
          } catch {
            return null;
          }
        }),

      put: <T>(
        key: string,
        value: T,
        ttlSeconds: number,
      ): Effect.Effect<void> =>
        Effect.promise(async () => {
          try {
            await kv.put(key, JSON.stringify(value), {
              expirationTtl: ttlSeconds,
            });
          } catch {
            // KV writes are best-effort
          }
        }),

      delete: (key: string): Effect.Effect<void> =>
        Effect.promise(async () => {
          try {
            await kv.delete(key);
          } catch {
            // KV deletes are best-effort
          }
        }),
    };
  }),
);
