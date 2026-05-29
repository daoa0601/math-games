// ========================================
// Shape Architect - Solution Forge (eager pre-warm)
// ========================================
//
// Pre-compute canonical solutions and write them to KV so the solution server
// function (and, later, hints / guided build) is a cache hit instead of an
// on-request solve. Pure over a minimal KV port so it can run from a scheduled
// worker or a Cloudflare Workflow, and be unit-tested with an in-memory fake.
//
// Lives at the package's `src` root (not under `logic`) to avoid an import
// cycle with `./catalog`, and so consumers can import it via the `./src/*`
// subpath without pulling in the rendering barrel (three.js).

import {
  SOLUTION_CACHE_TTL,
  solutionCacheKey,
  solveLevelToSolution,
} from "./logic/solution";
import type { LevelConfig } from "./logic/types";
import {
  getShapeArchitectCatalog,
  getShapeArchitectPracticeConfig,
} from "./catalog";
import type { ShapeArchitectPracticeDifficulty } from "./catalog";

export interface ForgeKv {
  get: (key: string) => Promise<string | null>;
  put: (
    key: string,
    value: string,
    options: { expirationTtl: number },
  ) => Promise<void>;
}

export interface ForgeReport {
  /** Levels solved and freshly written this run. */
  solved: string[];
  /** Levels skipped because a solution was already cached. */
  cached: string[];
  /** Levels for which no solution was found (unexpected for valid levels). */
  failed: string[];
}

/**
 * Solve and write-through any of the given levels that are not already cached.
 * The shared core behind both the catalog pre-warm and the practice pool.
 */
export async function forgeConfigs(
  configs: LevelConfig[],
  kv: ForgeKv,
  now: () => string = () => new Date().toISOString(),
): Promise<ForgeReport> {
  const report: ForgeReport = { solved: [], cached: [], failed: [] };

  for (const config of configs) {
    const key = solutionCacheKey(config.id);

    if (await kv.get(key)) {
      report.cached.push(config.id);
      continue;
    }

    const solution = solveLevelToSolution(config, { now });
    if (!solution) {
      report.failed.push(config.id);
      continue;
    }

    await kv.put(key, JSON.stringify(solution), {
      expirationTtl: SOLUTION_CACHE_TTL,
    });
    report.solved.push(config.id);
  }

  return report;
}

export async function forgeShapeArchitectSolutions(
  kv: ForgeKv,
  now?: () => string,
): Promise<ForgeReport> {
  return forgeConfigs(getShapeArchitectCatalog().configs, kv, now);
}

export interface PracticeSpec {
  seed: string;
  difficulty: ShapeArchitectPracticeDifficulty;
}

/**
 * A deterministic set of practice levels to pre-warm. Same seeds the player
 * generator uses, so a forged pool entry is a cache hit when they land on it.
 */
export function buildPracticePoolSpecs(
  perDifficulty = 8,
  difficulties: ShapeArchitectPracticeDifficulty[] = ["easy", "medium", "hard"],
): PracticeSpec[] {
  return difficulties.flatMap((difficulty) =>
    Array.from({ length: perDifficulty }, (_unused, index) => ({
      seed: `pool-${index + 1}`,
      difficulty,
    })),
  );
}

export async function forgePracticePool(
  specs: PracticeSpec[],
  kv: ForgeKv,
  now?: () => string,
): Promise<ForgeReport> {
  const configs = specs.map((spec) =>
    getShapeArchitectPracticeConfig(spec.seed, spec.difficulty),
  );
  return forgeConfigs(configs, kv, now);
}
