import { describe, expect, it } from "vitest";

import {
  firstTargetInColumn,
  nearestProjectedTarget,
  planeHitToCell,
  toScenePosition,
} from "../picking";
import type { GridSize } from "../picking";
import type { CellState } from "../../logic/types";

const GRID: GridSize = [3, 3, 1];

// Build a 3x3x1 grid state where (1,1,0) is the only target.
function singleTargetGrid(): CellState[][][] {
  const grid: CellState[][][] = [];
  for (let x = 0; x < 3; x++) {
    grid[x] = [];
    for (let y = 0; y < 3; y++) {
      grid[x][y] = [x === 1 && y === 1 ? 1 : 0];
    }
  }
  return grid;
}

describe("toScenePosition", () => {
  it("centers the grid at the origin", () => {
    // 3x3 grid: center cell (1,1,0) → scene (0, 0.5, 0)
    const p = toScenePosition({ x: 1, y: 1, z: 0 }, GRID);
    expect(p.x).toBeCloseTo(0, 5);
    expect(p.y).toBeCloseTo(0.5, 5);
    expect(p.z).toBeCloseTo(0, 5);
  });

  it("maps grid (0,0,0) to the corner", () => {
    const p = toScenePosition({ x: 0, y: 0, z: 0 }, GRID);
    expect(p.x).toBeCloseTo(-1, 5);
    expect(p.z).toBeCloseTo(-1, 5);
  });
});

describe("planeHitToCell", () => {
  it("floors the plane hit into grid coordinates", () => {
    // Plane hit at scene (0.4, _, -0.6) → grid (1, 0) for a 3-wide grid.
    expect(planeHitToCell({ x: 0.4, z: -0.6 }, GRID)).toEqual({ x: 1, y: 0 });
  });

  it("returns null when the hit is outside the grid", () => {
    expect(planeHitToCell({ x: 5, z: 5 }, GRID)).toBeNull();
    expect(planeHitToCell({ x: -5, z: 0 }, GRID)).toBeNull();
  });
});

describe("firstTargetInColumn", () => {
  it("returns the only target cell when present", () => {
    const grid = singleTargetGrid();
    expect(firstTargetInColumn(grid, GRID, { x: 1, y: 1 })).toEqual({
      x: 1,
      y: 1,
      z: 0,
    });
  });

  it("returns null for an empty column", () => {
    const grid = singleTargetGrid();
    expect(firstTargetInColumn(grid, GRID, { x: 0, y: 0 })).toBeNull();
  });
});

describe("nearestProjectedTarget", () => {
  it("finds the target when the click is within radius", () => {
    const grid = singleTargetGrid();
    // Identity-ish projection: scene (x,y,z) → ndc (x*0.1, y*0.1).
    // The target cell projects to ~ (0, 0.05).
    const rect = { left: 0, top: 0, width: 1000, height: 1000 };
    const result = nearestProjectedTarget({
      gridState: grid,
      gridSize: GRID,
      project: (p) => ({ x: p.x * 0.1, y: p.y * 0.1 }),
      rect,
      clientX: 500,
      clientY: 500,
    });
    expect(result).toEqual({ x: 1, y: 1, z: 0 });
  });

  it("returns null when the click is outside the radius", () => {
    const grid = singleTargetGrid();
    const rect = { left: 0, top: 0, width: 100, height: 100 };
    const result = nearestProjectedTarget({
      gridState: grid,
      gridSize: GRID,
      project: (p) => ({ x: p.x * 0.1, y: p.y * 0.1 }),
      rect,
      clientX: 5,
      clientY: 5,
      radius: 10,
    });
    expect(result).toBeNull();
  });

  it("returns null when there are no targets", () => {
    const empty: CellState[][][] = [[[0]]];
    const rect = { left: 0, top: 0, width: 100, height: 100 };
    const result = nearestProjectedTarget({
      gridState: empty,
      gridSize: [1, 1, 1],
      project: (p) => ({ x: p.x, y: p.y }),
      rect,
      clientX: 50,
      clientY: 50,
    });
    expect(result).toBeNull();
  });
});
