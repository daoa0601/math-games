import type { LevelManifest } from "@math-games/core";

import type { LevelConfig } from "./logic/types";

const GENERATOR_VERSION = "shape-architect-2026.05.1";

const SHAPE_ARCHITECT_SKILLS = [
  "spatial_decomposition",
  "mental_rotation",
  "2d_3d_translation",
] as const;

const SHAPE_ARCHITECT_MISCONCEPTIONS = ["ignores_rotation"] as const;

/**
 * Build the pedagogical manifest for a shape-architect level: spatial-reasoning
 * skills + structural difficulty features.
 *
 * No embedded solutionTrace: the solver is expensive (DLX/backtrack, forged
 * offline into KV), so shape-architect's solution path is the existing
 * LevelSolution mechanism (solveLevelToSolution + the sa:solution KV cache),
 * served on demand — not a build-time field on the manifest.
 */
export function buildShapeArchitectManifest(
  config: LevelConfig,
): LevelManifest {
  const [width, height, depth] = config.gridSize;

  return {
    skillTags: [...SHAPE_ARCHITECT_SKILLS],
    misconceptionTags: [...SHAPE_ARCHITECT_MISCONCEPTIONS],
    difficultyFeatures: {
      pieceCount: config.pieces.length,
      cellCount: config.targetVoxels.length,
      type: config.type,
      is3D: config.type === "3D",
      gridVolume: width * height * depth,
    },
    gradeBand: "middle",
    gameId: "shape-architect",
    generatorVersion: GENERATOR_VERSION,
  };
}
