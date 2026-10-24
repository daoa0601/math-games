import type { LevelManifest } from "@math-games/core";

import type { EquationConfig } from "./catalog";

const GENERATOR_VERSION = "equation-balance-2026.05.1";

const EQUATION_BALANCE_SKILLS = [
  "equality_as_invariant",
  "inverse_operations",
] as const;

const EQUATION_BALANCE_MISCONCEPTIONS = [
  "equals_means_answer_next",
  "one_sided_operation",
] as const;

/**
 * Build the pedagogical manifest for an equation-balance level: the skills and
 * misconceptions it exercises plus structural difficulty features read off the
 * config. Features reflect equation structure — operand/operator/step count and
 * whether the unknown carries a coefficient (an extra inverse step to undo) —
 * since the level is solved closed-form, there is no solver trace to derive.
 */
export function buildEquationBalanceManifest(
  config: EquationConfig,
  seed?: string,
): LevelManifest {
  const operandCount = config.leftTerms.filter((t) => t !== "?").length;

  return {
    skillTags: [...EQUATION_BALANCE_SKILLS],
    misconceptionTags: [...EQUATION_BALANCE_MISCONCEPTIONS],
    difficultyFeatures: {
      mode: config.mode,
      operandCount,
      operatorCount: config.leftOps.length,
      hasVariable: config.leftTerms.includes("?"),
      hasMultiplication: config.leftOps.includes("*"),
      choiceCount: config.choices.length,
    },
    gradeBand: "middle",
    gameId: "equation-balance",
    generatorVersion: GENERATOR_VERSION,
    ...(seed ? { seed } : {}),
  };
}
