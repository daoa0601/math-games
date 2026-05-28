import type { Difficulty, LevelConfig } from "./types";
import type { SeededRandom } from "@math-games/core";
import { createDailyRandom, createSeededRandom } from "@math-games/core";
import {
  generateConstructivePuzzle,
  PUZZLE_ENGINE_CONSTANTS,
} from "./seeded-level-generator";
import { presetLevels } from "./presets";

const MAX_RETRY_ATTEMPTS = 10;

export function generateCohesivePuzzle(
  rng: SeededRandom,
  difficulty: Difficulty,
): LevelConfig | null {
  return generateConstructivePuzzle(rng, difficulty);
}

export function generateGuaranteedSolvableWithRetry(
  rng: SeededRandom,
  difficulty: Difficulty,
): LevelConfig {
  for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt++) {
    const result = generateConstructivePuzzle(rng, difficulty);

    if (result) {
      return result;
    }

    rng.next();
  }

  return getFallbackPreset(rng, difficulty);
}

function getFallbackPreset(
  rng: SeededRandom,
  difficulty: Difficulty,
): LevelConfig {
  const fallbackDifficulty =
    difficulty === "expert" || difficulty === "master" ? "hard" : difficulty;
  const matchingPresets = presetLevels.filter(
    (level) => level.difficulty === fallbackDifficulty && level.type === "2D",
  );
  const candidates =
    matchingPresets.length > 0
      ? matchingPresets
      : presetLevels.filter((level) => level.type === "2D");
  const selected = rng.pick(candidates);

  return {
    ...selected,
    id: `daily_fallback_${rng.seed}`,
    name: `Daily Challenge (${selected.name})`,
  };
}

export function getDailyShapeArchitectLevel(date?: string): LevelConfig {
  const dateStr = date ?? new Date().toISOString().split("T")[0];
  const rng = createDailyRandom(dateStr, "shape-architect");

  return generateGuaranteedSolvableWithRetry(rng, "medium");
}

export function previewDailyLevel(daysFromNow: number = 0): LevelConfig {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  const dateStr = date.toISOString().split("T")[0];
  return getDailyShapeArchitectLevel(dateStr);
}

export const GENERATOR_CONSTANTS = {
  MAX_RETRY_ATTEMPTS,
  PIECE_COUNT_RANGE: PUZZLE_ENGINE_CONSTANTS.PIECE_COUNT_RANGE,
} as const;

export function generateValidatedLevelForTesting(
  baseSeed: string,
  difficulty: Difficulty,
): LevelConfig {
  const rng = createSeededRandom(baseSeed);
  return generateGuaranteedSolvableWithRetry(rng, difficulty);
}
