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
import { createSeededRandom } from '@/shared/utils';
import { solvePuzzle } from './solver';
import { presetLevels } from './presets';

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

/**
 * Validation timeout in milliseconds.
 * Fast enough for real-time generation while still being thorough.
 */
const VALIDATION_TIMEOUT_MS = 2000;

/**
 * Maximum retry attempts before falling back to preset.
 */
const MAX_RETRY_ATTEMPTS = 10;

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
