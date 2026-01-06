/**
 * Seeded Level Generator for ShapeArchitect
 *
 * Generates reproducible levels for daily challenges using seeded RNG.
 * Same seed always produces the same level configuration.
 *
 * @example
 * import { getDailyShapeArchitectLevel } from './seededGenerator';
 *
 * const level = getDailyShapeArchitectLevel('2025-01-01');
 * // Always returns the same level for Jan 1, 2025
 */

import type { LevelConfig, Piece, Position3D, Rotation3D, CellState } from './types';
import type { SeededRandom } from '@/shared/utils';
import { createSeededRandom } from '@/shared/utils';
import { solvePuzzle } from './solver';
import { presetLevels } from './presets';
import { getPieceWorldPositions, createGrid } from './engine';

// ============================================================================
// Piece Factories (inline to avoid circular deps with presets)
// ============================================================================

type PieceFactory = (id: string, color: string) => Piece;

const TETRIS_FACTORIES: Record<string, PieceFactory> = {
  I: (id, color) => ({
    id,
    name: 'I-Block',
    color,
    layout: [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 },
      { x: 3, y: 0, z: 0 },
    ],
  }),
  O: (id, color) => ({
    id,
    name: 'O-Block',
    color,
    layout: [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 1, z: 0 },
    ],
  }),
  T: (id, color) => ({
    id,
    name: 'T-Block',
    color,
    layout: [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 },
      { x: 1, y: 1, z: 0 },
    ],
  }),
  S: (id, color) => ({
    id,
    name: 'S-Block',
    color,
    layout: [
      { x: 1, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 1, z: 0 },
    ],
  }),
  Z: (id, color) => ({
    id,
    name: 'Z-Block',
    color,
    layout: [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 2, y: 1, z: 0 },
    ],
  }),
  J: (id, color) => ({
    id,
    name: 'J-Block',
    color,
    layout: [
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 2, y: 1, z: 0 },
    ],
  }),
  L: (id, color) => ({
    id,
    name: 'L-Block',
    color,
    layout: [
      { x: 2, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 2, y: 1, z: 0 },
    ],
  }),
};

// Pentomino factories (5 cells each) for harder levels
const PENTOMINO_FACTORIES: Record<string, PieceFactory> = {
  F: (id, color) => ({
    id,
    name: 'F-Pento',
    color,
    layout: [
      { x: 1, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 1, y: 2, z: 0 },
    ],
  }),
  P: (id, color) => ({
    id,
    name: 'P-Pento',
    color,
    layout: [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 0, y: 2, z: 0 },
    ],
  }),
  U: (id, color) => ({
    id,
    name: 'U-Pento',
    color,
    layout: [
      { x: 0, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 2, y: 1, z: 0 },
    ],
  }),
  W: (id, color) => ({
    id,
    name: 'W-Pento',
    color,
    layout: [
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 1, y: 2, z: 0 },
      { x: 2, y: 2, z: 0 },
    ],
  }),
  L: (id, color) => ({
    id,
    name: 'L-Pento',
    color,
    layout: [
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 0, y: 2, z: 0 },
      { x: 0, y: 3, z: 0 },
      { x: 1, y: 3, z: 0 },
    ],
  }),
  N: (id, color) => ({
    id,
    name: 'N-Pento',
    color,
    layout: [
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 1, y: 2, z: 0 },
      { x: 1, y: 3, z: 0 },
    ],
  }),
  T: (id, color) => ({
    id,
    name: 'T-Pento',
    color,
    layout: [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 1, y: 2, z: 0 },
    ],
  }),
  Y: (id, color) => ({
    id,
    name: 'Y-Pento',
    color,
    layout: [
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 1, y: 2, z: 0 },
      { x: 1, y: 3, z: 0 },
    ],
  }),
};

const PIECE_COLORS = [
  '#00BCD4', // Cyan
  '#FFEB3B', // Yellow
  '#9C27B0', // Purple
  '#4CAF50', // Green
  '#F44336', // Red
  '#2196F3', // Blue
  '#FF9800', // Orange
  '#E91E63', // Pink
];

// ============================================================================
// Constants
// ============================================================================

/**
 * Piece count ranges by difficulty.
 * More pieces = more complex puzzle.
 */
const PIECE_COUNT_RANGE: Record<'easy' | 'medium' | 'hard', [number, number]> = {
  easy: [4, 5],
  medium: [5, 6],
  hard: [6, 7],
};

/**
 * Validation timeout in milliseconds.
 * Fast enough for real-time generation while still being thorough.
 */
const VALIDATION_TIMEOUT_MS = 2000;

/**
 * Maximum retry attempts before falling back to preset.
 */
const MAX_RETRY_ATTEMPTS = 10;

/**
 * Piece mix ratios by difficulty.
 * Higher difficulties include more pentominoes (harder shapes).
 */
const DIFFICULTY_PIECE_MIX: Record<'easy' | 'medium' | 'hard', { tetris: number; pento: number }> = {
  easy: { tetris: 1.0, pento: 0.0 },    // 100% tetrominoes
  medium: { tetris: 0.6, pento: 0.4 },  // 60% tetris, 40% pento
  hard: { tetris: 0.3, pento: 0.7 },    // 30% tetris, 70% pento
};

// ============================================================================
// Guaranteed Solvable Generator (Reverse Generation)
// ============================================================================

/**
 * Generate all 4 rotations of a rotation state.
 * Used to try different orientations when placing pieces.
 */
function getAllZRotations(): Rotation3D[] {
  return [
    { x: 0, y: 0, z: 0 },
    { x: 0, y: 0, z: 90 },
    { x: 0, y: 0, z: 180 },
    { x: 0, y: 0, z: 270 },
  ];
}

/**
 * Check if a position is adjacent to any occupied cell in the grid.
 * Adjacent means sharing a face (not diagonal).
 */
function isAdjacentToOccupied(
  grid: CellState[][][],
  positions: Position3D[],
  gridSize: [number, number, number]
): boolean {
  const directions = [
    { x: 1, y: 0, z: 0 },
    { x: -1, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 },
    { x: 0, y: -1, z: 0 },
    { x: 0, y: 0, z: 1 },
    { x: 0, y: 0, z: -1 },
  ];

  for (const pos of positions) {
    for (const dir of directions) {
      const nx = pos.x + dir.x;
      const ny = pos.y + dir.y;
      const nz = pos.z + dir.z;

      // Check bounds
      if (nx >= 0 && nx < gridSize[0] &&
          ny >= 0 && ny < gridSize[1] &&
          nz >= 0 && nz < gridSize[2]) {
        // Check if neighbor is occupied (value = 2)
        if (grid[nx][ny][nz] === 2) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Find all valid positions where a piece can be placed on a placement grid.
 * The placement grid tracks where pieces have been placed (for collision detection).
 *
 * @param requireAdjacent - If true, only return positions adjacent to already-placed pieces
 */
function findValidPositions(
  placementGrid: CellState[][][],
  piece: Piece,
  rotation: Rotation3D,
  gridSize: [number, number, number],
  requireAdjacent: boolean = false
): Position3D[] {
  const validPositions: Position3D[] = [];

  // Only check z=0 for 2D puzzles
  for (let x = 0; x < gridSize[0]; x++) {
    for (let y = 0; y < gridSize[1]; y++) {
      const pos: Position3D = { x, y, z: 0 };

      // Check if we can place here using the placement grid
      // We need custom logic since canPlacePiece expects target cells
      const worldPositions = getPieceWorldPositions(piece, pos, rotation);

      let canPlace = true;
      for (const wp of worldPositions) {
        // Check bounds
        if (wp.x < 0 || wp.x >= gridSize[0] ||
            wp.y < 0 || wp.y >= gridSize[1] ||
            wp.z < 0 || wp.z >= gridSize[2]) {
          canPlace = false;
          break;
        }
        // Check collision with already-placed pieces (value > 1 means occupied)
        if (placementGrid[wp.x][wp.y][wp.z] > 1) {
          canPlace = false;
          break;
        }
      }

      // If requiring adjacency, check if any piece cell is adjacent to occupied cells
      if (canPlace && requireAdjacent) {
        canPlace = isAdjacentToOccupied(placementGrid, worldPositions, gridSize);
      }

      if (canPlace) {
        validPositions.push(pos);
      }
    }
  }

  return validPositions;
}

/**
 * Place a piece on the placement grid.
 * Marks cells as occupied (value = 2) to track where pieces are placed.
 */
function placePieceOnGrid(
  grid: CellState[][][],
  piece: Piece,
  position: Position3D,
  rotation: Rotation3D
): void {
  const worldPositions = getPieceWorldPositions(piece, position, rotation);
  for (const pos of worldPositions) {
    grid[pos.x][pos.y][pos.z] = 2; // Mark as placed
  }
}

/**
 * Extract all occupied positions from a placement grid.
 * Returns positions where value = 2 (piece was placed).
 */
function extractOccupiedCells(grid: CellState[][][]): Position3D[] {
  const occupied: Position3D[] = [];
  for (let x = 0; x < grid.length; x++) {
    for (let y = 0; y < grid[x].length; y++) {
      for (let z = 0; z < grid[x][y].length; z++) {
        if (grid[x][y][z] === 2) {
          occupied.push({ x, y, z });
        }
      }
    }
  }
  return occupied;
}

/**
 * Calculate the minimum bounding box for a set of positions.
 * Returns grid size with 1-cell padding on each side.
 */
function calculateBoundingBox(positions: Position3D[]): [number, number, number] {
  if (positions.length === 0) {
    return [4, 4, 1];
  }

  const maxX = Math.max(...positions.map(p => p.x));
  const maxY = Math.max(...positions.map(p => p.y));
  const maxZ = Math.max(...positions.map(p => p.z));

  // Add padding for the grid size
  return [maxX + 2, maxY + 2, Math.max(1, maxZ + 1)];
}

/**
 * Select random pieces based on difficulty.
 * Easy = only tetrominoes, Medium = mixed, Hard = mostly pentominoes.
 */
function selectRandomPieces(
  rng: SeededRandom,
  pieceCount: number,
  difficulty: 'easy' | 'medium' | 'hard'
): Piece[] {
  const mix = DIFFICULTY_PIECE_MIX[difficulty];
  const pieces: Piece[] = [];

  const tetrisKeys = Object.keys(TETRIS_FACTORIES);
  const pentoKeys = Object.keys(PENTOMINO_FACTORIES);

  // Shuffle both pools
  const shuffledTetris = rng.shuffle(tetrisKeys);
  const shuffledPento = rng.shuffle(pentoKeys);

  let tetrisIndex = 0;
  let pentoIndex = 0;

  for (let i = 0; i < pieceCount; i++) {
    const color = PIECE_COLORS[i % PIECE_COLORS.length];

    // Decide whether to pick tetromino or pentomino
    const usePento = rng.next() < mix.pento;

    if (usePento && pentoIndex < shuffledPento.length) {
      const key = shuffledPento[pentoIndex % shuffledPento.length];
      pieces.push(PENTOMINO_FACTORIES[key](`p${i}`, color));
      pentoIndex++;
    } else {
      const key = shuffledTetris[tetrisIndex % shuffledTetris.length];
      pieces.push(TETRIS_FACTORIES[key](`p${i}`, color));
      tetrisIndex++;
    }
  }

  return pieces;
}

/**
 * Generate a guaranteed-solvable level using reverse generation.
 *
 * Algorithm:
 * 1. Select N random pieces based on difficulty
 * 2. Create a large empty grid
 * 3. Place each piece in a valid random position with random rotation
 * 4. Extract occupied cells as the target shape
 * 5. Return level with shuffled pieces (so solution isn't obvious)
 *
 * Since we actually placed the pieces, we know they fit - guaranteed solvable!
 */
export function generateGuaranteedSolvable(
  rng: SeededRandom,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium'
): LevelConfig | null {
  // 1. Determine piece count
  const [minPieces, maxPieces] = PIECE_COUNT_RANGE[difficulty];
  const pieceCount = rng.nextInt(minPieces, maxPieces);

  // 2. Select random pieces
  const pieces = selectRandomPieces(rng, pieceCount, difficulty);

  // 3. Calculate grid size based on total cells
  const totalCells = pieces.reduce((sum, p) => sum + p.layout.length, 0);
  // Make grid larger to give room for interesting shapes
  const baseSize = Math.ceil(Math.sqrt(totalCells * 2.5));
  const gridSize: [number, number, number] = [baseSize + 4, baseSize + 4, 1];

  // 4. Create placement grid and place pieces
  const placementGrid = createGrid(gridSize);
  const rotations = getAllZRotations();

  let isFirstPiece = true;
  for (const piece of pieces) {
    // Try random rotations until we find a valid placement
    const shuffledRotations = rng.shuffle([...rotations]);
    let placed = false;

    for (const rotation of shuffledRotations) {
      // After first piece, require adjacency to create unified shape
      const validPositions = findValidPositions(
        placementGrid,
        piece,
        rotation,
        gridSize,
        !isFirstPiece // requireAdjacent = true after first piece
      );

      if (validPositions.length > 0) {
        // Pick a random valid position
        const position = rng.pick(validPositions);
        placePieceOnGrid(placementGrid, piece, position, rotation);
        placed = true;
        isFirstPiece = false;
        break;
      }
    }

    if (!placed) {
      // Failed to place this piece - return null to trigger retry
      return null;
    }
  }

  // 5. Extract target voxels from placed pieces
  const targetVoxels = extractOccupiedCells(placementGrid);

  // 6. Calculate tight bounding box
  const finalGridSize = calculateBoundingBox(targetVoxels);

  // 7. Shuffle pieces so solution order isn't obvious
  const shuffledPieces = rng.shuffle([...pieces]);

  return {
    id: `guaranteed_${rng.seed}`,
    name: `Puzzle ${pieceCount} Pieces`,
    type: '2D',
    gridSize: finalGridSize,
    targetVoxels,
    pieces: shuffledPieces,
    difficulty,
  };
}

/**
 * Generate a guaranteed-solvable level with retry logic.
 * Falls back to preset if generation consistently fails.
 */
export function generateGuaranteedSolvableWithRetry(
  rng: SeededRandom,
  difficulty: 'easy' | 'medium' | 'hard'
): LevelConfig {
  for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt++) {
    const result = generateGuaranteedSolvable(rng, difficulty);
    if (result) {
      return result;
    }
    // Advance RNG state for next attempt
    rng.next();
  }

  // Fall back to preset
  return getFallbackPreset(rng, difficulty);
}

// ============================================================================
// Fallback Preset Selection
// ============================================================================

/**
 * Get a fallback preset level matching the specified difficulty.
 * Uses seeded selection to ensure consistent fallback for the same seed.
 *
 * @param rng - Seeded random number generator for consistent selection
 * @param difficulty - Target difficulty level
 * @returns A preset level matching the difficulty
 */
function getFallbackPreset(
  rng: SeededRandom,
  difficulty: 'easy' | 'medium' | 'hard'
): LevelConfig {
  // Filter presets by difficulty (only 2D presets for now since generator is 2D)
  const matchingPresets = presetLevels.filter(
    (level) => level.difficulty === difficulty && level.type === '2D'
  );

  // If no exact match, use any 2D preset
  const candidates =
    matchingPresets.length > 0
      ? matchingPresets
      : presetLevels.filter((level) => level.type === '2D');

  // Use seeded selection for reproducibility
  const selected = rng.pick(candidates);

  // Return a copy with modified ID to indicate it's a fallback
  return {
    ...selected,
    id: `daily_fallback_${rng.seed}`,
    name: `Daily Challenge (${selected.name})`,
  };
}

// ============================================================================
// Seeded Generator Functions
// ============================================================================

/**
 * Generate a level using seeded randomness.
 * Produces the same level for the same seed.
 *
 * @param rng - Seeded random number generator
 * @param difficulty - Level difficulty (daily challenges use 'medium')
 * @returns Complete level configuration
 */
export function generateSeededLevel(
  rng: SeededRandom,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium'
): LevelConfig {
  // 1. Determine piece count using seeded RNG
  const [minPieces, maxPieces] = PIECE_COUNT_RANGE[difficulty];
  const pieceCount = rng.nextInt(minPieces, maxPieces);

  // 2. Get all tetromino factories and shuffle with seeded RNG
  const factoryKeys = Object.keys(TETRIS_FACTORIES);
  const shuffledKeys = rng.shuffle(factoryKeys);

  // 3. Create pieces with seeded selection
  const pieces: Piece[] = [];
  for (let i = 0; i < pieceCount; i++) {
    const key = shuffledKeys[i % shuffledKeys.length];
    const factory = TETRIS_FACTORIES[key];
    const color = PIECE_COLORS[i % PIECE_COLORS.length];
    pieces.push(factory(`p${i}`, color));
  }

  // 4. Calculate target area dimensions
  const totalCells = pieces.reduce((sum, p) => sum + p.layout.length, 0);
  const width = Math.ceil(Math.sqrt(totalCells * 1.3));
  const height = Math.ceil(totalCells / width);

  // 5. Create rectangular target voxels
  const targetVoxels: Position3D[] = [];
  let cellsAdded = 0;
  for (let y = 1; y <= height && cellsAdded < totalCells; y++) {
    for (let x = 1; x <= width && cellsAdded < totalCells; x++) {
      targetVoxels.push({ x, y, z: 0 });
      cellsAdded++;
    }
  }

  return {
    id: `daily_${rng.seed}`,
    name: `Daily ${pieceCount} Pieces`,
    type: '2D',
    gridSize: [width + 3, height + 3, 1] as [number, number, number],
    targetVoxels,
    pieces,
    difficulty,
  };
}

// ============================================================================
// Level Validation
// ============================================================================

/**
 * Generate a validated level with retry logic.
 * Attempts to generate a solvable level, retrying with modified seeds if needed.
 *
 * @param baseSeed - Base seed string for generation
 * @param difficulty - Target difficulty level
 * @returns A validated level config (either generated or fallback preset)
 */
function generateValidatedLevel(
  baseSeed: string,
  difficulty: 'easy' | 'medium' | 'hard'
): LevelConfig {
  for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt++) {
    // Create seed with attempt suffix for retries
    const seed = attempt === 0 ? baseSeed : `${baseSeed}-retry${attempt}`;
    const rng = createSeededRandom(seed);

    const level = generateSeededLevel(rng, difficulty);

    // Validate the generated level
    const result = solvePuzzle(level, VALIDATION_TIMEOUT_MS);

    if (result.solvable) {
      // Definitely solvable, return it
      return level;
    }

    if (result.timedOut) {
      // Solver timed out - for complex puzzles, we can't be certain
      // Continue trying to find a definitively solvable level
      // But if we exhaust retries, this is better than nothing
      continue;
    }

    // result.solvable === false && !result.timedOut means definitively unsolvable
    // Continue to next attempt
  }

  // All retries exhausted, fall back to a preset level
  // Presets are pre-validated, so they're guaranteed solvable
  const fallbackRng = createSeededRandom(baseSeed);
  return getFallbackPreset(fallbackRng, difficulty);
}

// ============================================================================
// Daily Challenge API
// ============================================================================

/**
 * Get today's daily challenge level for ShapeArchitect.
 * Always returns the same level for the same date.
 * Validates that the generated level is solvable, with retry and fallback logic.
 *
 * @param date - Date string in YYYY-MM-DD format (defaults to today)
 * @returns Level config for daily challenge (guaranteed solvable)
 */
export function getDailyShapeArchitectLevel(date?: string): LevelConfig {
  const dateStr = date ?? new Date().toISOString().split('T')[0];
  const baseSeed = `${dateStr}-shape-architect`;

  // Daily challenges are always medium difficulty
  return generateValidatedLevel(baseSeed, 'medium');
}

/**
 * Preview a future daily level (for testing/admin).
 *
 * @param daysFromNow - Number of days in the future (0 = today)
 * @returns Level config for that date
 */
export function previewDailyLevel(daysFromNow: number = 0): LevelConfig {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  const dateStr = date.toISOString().split('T')[0];
  return getDailyShapeArchitectLevel(dateStr);
}

// ============================================================================
// Testing Utilities
// ============================================================================

/**
 * Exported constants for testing purposes.
 */
export const GENERATOR_CONSTANTS = {
  VALIDATION_TIMEOUT_MS,
  MAX_RETRY_ATTEMPTS,
} as const;

/**
 * Generate a validated level directly (for testing).
 * Exposes the internal generateValidatedLevel function.
 */
export { generateValidatedLevel as generateValidatedLevelForTesting };

// ============================================================================
// 3D Support Status
// ============================================================================

/**
 * NOTE: The current seeded generator only produces 2D levels (z=0).
 *
 * To support 3D daily challenges, the generator would need to be extended to:
 * 1. Use 3D polycube pieces (from presets.ts POLYCUBE_3D)
 * 2. Generate 3D target voxels with z > 0
 * 3. Set level type to '3D' for proper solver rotation handling
 *
 * For now, 3D puzzles are only available through preset levels.
 * The fallback mechanism will use 2D presets for daily challenges.
 */
