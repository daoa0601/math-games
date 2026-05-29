// ========================================
// Shape Architect - Canonical Level Solution
// ========================================
//
// A single, portable representation of "the answer" to a level: the ordered
// placements that fill the target shape, plus the metrics gathered while
// solving. This is the contract shared across the solver, the server-side
// solution cache, and the in-game guided build mode — solve once, reuse
// everywhere instead of re-running the (expensive, timeout-prone) solver.

import type { LevelConfig, PlacedPiece } from "./types";
import { solvePuzzle } from "./solver";
import type { SolutionStep } from "./solver";
import { solvePuzzleDLX } from "./dlx-solver";

export interface LevelSolutionMetrics {
  /** Number of pieces in the level. */
  pieceCount: number;
  /** Number of target cells the solution fills. */
  cellCount: number;
  /** Search nodes explored — a proxy for true difficulty. */
  searchedStates: number;
  /** Wall-clock solve time in milliseconds. */
  timeMs: number;
  /** Which solver produced the solution. */
  algorithm: "dlx" | "backtrack";
}

export interface LevelSolution {
  levelId: string;
  type: LevelConfig["type"];
  /** Ordered placements that solve the level (a valid build order). */
  steps: PlacedPiece[];
  metrics: LevelSolutionMetrics;
  /** ISO-8601 timestamp of when the solution was computed. */
  solvedAt: string;
}

/** Solutions are deterministic per level id, so they can live a long time. */
export const SOLUTION_CACHE_TTL = 60 * 60 * 24 * 30; // 30 days

/** KV key under which a level's cached {@link LevelSolution} lives. */
export function solutionCacheKey(levelId: string): string {
  return `sa:solution:${levelId}`;
}

/**
 * Resolve solver output (which omits color) into renderable placements by
 * attaching each piece's color from the level. Steps referencing an unknown
 * piece id are dropped.
 */
export function solutionStepsToPlacedPieces(
  level: LevelConfig,
  steps: SolutionStep[],
): PlacedPiece[] {
  return steps.flatMap((step) => {
    const piece = level.pieces.find(
      (candidate) => candidate.id === step.pieceId,
    );
    if (!piece) return [];
    return {
      pieceId: step.pieceId,
      position: step.position,
      rotation: step.rotation,
      color: piece.color,
    };
  });
}

export interface SolveLevelOptions {
  /** Per-solver time budget. Defaults to 15s — generous vs. the 5s client cap. */
  maxTimeMs?: number;
  /** Clock injection for deterministic tests. */
  now?: () => string;
}

/**
 * Solve a level into its canonical {@link LevelSolution}, or `null` if no
 * solution is found within budget. Prefers the DLX exact-cover solver and
 * falls back to backtracking when DLX yields nothing (timeout or an awkward
 * instance), so a momentary DLX miss never reports a solvable level as
 * unsolvable.
 */
export function solveLevelToSolution(
  level: LevelConfig,
  options: SolveLevelOptions = {},
): LevelSolution | null {
  const maxTimeMs = options.maxTimeMs ?? 15_000;

  let result = solvePuzzleDLX(level, maxTimeMs);
  let algorithm: LevelSolutionMetrics["algorithm"] = "dlx";

  if (!result.solution) {
    const fallback = solvePuzzle(level, maxTimeMs);
    if (fallback.solution) {
      result = fallback;
      algorithm = "backtrack";
    }
  }

  if (!result.solution) return null;

  return {
    levelId: level.id,
    type: level.type,
    steps: solutionStepsToPlacedPieces(level, result.solution),
    metrics: {
      pieceCount: level.pieces.length,
      cellCount: level.targetVoxels.length,
      searchedStates: result.searchedStates,
      timeMs: result.timeMs,
      algorithm,
    },
    solvedAt: options.now?.() ?? new Date().toISOString(),
  };
}
