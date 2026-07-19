// ========================================
// Shape Architect — Grid picking math (pure)
// ========================================
//
// The 3D scene used to (a) project every target cell to screen on every
// mousemove to find the nearest, and (b) recompute scene-space conversion
// inline. Extracting the math here keeps three-scene thin, makes the
// picking rule unit-testable, and lets the 2D canvas reuse it if needed.

import type { CellState, Position3D } from "../logic/types";

export type GridSize = readonly [number, number, number];

/**
 * Convert grid cell (x, y, z) into a scene-space position. The y axis points
 * up in world space; z is the in-plane "depth" row.
 */
export function toScenePosition(
  position: Position3D,
  gridSize: GridSize,
): { x: number; y: number; z: number } {
  const [width, height] = gridSize;
  return {
    x: position.x - width / 2 + 0.5,
    y: position.z + 0.5,
    z: position.y - height / 2 + 0.5,
  };
}

/**
 * Find the target cell whose screen-space projection is nearest to a given
 * client coordinate. Used as a fallback when the ray-plane intersection
 * misses. Returns null when no target cell is within the radius.
 *
 * Pure: callers pass in a projector so this stays decoupled from THREE.
 */
export function nearestProjectedTarget(args: {
  gridState: CellState[][][];
  gridSize: GridSize;
  /** Project a scene-space point to NDC; caller supplies the camera math. */
  project: (p: { x: number; y: number; z: number }) => {
    x: number;
    y: number;
  };
  /** Canvas rect, in client coordinates. */
  rect: { left: number; top: number; width: number; height: number };
  clientX: number;
  clientY: number;
  /** Snap radius in CSS pixels. Default 96. */
  radius?: number;
}): Position3D | null {
  const { gridState, gridSize, project, rect, clientX, clientY } = args;
  const radius = args.radius ?? 96;
  const [width, height, depth] = gridSize;

  let best: { position: Position3D; distance: number } | null = null;

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      for (let z = 0; z < depth; z++) {
        if ((gridState[x]?.[y]?.[z] ?? 0) !== 1) continue;

        const scene = toScenePosition({ x, y, z }, gridSize);
        const ndc = project(scene);
        const screenX = rect.left + ((ndc.x + 1) / 2) * rect.width;
        const screenY = rect.top + ((1 - ndc.y) / 2) * rect.height;
        const distance = Math.hypot(clientX - screenX, clientY - screenY);

        if (!best || distance < best.distance) {
          best = { position: { x, y, z }, distance };
        }
      }
    }
  }

  return best && best.distance <= radius ? best.position : null;
}

/**
 * Resolve a hit point in the ground plane (y=0) back to a grid cell. Returns
 * the (x, y) grid coordinate or null if outside the grid. The caller then
 * selects a target cell in that column (see {@link firstTargetInColumn}).
 */
export function planeHitToCell(
  hit: { x: number; z: number },
  gridSize: GridSize,
): { x: number; y: number } | null {
  const [width, height] = gridSize;
  const x = Math.floor(hit.x + width / 2);
  const y = Math.floor(hit.z + height / 2);
  if (x < 0 || x >= width || y < 0 || y >= height) return null;
  return { x, y };
}

/**
 * First target cell (state === 1) in a column, scanning z bottom-up. Used by
 * the 3D picker to choose which stacked cell a click targets.
 */
export function firstTargetInColumn(
  gridState: CellState[][][],
  gridSize: GridSize,
  cell: { x: number; y: number },
): Position3D | null {
  const [, , depth] = gridSize;
  for (let z = 0; z < depth; z++) {
    if ((gridState[cell.x]?.[cell.y]?.[z] ?? 0) === 1) {
      return { x: cell.x, y: cell.y, z };
    }
  }
  return null;
}
