import type { LevelManifest } from "@math-games/core";

import type { PatternConfig } from "./catalog";

const GENERATOR_VERSION = "pattern-detective-2026.05.1";

const PATTERN_DETECTIVE_SKILLS = [
  "functional_thinking",
  "pattern_generalization",
] as const;

const PATTERN_DETECTIVE_MISCONCEPTIONS = ["overfits_few_terms"] as const;

/**
 * Build the pedagogical manifest for a pattern-detective level: the skills and
 * misconception it exercises, plus structural difficulty features read off the
 * config (sequence length, rule kind, where the gap sits, choice spread). The
 * catalog is hand-authored and closed-form, so there is no solution trace.
 */
export function buildPatternDetectiveManifest(
  config: PatternConfig,
): LevelManifest {
  return {
    skillTags: [...PATTERN_DETECTIVE_SKILLS],
    misconceptionTags: [...PATTERN_DETECTIVE_MISCONCEPTIONS],
    difficultyFeatures: {
      termCount: config.sequence.length,
      patternType: config.patternType,
      missingIndex: config.missingIndex,
      missingAtEdge:
        config.missingIndex === 0 ||
        config.missingIndex === config.sequence.length - 1,
      choiceCount: config.distractors.length + 1,
    },
    gradeBand: "middle",
    gameId: "pattern-detective",
    generatorVersion: GENERATOR_VERSION,
  };
}
