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

import type { LevelConfig, Piece, Position3D } from './types';
import type { SeededRandom } from '@/shared/utils';
import { createDailyRandom } from '@/shared/utils';

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
// Daily Challenge API
// ============================================================================

/**
 * Get today's daily challenge level for ShapeArchitect.
 * Always returns the same level for the same date.
 *
 * @param date - Date string in YYYY-MM-DD format (defaults to today)
 * @returns Level config for daily challenge
 */
export function getDailyShapeArchitectLevel(date?: string): LevelConfig {
  const dateStr = date ?? new Date().toISOString().split('T')[0];
  const rng = createDailyRandom(dateStr, 'shape-architect');

  // Daily challenges are always medium difficulty
  return generateSeededLevel(rng, 'medium');
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
