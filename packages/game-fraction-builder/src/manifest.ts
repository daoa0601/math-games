import type { LevelManifest } from "@math-games/core";

import type { FractionConfig } from "./catalog";

const GENERATOR_VERSION = "fraction-builder-2026.05.1";

const FRACTION_BUILDER_SKILLS = [
  "rational_magnitude",
  "equivalence",
  "decomposition",
] as const;

const FRACTION_BUILDER_MISCONCEPTIONS = [
  "whole_number_bias",
  "denominator_size_bias",
] as const;

/**
 * Build the pedagogical manifest for a fraction-builder level: the skills and
 * misconceptions it exercises plus structural difficulty features read straight
 * off the config. Fraction-builder is closed-form (no search solver), so there
 * is no solution trace — magnitude, equivalence, and decomposition are the
 * pedagogy, and the structural knobs (mode, denominator size, choice count)
 * stand in for difficulty.
 */
export function buildFractionBuilderManifest(
  config: FractionConfig,
  seed?: string,
): LevelManifest {
  const [targetNumerator, targetDenominator] = config.target;

  return {
    skillTags: [...FRACTION_BUILDER_SKILLS],
    misconceptionTags: [...FRACTION_BUILDER_MISCONCEPTIONS],
    difficultyFeatures: {
      mode: config.mode,
      difficultyTier: config.difficulty,
      targetNumerator,
      targetDenominator,
      choiceCount: config.choices.length,
      isCompare: config.compareTo !== undefined,
    },
    gradeBand: "middle",
    gameId: "fraction-builder",
    generatorVersion: GENERATOR_VERSION,
    ...(seed ? { seed } : {}),
  };
}
