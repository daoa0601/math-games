// Verify hand-designed hard silhouettes. Each shape is a recognizable
// silhouette (Arrow, Plus, Stair-Step, Picture Frame, Fish) with a cell count
// divisible by 4 so standard tetrominoes can tile it. The script confirms
// solvability and reports solver effort as a difficulty proxy.
//
// Run: corepack pnpm --filter @math-games/game-shape-architect exec \
//      tsx scripts/verify-hard-levels.ts

import type { LevelConfig, Piece, Position3D } from "../src/logic/types";
import { solvePuzzleDLX } from "../src/logic/dlx-solver";
import { solvePuzzle } from "../src/logic/solver";

// Inline piece factories — match packages/game-shape-architect/src/logic/presets.ts.
const PIECE = {
  I: (id: string, color: string): Piece => ({
    id,
    name: "I-Block",
    color,
    layout: [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 },
      { x: 3, y: 0, z: 0 },
    ],
  }),
  O: (id: string, color: string): Piece => ({
    id,
    name: "O-Block",
    color,
    layout: [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 1, z: 0 },
    ],
  }),
  T: (id: string, color: string): Piece => ({
    id,
    name: "T-Block",
    color,
    layout: [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 },
      { x: 1, y: 1, z: 0 },
    ],
  }),
  S: (id: string, color: string): Piece => ({
    id,
    name: "S-Block",
    color,
    layout: [
      { x: 1, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 1, z: 0 },
    ],
  }),
  Z: (id: string, color: string): Piece => ({
    id,
    name: "Z-Block",
    color,
    layout: [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 2, y: 1, z: 0 },
    ],
  }),
  J: (id: string, color: string): Piece => ({
    id,
    name: "J-Block",
    color,
    layout: [
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 2, y: 1, z: 0 },
    ],
  }),
  L: (id: string, color: string): Piece => ({
    id,
    name: "L-Block",
    color,
    layout: [
      { x: 2, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 2, y: 1, z: 0 },
    ],
  }),
};

function voxels(rows: string[]): Position3D[] {
  // rows[0] = TOP row. y grows downward in display, upward in world.
  // So world y = (rows.length - rowIndex).
  const out: Position3D[] = [];
  for (let r = 0; r < rows.length; r++) {
    const y = rows.length - r;
    for (let x = 0; x < rows[r].length; x++) {
      if (rows[r][x] === "#") out.push({ x: x + 1, y, z: 0 });
    }
  }
  return out;
}

const PALETTE = [
  "#00BCD4",
  "#26A69A",
  "#FFEB3B",
  "#FFC107",
  "#9C27B0",
  "#4CAF50",
  "#2196F3",
  "#E91E63",
  "#FF9800",
  "#7C4DFF",
];

function makePieces(prefix: string, count: number): Piece[] {
  // Use a varied mix of piece shapes so the puzzle isn't trivially one-kind.
  const kinds = [
    PIECE.T,
    PIECE.L,
    PIECE.J,
    PIECE.S,
    PIECE.Z,
    PIECE.I,
    PIECE.O,
    PIECE.T,
    PIECE.L,
    PIECE.J,
  ];
  return Array.from({ length: count }, (_, i) =>
    kinds[i % kinds.length](`${prefix}${i + 1}`, PALETTE[i % PALETTE.length]),
  );
}

const candidates: Array<{ id: string; name: string; rows: string[] }> = [
  {
    id: "hard_arrow",
    name: "Arrow",
    // Up arrow: 5 rows. Counts: 1+3+5+3+3 = 15... need divisible by 4.
    // Make it 1+3+5+5+2 = 16:
    rows: ["..#..", ".###.", "#####", "#####", "..#.."],
    // Count: 1+3+5+5+1 = 15. Off. Let me build carefully below in code.
  },
];

// Build shapes programmatically with verified cell counts.
function arrowShape(): Position3D[] {
  // Up arrow: tip(1) + row2(3) + body row(5) + body row(5) + stem(1) + stem(1) = 16
  const out: Position3D[] = [];
  const cx = 3; // center x (1-based, in a 5-wide grid)
  // Tip
  out.push({ x: cx, y: 7, z: 0 });
  // Row 2 (3 wide)
  for (let dx = -1; dx <= 1; dx++) out.push({ x: cx + dx, y: 6, z: 0 });
  // Body rows (5 wide)
  for (let dx = -2; dx <= 2; dx++) out.push({ x: cx + dx, y: 5, z: 0 });
  for (let dx = -2; dx <= 2; dx++) out.push({ x: cx + dx, y: 4, z: 0 });
  // Stem
  out.push({ x: cx, y: 3, z: 0 });
  out.push({ x: cx, y: 2, z: 0 });
  return out; // 1+3+5+5+1+1 = 16
}

function plusShape(): Position3D[] {
  // Plus: vertical bar 5 tall, horizontal bar 5 wide, sharing center = 5+5-1 = 9...
  // Need divisible by 4. Make arms 2 wide: each arm = 4 cells, center = 4 cells (2x2).
  // Total = 4 + 4 + 4 + 4 + 4(center already counted) — recompute.
  // 2-wide plus in 6x6: rows top→bot: .##. / .##. / #### / #### / .##. / .##.
  // = 2+2+4+4+2+2 = 16 ✓
  return voxels([".##.", ".##.", "####", "####", ".##.", ".##."]);
}

function stairShape(): Position3D[] {
  // Staircase going down-right. 4 steps × 4 cells each = 16.
  // rows (top→bot, 7 wide):
  // "####..."  (4)
  // "####..."  (4)  -- 2-row step
  // "...####"  (4)
  // "...####"  (4)  -- 2-row step
  // = 16 ✓ but it's just two blocks offset. Make a real staircase:
  // "###...." (3)
  // "###...." (3)
  // ".###..." (3)
  // ".###..." (3)
  // "..###.." (3)
  // "..###.." (3)  = 18 — not /4.
  // Use 4 steps of 1 row each, 4 wide:
  // "####..."
  // " ####.."  → can't have leading space mismatch. Use offset blocks:
  return voxels([
    "####...",
    "####...",
    ".####..",
    ".####..",
    "..####.",
    "..####.",
  ]);
  // = 4+4+4+4+4+4 = 24 ✓ (6 tetrominoes)
}

function fishShape(): Position3D[] {
  // Fish: body (4x2) + tail (2x2) = 8 + 4 = 12. Add an eye row.
  // "##..##"  body-top with eye gap
  // "######"  body-mid
  // "######"  body-mid
  // "##..##"  body-bot
  // = 4+6+6+4 = 20 ✓ (5 tetrominoes)
  return voxels(["##..##", "######", "######", "##..##"]);
}

function frameShape(): Position3D[] {
  // 6x6 frame with 4x4 hole. = 36 - 16 = 20 ✓
  return voxels(["######", "#....#", "#....#", "#....#", "#....#", "######"]);
}

const designs: Array<{
  id: string;
  name: string;
  target: Position3D[];
  pieceCount: number;
}> = [
  { id: "hard_arrow", name: "Arrow", target: arrowShape(), pieceCount: 4 },
  { id: "hard_plus", name: "Big Plus", target: plusShape(), pieceCount: 4 },
  { id: "hard_stair", name: "Staircase", target: stairShape(), pieceCount: 6 },
  { id: "hard_fish", name: "Fish", target: fishShape(), pieceCount: 5 },
  {
    id: "hard_frame",
    name: "Picture Frame",
    target: frameShape(),
    pieceCount: 5,
  },
];

console.log();
console.log("Verifying hand-designed hard silhouettes:");
console.log("=".repeat(60));

for (const d of designs) {
  const width = Math.max(...d.target.map((p) => p.x));
  const height = Math.max(...d.target.map((p) => p.y));
  const pieces = makePieces(d.id, d.pieceCount);
  const pieceVolume = pieces.reduce((s, p) => s + p.layout.length, 0);

  const level: LevelConfig = {
    id: d.id,
    name: d.name,
    difficulty: "hard",
    type: "2D",
    gridSize: [width + 2, height + 2, 1],
    targetVoxels: d.target,
    pieces,
  };

  console.log(`\n${d.id} (${d.name})`);
  console.log(`  cells=${d.target.length}, pieceVolume=${pieceVolume}`);
  if (d.target.length !== pieceVolume) {
    console.log(
      `  ✗ VOLUME MISMATCH (need ${pieceVolume} cells, got ${d.target.length})`,
    );
    continue;
  }

  const dlx = solvePuzzleDLX(level, 10_000);
  const bt = solvePuzzle(level, 10_000);
  const solvable = dlx.solvable || bt.solvable;
  console.log(
    `  ${solvable ? "✓ SOLVABLE" : "✗ UNSOLVABLE"}  ` +
      `DLX: ${dlx.solvable ? "yes" : "no"} (${dlx.searchedStates} states)  ` +
      `BT: ${bt.solvable ? "yes" : "no"} (${bt.searchedStates} states)`,
  );

  // Render the silhouette.
  const minX = Math.min(...d.target.map((p) => p.x));
  const minY = Math.min(...d.target.map((p) => p.y));
  const w = Math.max(...d.target.map((p) => p.x)) - minX + 1;
  const h = Math.max(...d.target.map((p) => p.y)) - minY + 1;
  const grid: string[][] = Array.from({ length: h }, () =>
    Array.from({ length: w }, () => "."),
  );
  for (const p of d.target) grid[p.y - minY][p.x - minX] = "#";
  for (const row of grid.reverse()) console.log("  " + row.join(""));

  // Dump pieces for pasting into presets.ts.
  console.log("  pieces (TS):");
  console.log("    " + JSON.stringify(d.target));
}
console.log();
