import type { Difficulty, LevelConfig, Piece, Position3D } from "./types";
import type { SeededRandom } from "@math-games/core";
import { getPieceWorldPositions, rotatePieceLayout3D } from "./engine";

interface PieceTemplate {
  name: string;
  layout: Position3D[];
}

const PIECE_COLORS = [
  "#00BCD4",
  "#F44336",
  "#4CAF50",
  "#FF9800",
  "#9C27B0",
  "#2196F3",
  "#795548",
  "#E91E63",
  "#26A69A",
  "#3F51B5",
];

const PIECE_COUNT_RANGE: Record<Difficulty, [number, number]> = {
  easy: [3, 4],
  medium: [5, 6],
  hard: [7, 8],
  expert: [6, 8],
  master: [5, 7],
};

const ROTATIONS_2D = [
  { x: 0, y: 0, z: 0 },
  { x: 0, y: 0, z: 90 },
  { x: 0, y: 0, z: 180 },
  { x: 0, y: 0, z: 270 },
];

const ADJACENT_2D = [
  { x: 1, y: 0, z: 0 },
  { x: -1, y: 0, z: 0 },
  { x: 0, y: 1, z: 0 },
  { x: 0, y: -1, z: 0 },
];

const TETROMINOES: PieceTemplate[] = [
  {
    name: "I-Block",
    layout: [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 },
      { x: 3, y: 0, z: 0 },
    ],
  },
  {
    name: "T-Block",
    layout: [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 },
      { x: 1, y: 1, z: 0 },
    ],
  },
  {
    name: "L-Block",
    layout: [
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 0, y: 2, z: 0 },
      { x: 1, y: 2, z: 0 },
    ],
  },
  {
    name: "J-Block",
    layout: [
      { x: 1, y: 0, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 1, y: 2, z: 0 },
      { x: 0, y: 2, z: 0 },
    ],
  },
  {
    name: "S-Block",
    layout: [
      { x: 1, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 1, z: 0 },
    ],
  },
  {
    name: "Z-Block",
    layout: [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 2, y: 1, z: 0 },
    ],
  },
];

const PENTOMINOES: PieceTemplate[] = [
  {
    name: "F-Pento",
    layout: [
      { x: 1, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 1, y: 2, z: 0 },
    ],
  },
  {
    name: "P-Pento",
    layout: [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 0, y: 2, z: 0 },
    ],
  },
  {
    name: "U-Pento",
    layout: [
      { x: 0, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 2, y: 1, z: 0 },
    ],
  },
  {
    name: "W-Pento",
    layout: [
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 1, y: 2, z: 0 },
      { x: 2, y: 2, z: 0 },
    ],
  },
  {
    name: "V-Pento",
    layout: [
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 0, y: 2, z: 0 },
      { x: 1, y: 2, z: 0 },
      { x: 2, y: 2, z: 0 },
    ],
  },
  {
    name: "Y-Pento",
    layout: [
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 1, y: 2, z: 0 },
      { x: 1, y: 3, z: 0 },
    ],
  },
  {
    name: "N-Pento",
    layout: [
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 1, y: 2, z: 0 },
      { x: 1, y: 3, z: 0 },
    ],
  },
];

const HEXOMINOES: PieceTemplate[] = [
  {
    name: "Hook-Hex",
    layout: [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 1, y: 2, z: 0 },
      { x: 1, y: 3, z: 0 },
      { x: 2, y: 3, z: 0 },
    ],
  },
  {
    name: "Stair-Hex",
    layout: [
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 1, y: 2, z: 0 },
      { x: 2, y: 2, z: 0 },
      { x: 2, y: 3, z: 0 },
    ],
  },
  {
    name: "Cross-Hex",
    layout: [
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 2, y: 1, z: 0 },
      { x: 1, y: 2, z: 0 },
      { x: 1, y: 3, z: 0 },
    ],
  },
];

function getTemplateBank(difficulty: Difficulty): PieceTemplate[] {
  if (difficulty === "easy") return TETROMINOES;
  if (difficulty === "medium") return [...TETROMINOES, ...PENTOMINOES];
  return [...PENTOMINOES, ...HEXOMINOES];
}

function keyOf(pos: Position3D): string {
  return `${pos.x},${pos.y},${pos.z}`;
}

function normalizeLayout(layout: Position3D[]): Position3D[] {
  const minX = Math.min(...layout.map((pos) => pos.x));
  const minY = Math.min(...layout.map((pos) => pos.y));
  const minZ = Math.min(...layout.map((pos) => pos.z));

  return layout
    .map((pos) => ({
      x: pos.x - minX,
      y: pos.y - minY,
      z: pos.z - minZ,
    }))
    .sort((a, b) =>
      a.y !== b.y ? a.y - b.y : a.x !== b.x ? a.x - b.x : a.z - b.z,
    );
}

function createPiece(
  template: PieceTemplate,
  index: number,
  color: string,
): Piece {
  return {
    id: `piece_${index}`,
    name: template.name,
    color,
    layout: normalizeLayout(template.layout),
  };
}

function uniqueRotatedLayouts(piece: Piece): Position3D[][] {
  const seen = new Set<string>();
  const layouts: Position3D[][] = [];

  for (const rotation of ROTATIONS_2D) {
    const layout = normalizeLayout(rotatePieceLayout3D(piece.layout, rotation));
    const key = layout.map(keyOf).join("|");

    if (!seen.has(key)) {
      seen.add(key);
      layouts.push(layout);
    }
  }

  return layouts;
}

function touchesOccupied(
  positions: Position3D[],
  occupied: ReadonlySet<string>,
): boolean {
  return positions.some((pos) =>
    ADJACENT_2D.some((dir) =>
      occupied.has(keyOf({ x: pos.x + dir.x, y: pos.y + dir.y, z: pos.z })),
    ),
  );
}

function canPlace(
  positions: Position3D[],
  occupied: ReadonlySet<string>,
): boolean {
  return (
    positions.every((pos) => !occupied.has(keyOf(pos))) &&
    touchesOccupied(positions, occupied)
  );
}

function findPlacement(
  piece: Piece,
  occupied: ReadonlySet<string>,
  rng: SeededRandom,
): Position3D[] | null {
  const occupiedCells = Array.from(occupied).map((key) => {
    const [x, y, z] = key.split(",").map(Number);
    return { x, y, z };
  });

  const layouts = rng.shuffle(uniqueRotatedLayouts(piece));
  const anchors = rng.shuffle(occupiedCells);
  const directions = rng.shuffle(ADJACENT_2D);

  for (const layout of layouts) {
    const localCells = rng.shuffle(layout);

    for (const anchor of anchors) {
      for (const dir of directions) {
        const target = {
          x: anchor.x + dir.x,
          y: anchor.y + dir.y,
          z: anchor.z,
        };

        for (const local of localCells) {
          const position = {
            x: target.x - local.x,
            y: target.y - local.y,
            z: target.z - local.z,
          };
          const world = layout.map((cell) => ({
            x: position.x + cell.x,
            y: position.y + cell.y,
            z: position.z + cell.z,
          }));

          if (canPlace(world, occupied)) {
            return world;
          }
        }
      }
    }
  }

  return null;
}

function normalizeTarget(cells: Position3D[]): Position3D[] {
  const minX = Math.min(...cells.map((pos) => pos.x));
  const minY = Math.min(...cells.map((pos) => pos.y));

  return cells
    .map((pos) => ({
      x: pos.x - minX + 1,
      y: pos.y - minY + 1,
      z: pos.z,
    }))
    .sort((a, b) =>
      a.y !== b.y ? a.y - b.y : a.x !== b.x ? a.x - b.x : a.z - b.z,
    );
}

function gridSizeFor(cells: Position3D[]): [number, number, number] {
  const maxX = Math.max(...cells.map((pos) => pos.x));
  const maxY = Math.max(...cells.map((pos) => pos.y));

  return [maxX + 2, maxY + 2, 1];
}

function hasVariedShapes(pieces: Piece[]): boolean {
  return new Set(pieces.map((piece) => piece.name)).size >= 3;
}

function buildCandidate(
  rng: SeededRandom,
  difficulty: Difficulty,
): { pieces: Piece[]; targetVoxels: Position3D[] } | null {
  const [minPieces, maxPieces] = PIECE_COUNT_RANGE[difficulty];
  const pieceCount = rng.nextInt(minPieces, maxPieces);
  const bank = getTemplateBank(difficulty);
  const colors = rng.shuffle(PIECE_COLORS);
  const templates = rng.shuffle(bank);
  const pieces = Array.from({ length: pieceCount }, (_, index) =>
    createPiece(
      templates[index % templates.length],
      index,
      colors[index % colors.length],
    ),
  );

  if (!hasVariedShapes(pieces)) return null;

  const occupied = new Set<string>();
  for (let i = 0; i < pieces.length; i++) {
    const piece = pieces[i];

    if (i === 0) {
      for (const pos of getPieceWorldPositions(
        piece,
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: 0 },
      )) {
        occupied.add(keyOf(pos));
      }
      continue;
    }

    const positions = findPlacement(piece, occupied, rng);
    if (positions === null) return null;

    for (const pos of positions) {
      occupied.add(keyOf(pos));
    }
  }

  const targetVoxels = normalizeTarget(
    Array.from(occupied).map((key) => {
      const [x, y, z] = key.split(",").map(Number);
      return { x, y, z };
    }),
  );

  return {
    pieces: rng.shuffle(pieces),
    targetVoxels,
  };
}

export function generateConstructivePuzzle(
  rng: SeededRandom,
  difficulty: Difficulty,
): LevelConfig | null {
  for (let attempt = 0; attempt < 40; attempt++) {
    const candidate = buildCandidate(rng, difficulty);
    if (!candidate) {
      rng.next();
      continue;
    }

    return {
      id: `cohesive_${rng.seed}`,
      name: describeShape(candidate.targetVoxels, candidate.pieces.length),
      type: "2D",
      gridSize: gridSizeFor(candidate.targetVoxels),
      targetVoxels: candidate.targetVoxels,
      pieces: candidate.pieces,
      difficulty,
    };
  }

  return null;
}

/**
 * Give a generated level a descriptive name based on its bounding-box aspect,
 * so "Workshop: Wide Slab (8)" reads as a real shape rather than "Constructive
 * hard (8 pieces)". The shapes are constructive (grown by actually placing
 * real pieces edge-to-edge), so the silhouette is meaningful — surfacing it
 * helps the player read the puzzle.
 */
function describeShape(target: Position3D[], pieceCount: number): string {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const v of target) {
    if (v.x < minX) minX = v.x;
    if (v.x > maxX) maxX = v.x;
    if (v.y < minY) minY = v.y;
    if (v.y > maxY) maxY = v.y;
  }
  const w = maxX - minX + 1;
  const h = maxY - minY + 1;
  const ratio = w / h;
  let silhouette: string;
  if (Math.abs(ratio - 1) < 0.15) silhouette = "Block";
  else if (ratio > 2.5) silhouette = "Wide Slab";
  else if (ratio < 0.4) silhouette = "Tall Tower";
  else if (ratio > 1.4) silhouette = "Wide Bar";
  else if (ratio < 0.7) silhouette = "Pillar";
  else silhouette = "Slab";
  return `${silhouette} · ${pieceCount} pieces`;
}

export const PUZZLE_ENGINE_CONSTANTS = {
  PIECE_COUNT_RANGE,
} as const;
