import type { LevelManifest, SolutionStep } from "@math-games/core";

import { analyzePosition, applyMove, createGameState } from "./logic";
import type { GameConfig } from "./logic/types";

const GENERATOR_VERSION = "sequence-race-2026.05.1";

const SEQUENCE_RACE_SKILLS = ["functional_thinking", "explicit_rule"] as const;

const SEQUENCE_RACE_MISCONCEPTIONS = ["overfits_few_terms"] as const;

/**
 * Derive an optimal-play line (principal variation) as a keyed trace: from the
 * initial state, take each side's minimax-optimal move until the game ends.
 * Deterministic — analyzePosition is pure minimax with no randomness. The trace
 * is SERVER-ONLY (stripped before the catalog reaches the browser).
 */
export function deriveSequenceRaceTrace(config: GameConfig): SolutionStep[] {
  let state = createGameState(config);
  const steps: SolutionStep[] = [];

  // Each move consumes one step from the pool, so the line is bounded.
  for (let i = 0; i < config.stepPool.length && !state.gameOver; i++) {
    const { bestMove } = analyzePosition(state);
    if (bestMove === null) break;

    const actor = state.turn;
    state = applyMove(state, bestMove);
    steps.push({
      labelKey: "trace.optimalMove",
      params: { actor, step: bestMove, position: state.currentPosition },
      data: { actor, step: bestMove, position: state.currentPosition },
    });
  }

  return steps;
}

/**
 * Build the pedagogical manifest for a sequence-race level: the skills and
 * misconception it exercises, structural difficulty features read off the
 * config, and a server-only optimal-play solutionTrace from the minimax engine.
 */
export function buildSequenceRaceManifest(config: GameConfig): LevelManifest {
  const stepPoolSum = config.stepPool.reduce((sum, step) => sum + step, 0);
  const solutionTrace = deriveSequenceRaceTrace(config);

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
    ...(solutionTrace.length > 0 ? { solutionTrace } : {}),
  };
}
