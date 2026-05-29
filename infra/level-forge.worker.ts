import * as Cloudflare from "alchemy/Cloudflare";
import * as Effect from "effect/Effect";
import * as HttpServerResponse from "effect/unstable/http/HttpServerResponse";

import {
  buildPracticePoolSpecs,
  forgePracticePool,
} from "@math-games/game-shape-architect/src/solution-forge.ts";
import type { ForgeKv } from "@math-games/game-shape-architect/src/solution-forge.ts";

import { Cache } from "./resources.ts";

// Minimal shape of the KV binding we use at runtime (avoids depending on the
// full Cloudflare Workers ambient types inside the infra package).
interface KvLike {
  get(key: string, type: "text"): Promise<string | null>;
  put(
    key: string,
    value: string,
    options: { expirationTtl: number },
  ): Promise<void>;
}

const BATCH_SIZE = 6;

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

/**
 * Durable practice-pool forge. Solving the whole pool can exceed a single
 * invocation, so each batch is its own retryable {@link Cloudflare.task} step
 * with a short cooldown between batches — a partial failure resumes from the
 * last completed batch instead of re-solving everything.
 */
export class LevelForgeWorkflow extends Cloudflare.Workflow<LevelForgeWorkflow>()(
  "LevelForge",
  Effect.gen(function* () {
    return Effect.fn(function* (input: { perDifficulty?: number }) {
      const env = (yield* Cloudflare.WorkerEnvironment) as unknown as {
        CACHE: KvLike;
      };
      const kv: ForgeKv = {
        get: (key) => env.CACHE.get(key, "text"),
        put: (key, value, options) => env.CACHE.put(key, value, options),
      };

      const batches = chunk(
        buildPracticePoolSpecs(input.perDifficulty ?? 8),
        BATCH_SIZE,
      );

      let solved = 0;
      let cached = 0;
      for (let index = 0; index < batches.length; index++) {
        const report = yield* Cloudflare.task(
          `forge-batch-${index}`,
          Effect.promise(() => forgePracticePool(batches[index], kv)),
        );
        solved += report.solved.length;
        cached += report.cached.length;

        if (index < batches.length - 1) {
          yield* Cloudflare.sleep(`cooldown-${index}`, "2 seconds");
        }
      }

      return { solved, cached };
    });
  }),
) {}

/**
 * Host worker for {@link LevelForgeWorkflow}. A POST to `/` starts a forge
 * instance; the daily-cron worker calls this over a service binding so the
 * pool stays warm without a manual trigger.
 */
export default class LevelForgeWorker extends Cloudflare.Worker<LevelForgeWorker>()(
  "level-forge",
  {
    main: "./level-forge.worker.ts",
    compatibility: { date: "2026-05-13", flags: ["nodejs_compat"] },
    bindings: { CACHE: Cache },
  },
  Effect.gen(function* () {
    const forge = yield* LevelForgeWorkflow;

    return {
      fetch: Effect.gen(function* () {
        const instance = yield* forge.create({ perDifficulty: 8 });
        return HttpServerResponse.json({ instanceId: instance.id });
      }),
    };
  }),
) {}
