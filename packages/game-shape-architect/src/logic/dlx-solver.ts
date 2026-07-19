// ========================================
// DLX Solver — Knuth's Algorithm X with Dancing Links
// Solves the polyomino packing as an exact cover problem.
// ========================================

import type { LevelConfig, Piece, Position3D, Rotation3D } from "./types";
import { rotatePieceLayout3D, isInBounds } from "./engine";
import type { SolutionStep, SolverResult } from "./solver";
import { generate2DRotations, generate3DRotations } from "./solver";

// ========================================
// DLX Data Structures
// ========================================

interface DLXNode {
  left: DLXNode;
  right: DLXNode;
  up: DLXNode;
  down: DLXNode;
  column: DLXColumnHeader;
  /** Index into the rows array for solution tracking */
  rowIndex: number;
}

interface DLXColumnHeader extends DLXNode {
  size: number;
  name: string;
}

interface PlacementRow {
  pieceId: string;
  position: Position3D;
  rotation: Rotation3D;
  /** Which target cell indices this placement covers */
  coveredTargets: number[];
  /** Which piece index (for the piece constraint column) */
  pieceIndex: number;
}

// ========================================
// Build the exact cover matrix
// ========================================

function getUniqueRotatedLayouts(
  piece: Piece,
  rotations: Rotation3D[],
): { layout: Position3D[]; rotation: Rotation3D }[] {
  const seen = new Set<string>();
  const unique: { layout: Position3D[]; rotation: Rotation3D }[] = [];

  for (const rotation of rotations) {
    const rotated = rotatePieceLayout3D(piece.layout, rotation);
    const sorted = [...rotated].sort((a, b) =>
      a.x !== b.x ? a.x - b.x : a.y !== b.y ? a.y - b.y : a.z - b.z,
    );
    const key = sorted.map((p) => `${p.x},${p.y},${p.z}`).join("|");

    if (!seen.has(key)) {
      seen.add(key);
      unique.push({ layout: rotated, rotation });
    }
  }

  return unique;
}

function buildRows(level: LevelConfig): PlacementRow[] {
  const rotations =
    level.type === "3D" ? generate3DRotations() : generate2DRotations();
  const targetIndexMap = new Map<string, number>();
  for (let i = 0; i < level.targetVoxels.length; i++) {
    const t = level.targetVoxels[i];
    targetIndexMap.set(`${t.x},${t.y},${t.z}`, i);
  }

  const rows: PlacementRow[] = [];

  for (let pieceIndex = 0; pieceIndex < level.pieces.length; pieceIndex++) {
    const piece = level.pieces[pieceIndex];
    const uniqueLayouts = getUniqueRotatedLayouts(piece, rotations);

    for (const { layout, rotation } of uniqueLayouts) {
      // Exact-cover anchor optimization: every cell of a valid placement must
      // land on a target, so layout[0] must land on some target T. That gives
      // a unique translation per T (position = T - layout[0]); each candidate
      // is generated exactly once, so no dedup is needed. The previous loop
      // tried every (target, cell) pair as anchor and deduped with rows.some,
      // which was O(targets × cells) work plus an O(rows) scan per candidate.
      const anchor = layout[0];
      for (const target of level.targetVoxels) {
        const originX = target.x - anchor.x;
        const originY = target.y - anchor.y;
        const originZ = target.z - anchor.z;

        // All cells must be in bounds and cover targets.
        const coveredTargets: number[] = [];
        let valid = true;
        for (const cell of layout) {
          const wx = originX + cell.x;
          const wy = originY + cell.y;
          const wz = originZ + cell.z;
          if (!isInBounds({ x: wx, y: wy, z: wz }, level.gridSize)) {
            valid = false;
            break;
          }
          const idx = targetIndexMap.get(`${wx},${wy},${wz}`);
          if (idx === undefined) {
            valid = false;
            break;
          }
          coveredTargets.push(idx);
        }
        if (!valid) continue;

        rows.push({
          pieceId: piece.id,
          position: { x: originX, y: originY, z: originZ },
          rotation,
          coveredTargets,
          pieceIndex,
        });
      }
    }
  }

  return rows;
}

// ========================================
// DLX Construction
// ========================================

function buildDLX(
  rows: PlacementRow[],
  numTargets: number,
  numPieces: number,
): { root: DLXColumnHeader; columns: DLXColumnHeader[]; allRows: DLXNode[][] } {
  const numCols = numTargets + numPieces;

  // Create root header (self-linked circular sentinel)
  const root = makeSelfLinkedHeader("root");

  // Create column headers
  const columns: DLXColumnHeader[] = [];
  for (let i = 0; i < numCols; i++) {
    const col = makeSelfLinkedHeader(
      i < numTargets ? `t${i}` : `p${i - numTargets}`,
    );

    // Link horizontally
    col.left = root.left;
    col.right = root;
    root.left.right = col;
    root.left = col;

    columns.push(col);
  }

  // Add rows
  const allRows: DLXNode[][] = [];
  for (let ri = 0; ri < rows.length; ri++) {
    const row = rows[ri];
    const nodes: DLXNode[] = [];

    // Target columns
    for (const ti of row.coveredTargets) {
      nodes.push(createNode(columns[ti], ri));
    }
    // Piece column
    nodes.push(createNode(columns[numTargets + row.pieceIndex], ri));

    // Link nodes horizontally
    for (let i = 0; i < nodes.length; i++) {
      nodes[i].left = nodes[(i - 1 + nodes.length) % nodes.length];
      nodes[i].right = nodes[(i + 1) % nodes.length];
    }

    allRows.push(nodes);
  }

  return { root, columns, allRows };
}

function makeSelfLinkedHeader(name: string): DLXColumnHeader {
  const h = { size: 0, name, rowIndex: -1 } as Partial<DLXColumnHeader>;
  const header = h as DLXColumnHeader;
  header.left = header;
  header.right = header;
  header.up = header;
  header.down = header;
  header.column = header;
  return header;
}

function createNode(column: DLXColumnHeader, rowIndex: number): DLXNode {
  const n = { rowIndex, column } as Partial<DLXNode>;
  const node = n as DLXNode;
  node.left = node;
  node.right = node;

  // Link vertically into column
  node.up = column.up;
  node.down = column;
  column.up.down = node;
  column.up = node;
  column.size++;

  return node;
}

// ========================================
// DLX Operations
// ========================================

function cover(col: DLXColumnHeader): void {
  col.right.left = col.left;
  col.left.right = col.right;

  let row = col.down;
  while (row !== col) {
    let node = row.right;
    while (node !== row) {
      node.down.up = node.up;
      node.up.down = node.down;
      node.column.size--;
      node = node.right;
    }
    row = row.down;
  }
}

function uncover(col: DLXColumnHeader): void {
  let row = col.up;
  while (row !== col) {
    let node = row.left;
    while (node !== row) {
      node.column.size++;
      node.down.up = node;
      node.up.down = node;
      node = node.left;
    }
    row = row.up;
  }

  col.right.left = col;
  col.left.right = col;
}

function chooseSmallestColumn(root: DLXColumnHeader): DLXColumnHeader | null {
  let best: DLXColumnHeader | null = null;
  let bestSize = Infinity;

  let col = root.right as DLXColumnHeader;
  while (col !== root) {
    if (col.size < bestSize) {
      bestSize = col.size;
      best = col;
    }
    col = col.right as DLXColumnHeader;
  }

  return best;
}

// ========================================
// DLX Search
// ========================================

export function solvePuzzleDLX(
  level: LevelConfig,
  maxTimeMs: number = 5000,
): SolverResult {
  const startTime = performance.now();
  let searchedStates = 0;

  // Edge cases
  if (level.targetVoxels.length === 0) {
    return {
      solvable: true,
      solution: [],
      searchedStates: 0,
      timeMs: 0,
      timedOut: false,
    };
  }

  const targetVolume = level.targetVoxels.length;
  const pieceVolume = level.pieces.reduce((sum, p) => sum + p.layout.length, 0);
  if (pieceVolume !== targetVolume) {
    return {
      solvable: false,
      searchedStates: 0,
      timeMs: performance.now() - startTime,
      timedOut: false,
    };
  }

  // Build the cover matrix
  const rows = buildRows(level);
  if (rows.length === 0) {
    return {
      solvable: false,
      searchedStates: 0,
      timeMs: performance.now() - startTime,
      timedOut: false,
    };
  }

  const { root } = buildDLX(
    rows,
    level.targetVoxels.length,
    level.pieces.length,
  );

  // Search
  const solutionRowIndices: number[] = [];

  function search(): boolean {
    if (performance.now() - startTime > maxTimeMs) return false;

    // All columns covered → solution found
    if (root.right === root) return true;

    const col = chooseSmallestColumn(root);
    if (!col || col.size === 0) return false;

    cover(col);

    let row = col.down;
    while (row !== col) {
      searchedStates++;
      solutionRowIndices.push(row.rowIndex);

      // Cover all columns in this row
      let node = row.right;
      while (node !== row) {
        cover(node.column);
        node = node.right;
      }

      if (search()) return true;

      // Backtrack: uncover columns in reverse order
      node = row.left;
      while (node !== row) {
        uncover(node.column);
        node = node.left;
      }

      solutionRowIndices.pop();

      if (performance.now() - startTime > maxTimeMs) {
        uncover(col);
        return false;
      }

      row = row.down;
    }

    uncover(col);
    return false;
  }

  const found = search();
  const timeMs = performance.now() - startTime;
  const timedOut = timeMs >= maxTimeMs;

  if (found) {
    const solution: SolutionStep[] = solutionRowIndices.map((ri) => ({
      pieceId: rows[ri].pieceId,
      position: rows[ri].position,
      rotation: rows[ri].rotation,
    }));

    return {
      solvable: true,
      solution,
      searchedStates,
      timeMs,
      timedOut: false,
    };
  }

  return { solvable: false, searchedStates, timeMs, timedOut };
}
