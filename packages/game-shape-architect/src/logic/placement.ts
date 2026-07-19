// ========================================
// Shape Architect — Placement state machine (pure)
// ========================================
//
// The shape-architect route previously inlined placement/ghost math inside
// React components and `ShapeArchitect3D`. Extracting it here makes it
// unit-testable and lets the same code path drive the 2D canvas and 3D
// scene, the keyboard handler, and the guided walkthrough. These helpers
// are intentionally pure — no React, no THREE, no DOM.

import type {
  CellState,
  LevelConfig,
  Piece,
  PlacedPiece,
  Position3D,
  Rotation3D,
} from "./types";
import type { VoxelGrid } from "./voxel-grid";
import {
  canPlacePiece,
  findNearestValidPosition,
  getPieceWorldPositions,
  initializeGrid,
  placePiece,
} from "./engine";

/**
 * Build the grid the player sees immediately after a placement, before the
 * server reply lands. Pure derivation from placements.
 */
export function buildOptimisticGrid(
  config: LevelConfig,
  placements: PlacedPiece[],
): VoxelGrid {
  return placements.reduce((grid, placement) => {
    const piece = config.pieces.find((c) => c.id === placement.pieceId);
    return piece
      ? placePiece(grid, piece, placement.position, placement.rotation)
      : grid;
  }, initializeGrid(config));
}

/** A resolved ghost piece: world cells + whether it can be placed now. */
export interface GhostPiece {
  positions: Position3D[];
  isValid: boolean;
}

/**
 * Resolve a candidate ghost piece from a hover/click position. Returns null
 * when no piece is selected or no source position is supplied. When the
 * piece cannot legally fit anywhere near the source, the ghost is drawn at
 * the source with `isValid: false` so the player sees why nothing snapped.
 */
export function resolveGhostPiece(args: {
  grid: VoxelGrid;
  piece: Piece | null;
  source: Position3D | null;
  rotation: Rotation3D;
  gridSize: [number, number, number];
}): GhostPiece | null {
  const { grid, piece, source, rotation, gridSize } = args;
  if (!piece || !source) return null;

  const snapped = findNearestValidPosition(
    grid,
    piece,
    source,
    rotation,
    gridSize,
  );

  return {
    positions: getPieceWorldPositions(piece, snapped ?? source, rotation),
    isValid: snapped !== null,
  };
}

/**
 * Attempt a placement at a candidate position. Returns either the committed
 * placement plus the optimistic grid, or a rejection reason. Pure — does not
 * touch the network. The route wires the result into `validatePlacements`.
 */
export type PlacementOutcome =
  | {
      ok: true;
      placement: PlacedPiece;
      nextPlacements: PlacedPiece[];
      optimisticGrid: VoxelGrid;
    }
  | { ok: false; reason: "no-piece" | "no-position" | "does-not-fit" };

export function attemptPlacement(args: {
  grid: VoxelGrid;
  config: LevelConfig;
  piece: Piece | null;
  source: Position3D | null;
  rotation: Rotation3D;
  placedPieces: PlacedPiece[];
}): PlacementOutcome {
  const { grid, config, piece, source, rotation, placedPieces } = args;
  if (!piece) return { ok: false, reason: "no-piece" };
  if (!source) return { ok: false, reason: "no-position" };

  const position = findNearestValidPosition(
    grid,
    piece,
    source,
    rotation,
    config.gridSize,
  );

  if (
    position === null ||
    !canPlacePiece(grid, piece, position, rotation, config.gridSize)
  ) {
    return { ok: false, reason: "does-not-fit" };
  }

  const placement: PlacedPiece = {
    pieceId: piece.id,
    position,
    rotation,
    color: piece.color,
  };
  const nextPlacements = [...placedPieces, placement];
  return {
    ok: true,
    placement,
    nextPlacements,
    optimisticGrid: buildOptimisticGrid(config, nextPlacements),
  };
}

/**
 * Group filled cells by color so the renderer can emit one InstancedMesh per
 * color (the per-cell loop the route previously reimplemented). Returns cells
 * keyed by color, plus the list of unfilled target cells (state === 1).
 */
export function groupCellsByColor(args: {
  gridState: CellState[][][];
  placedPieces: PlacedPiece[];
  config: LevelConfig;
}): {
  byColor: Map<string, Position3D[]>;
  targets: Position3D[];
} {
  const { gridState, placedPieces, config } = args;

  // Build the color lookup once per call.
  const colorLookup = new Map<string, string>();
  for (const placedPiece of placedPieces) {
    const piece = config.pieces.find((p) => p.id === placedPiece.pieceId);
    if (!piece) continue;
    for (const position of getPieceWorldPositions(
      piece,
      placedPiece.position,
      placedPiece.rotation,
    )) {
      colorLookup.set(
        `${position.x},${position.y},${position.z}`,
        placedPiece.color,
      );
    }
  }

  const byColor = new Map<string, Position3D[]>();
  const targets: Position3D[] = [];

  for (let x = 0; x < gridState.length; x++) {
    const plane = gridState[x];
    for (let y = 0; y < plane.length; y++) {
      const column = plane[y];
      for (let z = 0; z < column.length; z++) {
        const state = column[z];
        if (state === 1) {
          targets.push({ x, y, z });
        } else if (state === 2) {
          const color = colorLookup.get(`${x},${y},${z}`) ?? "#737373";
          const bucket = byColor.get(color);
          if (bucket) bucket.push({ x, y, z });
          else byColor.set(color, [{ x, y, z }]);
        }
      }
    }
  }

  return { byColor, targets };
}
