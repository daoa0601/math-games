import { createSeededRandom } from "@math-games/core";

import { generateGuaranteedSolvableWithRetry } from "./logic/seededGenerator";
import { presetLevels } from "./logic/presets";
import type { LevelConfig } from "./logic/types";
import { buildShapeArchitectManifest } from "./manifest";

export type ShapeArchitectPracticeDifficulty = "easy" | "medium" | "hard";

const generatedCatalogSeeds = [
  ["starter-fitted-blocks", "easy"],
  ["bridge-and-corners", "medium"],
  ["pentomino-yard", "hard"],
] as const;

function normalizePracticeSeed(seed: string) {
  return seed
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getShapeArchitectCatalog() {
  const generatedConfigs = generatedCatalogSeeds.map(([seed, difficulty]) => {
    const config = generateGuaranteedSolvableWithRetry(
      createSeededRandom(`shape-architect-catalog-${seed}`),
      difficulty,
    );

    return {
      ...config,
      id: `catalog_${difficulty}_${seed}`,
      name: `Workshop: ${config.name}`,
    };
  });
  const configs: LevelConfig[] = [...generatedConfigs, ...presetLevels].map(
    (c) => ({ ...c, manifest: buildShapeArchitectManifest(c) }),
  );
  const config = configs[0];

  return {
    config,
    configs,
    initialConfigId: config.id,
  };
}

export function getShapeArchitectPracticeConfig(
  seed: string,
  difficulty: ShapeArchitectPracticeDifficulty = "medium",
) {
  const normalizedSeed = normalizePracticeSeed(seed) || "practice";
  const config = generateGuaranteedSolvableWithRetry(
    createSeededRandom(`shape-architect-practice-${normalizedSeed}`),
    difficulty,
  );

  const base: LevelConfig = {
    ...config,
    id: `practice_${difficulty}_${normalizedSeed}`,
    name: `Practice: ${config.name}`,
  };
  return { ...base, manifest: buildShapeArchitectManifest(base) };
}
