import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import * as Drizzle from "alchemy/Drizzle";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";

import { Cache } from "./resources.ts";
import LevelForgeWorker from "./level-forge.worker.ts";

export default Alchemy.Stack(
  "math-games",
  {
    providers: Layer.mergeAll(Cloudflare.providers(), Drizzle.providers()),
    state: Cloudflare.state(),
  },
  Effect.gen(function* () {
    const database = yield* Cloudflare.D1Database("DB", {
      name: "math-games-db",
      migrationsDir: "../packages/db/drizzle/migrations",
      migrationsTable: "drizzle_migrations",
      primaryLocationHint: "wnam",
    });

    const cache = yield* Cache;

    const analytics = yield* Cloudflare.AnalyticsEngineDataset("ANALYTICS", {
      dataset: "math-games-events",
    });

    const assets = yield* Cloudflare.R2Bucket("R2_ASSETS", {
      name: "math-games-assets",
    });

    const worker = yield* Cloudflare.Vite("web", {
      name: "math-games",
      rootDir: "../apps/web",
      compatibility: {
        date: "2026-05-13",
        flags: ["nodejs_compat"],
      },
      observability: {
        enabled: true,
        headSamplingRate: 1,
        logs: {
          enabled: true,
          invocationLogs: true,
          headSamplingRate: 1,
          persist: true,
        },
        traces: {
          enabled: true,
          headSamplingRate: 1,
          persist: true,
        },
      },
      bindings: {
        DB: database,
        CACHE: cache,
        ANALYTICS: analytics,
        R2_ASSETS: assets,
      },
    });

    const levelForge = yield* LevelForgeWorker;

    const cronWorker = yield* Cloudflare.Worker("daily-cron", {
      name: "math-games-daily-cron",
      main: "../apps/web/src/workers/daily-cron.ts",
      compatibility: {
        date: "2026-05-13",
        flags: ["nodejs_compat"],
      },
      crons: ["0 0 * * *"],
      bindings: {
        DB: database,
        CACHE: cache,
        LEVEL_FORGE: levelForge,
      },
    });

    return {
      databaseId: database.databaseId,
      cacheNamespaceId: cache.namespaceId,
      analyticsDataset: analytics.dataset,
      assetsBucketName: assets.bucketName,
      workerUrl: worker.url,
      cronWorkerName: cronWorker.workerName,
      levelForgeWorkerName: levelForge.workerName,
    };
  }),
);
