import { describe, it, expect } from "vitest";

import { getShapeArchitectCatalog } from "../../catalog";
import { checkSolved, initializeGrid, placePiece } from "../engine";
import { solveLevelToSolution, solutionStepsToPlacedPieces } from "../solution";
import type { LevelConfig } from "../types";

const { configs } = getShapeArchitectCatalog();

function replay(
  level: LevelConfig,
  steps: {
    pieceId: string;
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number };
  }[],
) {
  return steps.reduce((grid, step) => {
    const piece = level.pieces.find(
      (candidate) => candidate.id === step.pieceId,
    );
    return piece ? placePiece(grid, piece, step.position, step.rotation) : grid;
  }, initializeGrid(level));
}

describe("solveLevelToSolution", () => {
  it.each(configs.map((config) => [config.id, config] as const))(
    "produces a solution that fills %s",
    (_id, config) => {
      const solution = solveLevelToSolution(config);

      expect(solution).not.toBeNull();
      expect(solution!.levelId).toBe(config.id);
      expect(solution!.type).toBe(config.type);

      // Replaying the steps must fully cover the target shape.
      const grid = replay(config, solution!.steps);
      expect(checkSolved(grid, config.targetVoxels)).toBe(true);
    },
  );

  it("reports metrics and an injectable timestamp", () => {
    const config = configs[0];
    const solution = solveLevelToSolution(config, {
      now: () => "2026-01-01T00:00:00.000Z",
    });

    expect(solution).not.toBeNull();
    expect(solution!.solvedAt).toBe("2026-01-01T00:00:00.000Z");
    expect(solution!.metrics.cellCount).toBe(config.targetVoxels.length);
    expect(solution!.metrics.pieceCount).toBe(config.pieces.length);
    expect(["dlx", "backtrack"]).toContain(solution!.metrics.algorithm);
  });
});

describe("solutionStepsToPlacedPieces", () => {
  it("attaches each piece's color and drops unknown pieces", () => {
    const config = configs[0];
    const known = config.pieces[0];

    const placed = solutionStepsToPlacedPieces(config, [
      {
        pieceId: known.id,
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
      },
      {
        pieceId: "does-not-exist",
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
      },
    ]);

    expect(placed).toHaveLength(1);
    expect(placed[0]).toMatchObject({ pieceId: known.id, color: known.color });
  });
});
