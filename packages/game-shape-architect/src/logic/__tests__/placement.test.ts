import { describe, expect, it } from "vitest";

import {
  attemptPlacement,
  buildOptimisticGrid,
  groupCellsByColor,
  resolveGhostPiece,
} from "../placement";
import type { GhostPiece } from "../placement";
import { canPlacePiece, initializeGrid } from "../engine";
import type { LevelConfig, Piece, PlacedPiece } from "../types";
import { DEFAULT_ROTATION } from "../types";
import type { VoxelGrid } from "../voxel-grid";

// A small, deterministic 2D level: a 4x1 strip filled by one I-block.
const I_BLOCK: Piece = {
  id: "i",
  name: "I",
  color: "#00BCD4",
  layout: [
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
    { x: 2, y: 0, z: 0 },
    { x: 3, y: 0, z: 0 },
  ],
};

const LEVEL: LevelConfig = {
  id: "test-strip",
  name: "Strip",
  difficulty: "easy",
  type: "2D",
  gridSize: [4, 1, 1],
  pieces: [I_BLOCK],
  targetVoxels: [
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
    { x: 2, y: 0, z: 0 },
    { x: 3, y: 0, z: 0 },
  ],
};

function emptyGrid(): VoxelGrid {
  return initializeGrid(LEVEL);
}

describe("buildOptimisticGrid", () => {
  it("marks placed cells as filled (state 2) and leaves the rest as targets", () => {
    const placements: PlacedPiece[] = [
      {
        pieceId: "i",
        position: { x: 0, y: 0, z: 0 },
        rotation: DEFAULT_ROTATION,
        color: "#00BCD4",
      },
    ];
    const grid = buildOptimisticGrid(LEVEL, placements);
    expect(grid.get(0, 0, 0)).toBe(2);
    expect(grid.get(1, 0, 0)).toBe(2);
    expect(grid.get(2, 0, 0)).toBe(2);
    expect(grid.get(3, 0, 0)).toBe(2);
  });

  it("ignores placements referencing an unknown piece", () => {
    const placements: PlacedPiece[] = [
      {
        pieceId: "nope",
        position: { x: 0, y: 0, z: 0 },
        rotation: DEFAULT_ROTATION,
        color: "#000000",
      },
    ];
    const grid = buildOptimisticGrid(LEVEL, placements);
    expect(grid.get(0, 0, 0)).toBe(1); // still a target
  });
});

describe("resolveGhostPiece", () => {
  it("returns null when no piece is selected", () => {
    const ghost = resolveGhostPiece({
      grid: emptyGrid(),
      piece: null,
      source: { x: 0, y: 0, z: 0 },
      rotation: DEFAULT_ROTATION,
      gridSize: LEVEL.gridSize,
    });
    expect(ghost).toBeNull();
  });

  it("returns null when no source is supplied", () => {
    const ghost = resolveGhostPiece({
      grid: emptyGrid(),
      piece: I_BLOCK,
      source: null,
      rotation: DEFAULT_ROTATION,
      gridSize: LEVEL.gridSize,
    });
    expect(ghost).toBeNull();
  });

  it("snaps a valid hover to the piece footprint", () => {
    const ghost = resolveGhostPiece({
      grid: emptyGrid(),
      piece: I_BLOCK,
      source: { x: 0, y: 0, z: 0 },
      rotation: DEFAULT_ROTATION,
      gridSize: LEVEL.gridSize,
    }) as GhostPiece;
    expect(ghost.isValid).toBe(true);
    expect(ghost.positions).toHaveLength(4);
    expect(ghost.positions[0]).toEqual({ x: 0, y: 0, z: 0 });
  });

  it("draws an invalid ghost at the source when the piece cannot fit", () => {
    // Place the I-block, then hover on the filled cell — no legal spot.
    const grid = buildOptimisticGrid(LEVEL, [
      {
        pieceId: "i",
        position: { x: 0, y: 0, z: 0 },
        rotation: DEFAULT_ROTATION,
        color: "#00BCD4",
      },
    ]);
    const ghost = resolveGhostPiece({
      grid,
      piece: I_BLOCK,
      source: { x: 0, y: 0, z: 0 },
      rotation: DEFAULT_ROTATION,
      gridSize: LEVEL.gridSize,
    }) as GhostPiece;
    expect(ghost.isValid).toBe(false);
  });
});

describe("attemptPlacement", () => {
  it("rejects when no piece is selected", () => {
    const outcome = attemptPlacement({
      grid: emptyGrid(),
      config: LEVEL,
      piece: null,
      source: { x: 0, y: 0, z: 0 },
      rotation: DEFAULT_ROTATION,
      placedPieces: [],
    });
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.reason).toBe("no-piece");
  });

  it("rejects when no source position is supplied", () => {
    const outcome = attemptPlacement({
      grid: emptyGrid(),
      config: LEVEL,
      piece: I_BLOCK,
      source: null,
      rotation: DEFAULT_ROTATION,
      placedPieces: [],
    });
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.reason).toBe("no-position");
  });

  it("commits a legal placement and produces an optimistic grid", () => {
    const outcome = attemptPlacement({
      grid: emptyGrid(),
      config: LEVEL,
      piece: I_BLOCK,
      source: { x: 1, y: 0, z: 0 },
      rotation: DEFAULT_ROTATION,
      placedPieces: [],
    });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.placement.pieceId).toBe("i");
    expect(outcome.nextPlacements).toHaveLength(1);
    expect(outcome.optimisticGrid.get(0, 0, 0)).toBe(2);
  });

  it("rejects when the piece does not fit near the source", () => {
    const grid = buildOptimisticGrid(LEVEL, [
      {
        pieceId: "i",
        position: { x: 0, y: 0, z: 0 },
        rotation: DEFAULT_ROTATION,
        color: "#00BCD4",
      },
    ]);
    const outcome = attemptPlacement({
      grid,
      config: LEVEL,
      piece: I_BLOCK,
      source: { x: 0, y: 0, z: 0 },
      rotation: DEFAULT_ROTATION,
      placedPieces: [
        {
          pieceId: "i",
          position: { x: 0, y: 0, z: 0 },
          rotation: DEFAULT_ROTATION,
          color: "#00BCD4",
        },
      ],
    });
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.reason).toBe("does-not-fit");
  });
});

describe("groupCellsByColor", () => {
  it("puts filled cells into per-color buckets and lists unfilled targets", () => {
    const placedPieces: PlacedPiece[] = [
      {
        pieceId: "i",
        position: { x: 0, y: 0, z: 0 },
        rotation: DEFAULT_ROTATION,
        color: "#00BCD4",
      },
    ];
    const gridState = buildOptimisticGrid(LEVEL, placedPieces).toNestedArray();
    const { byColor, targets } = groupCellsByColor({
      gridState,
      placedPieces,
      config: LEVEL,
    });
    expect(targets).toEqual([]); // all targets are filled
    expect(byColor.get("#00BCD4")).toHaveLength(4);
  });

  it("treats unknown-color filled cells as neutral grey", () => {
    // Mark a cell filled without a matching placement so the lookup misses.
    const grid = emptyGrid();
    grid.set(0, 0, 0, 2);
    const gridState = grid.toNestedArray();
    const { byColor, targets } = groupCellsByColor({
      gridState,
      placedPieces: [],
      config: LEVEL,
    });
    expect(byColor.get("#737373")).toEqual([{ x: 0, y: 0, z: 0 }]);
    expect(targets).toHaveLength(3);
  });
});

// sanity-check that canPlacePiece stays in scope (re-export sanity)
it("canPlacePiece is importable and returns false on out-of-bounds", () => {
  const ok = canPlacePiece(
    emptyGrid(),
    I_BLOCK,
    { x: 99, y: 99, z: 99 },
    DEFAULT_ROTATION,
    LEVEL.gridSize,
  );
  expect(ok).toBe(false);
});
