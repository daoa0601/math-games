import { createSeededRandom } from "@math-games/core";

import { puzzleTemplates } from "./logic";
import type { PuzzleConfig } from "./logic";
import { generateSeededPuzzle } from "./logic/seededGenerator";

export type MagicGraphPracticeDifficulty = "easy" | "medium" | "hard";

export function createMagicGraphPuzzleId(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-");
}

function normalizePracticeSeed(seed: string) {
  return seed
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getMagicGraphCatalog() {
  const configs: PuzzleConfig[] = puzzleTemplates.map((template) => ({
    ...template,
    id: createMagicGraphPuzzleId(template.name),
  }));
  const config =
    configs.find((candidate) => candidate.id === "magic-triangle") ??
    configs[0];

  return {
    config,
    configs,
    initialConfigId: config.id,
  };
}

export function getMagicGraphPracticeConfig(
  seed: string,
  difficulty: MagicGraphPracticeDifficulty = "medium",
) {
  const normalizedSeed = normalizePracticeSeed(seed) || "practice";
  const config = generateSeededPuzzle(
    createSeededRandom(`magic-graph-practice-${normalizedSeed}`),
    difficulty,
  );

  return {
    ...config,
    id: `practice_${difficulty}_${normalizedSeed}`,
    name: `Practice: ${config.name}`,
  };
}
