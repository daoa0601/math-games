import { Layer } from "effect";

import { WorkerEnvService } from "../worker-env";

/**
 * In-memory WorkerEnv fake whose KV round-trips real strings, so tests
 * exercise KvCacheServiceLive's actual serialization instead of stubbing
 * the cache layer itself.
 */
export function createFakeWorkerEnv() {
  const store = new Map<string, string>();

  const kv: KVNamespace = {
    get: (key: string) => Promise.resolve(store.get(key) ?? null),
    put: (key: string, value: string) => {
      store.set(key, value);
      return Promise.resolve();
    },
    delete: (key: string) => {
      store.delete(key);
      return Promise.resolve();
    },
  };

  const layer = Layer.succeed(WorkerEnvService, {
    getD1: (): D1Database => {
      throw new Error("D1 is not available in the fake worker env");
    },
    getKV: () => kv,
    getAnalytics: (): AnalyticsEngineDataset => {
      throw new Error("Analytics is not available in the fake worker env");
    },
    getR2: (): R2Bucket => {
      throw new Error("R2 is not available in the fake worker env");
    },
    getTurnstileSecret: () => undefined,
  });

  return { layer, store };
}
