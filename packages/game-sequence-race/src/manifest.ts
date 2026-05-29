import type { LevelManifest } from "@math-games/core";

import type { GameConfig } from "./logic/types";

const GENERATOR_VERSION = "sequence-race-2026.05.1";

const SEQUENCE_RACE_SKILLS = ["functional_thinking", "explicit_rule"] as const;

const SEQUENCE_RACE_MISCONCEPTIONS = ["overfits_few_terms"] as const;

/**
 * Build the pedagogical manifest for a sequence-race level: the skills and
 * misconception it exercises plus structural difficulty features read off the
 * config. No solution trace yet — the minimax engine drives a later interactive
 * pass; this slice only carries tags and structural signals.
 */
export function buildSequenceRaceManifest(config: GameConfig): LevelManifest {
  const stepPoolSum = config.stepPool.reduce((sum, step) => sum + step, 0);

  return {
    skillTags: [...SEQUENCE_RACE_SKILLS],
    misconceptionTags: [...SEQUENCE_RACE_MISCONCEPTIONS],
    difficultyFeatures: {
      target: config.target,
      stepPoolSize: config.stepPool.length,
      maxStep: Math.max(...config.stepPool),
      stepPoolSum,
      sequenceType: config.sequenceType ?? "arithmetic",
      aiMovesFirst: config.aiMovesFirst ?? false,
    },
    gradeBand: "middle",
    gameId: "sequence-race",
    generatorVersion: GENERATOR_VERSION,
  };
}
