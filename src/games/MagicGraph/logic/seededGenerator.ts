/**
 * Seeded Puzzle Generator for MagicGraph
 *
 * Generates reproducible puzzles for daily challenges using seeded RNG.
 * Same seed always produces the same puzzle.
 *
 * @example
 * import { getDailyMagicGraphPuzzle } from './seededGenerator';
 *
 * const puzzle = getDailyMagicGraphPuzzle('2025-01-01');
 * // Always returns the same puzzle for Jan 1, 2025
 */

import type { PuzzleConfig, Difficulty } from './types';
import type { SeededRandom } from '@/shared/utils';
import { createDailyRandom } from '@/shared/utils';
import {
  linePuzzle,
  crossPuzzle,
  magicTrianglePuzzle,
  diamondPuzzle,
  mShapePuzzle,
  starPuzzle,
  magicSquarePuzzle,
} from './puzzles';
import { solve } from './solver';

// ============================================================================
// Constants
// ============================================================================

/**
 * Number of hint nodes to show based on difficulty.
 * More hints = easier puzzle.
 */
const DIFFICULTY_HINTS: Record<Difficulty, number> = {
  easy: 2,
  medium: 1,
  hard: 0,
  master: 0,
  grandmaster: 0,
};

/**
 * Puzzle templates organized by difficulty for seeded selection.
 */
const TEMPLATES_BY_DIFFICULTY: Record<'easy' | 'medium' | 'hard', Array<Omit<PuzzleConfig, 'id'>>> = {
  easy: [linePuzzle, crossPuzzle],
  medium: [crossPuzzle, magicTrianglePuzzle, diamondPuzzle],
  hard: [mShapePuzzle, starPuzzle, magicSquarePuzzle],
};

// ============================================================================
// Seeded Generator Functions
// ============================================================================

/**
 * Generate a puzzle using seeded randomness.
 * This produces the same puzzle for the same seed.
 *
 * @param rng - Seeded random number generator
 * @param difficulty - Puzzle difficulty (daily challenges use 'medium')
 * @returns Complete puzzle configuration
 */
export function generateSeededPuzzle(
  rng: SeededRandom,
  difficulty: Difficulty = 'medium'
): PuzzleConfig {
  // Map master/grandmaster to hard for template selection
  const templateDifficulty = (difficulty === 'master' || difficulty === 'grandmaster')
    ? 'hard'
    : difficulty;

  // 1. Select template using seeded RNG
  const templates = TEMPLATES_BY_DIFFICULTY[templateDifficulty];
  const template = rng.pick(templates);

  // 2. Generate number pool with seeded randomness
  const nodeCount = template.nodes.length;
  const { availableNumbers, targetSum } = generateSeededNumbers(
    rng,
    nodeCount,
    template.lines[0].nodeIds.length,
    templateDifficulty
  );

  // 3. Create base puzzle with generated numbers
  const basePuzzle: Omit<PuzzleConfig, 'id'> = {
    ...template,
    availableNumbers,
    targetSum,
    difficulty,
  };

  // 4. Solve and mask with seeded hint selection
  return generateWithSeededHints(
    basePuzzle,
    rng,
    DIFFICULTY_HINTS[difficulty]
  );
}

/**
 * Generate number pool and target sum using seeded RNG.
 */
function generateSeededNumbers(
  rng: SeededRandom,
  nodeCount: number,
  nodesPerLine: number,
  difficulty: 'easy' | 'medium' | 'hard'
): { availableNumbers: number[]; targetSum: number } {
  let availableNumbers: number[];

  if (difficulty === 'easy') {
    // Sequential numbers starting from 1-3
    const start = rng.nextInt(1, 3);
    availableNumbers = Array.from({ length: nodeCount }, (_, i) => start + i);
  } else if (difficulty === 'medium') {
    // Skip counting (odds or evens)
    const base = rng.nextInt(1, 5);
    availableNumbers = Array.from({ length: nodeCount }, (_, i) => base + i * 2);
  } else {
    // Hard: strictly odd or even sequences
    const useOdd = rng.next() > 0.5;
    availableNumbers = Array.from({ length: nodeCount }, (_, i) =>
      useOdd ? 1 + i * 2 : 2 + i * 2
    );
  }

  // Calculate magic sum
  const total = availableNumbers.reduce((a, b) => a + b, 0);
  const avg = total / availableNumbers.length;
  const targetSum = Math.round(avg * nodesPerLine);

  return { availableNumbers, targetSum };
}

/**
 * Generate puzzle with seeded hint node selection.
 * Uses backtracking solver then masks nodes deterministically.
 */
function generateWithSeededHints(
  basePuzzle: Omit<PuzzleConfig, 'id'>,
  rng: SeededRandom,
  hintsToShow: number
): PuzzleConfig {
  // Solve with all nodes empty
  const emptyNodes = basePuzzle.nodes.map((n) => ({
    ...n,
    value: null,
    isFixed: false,
  }));

  const solutions = solve(
    emptyNodes,
    basePuzzle.lines,
    basePuzzle.availableNumbers,
    basePuzzle.targetSum,
    1 // We only need one solution
  );

  // Fallback if no solution found (shouldn't happen with valid templates)
  if (solutions.length === 0) {
    console.warn('[SeededGenerator] No solution found, using template defaults');
    return {
      ...basePuzzle,
      id: `daily_${rng.seed}`,
    };
  }

  const solution = solutions[0];

  // Create nodes with solved values
  const filledNodes = basePuzzle.nodes.map((n) => ({
    ...n,
    value: solution.get(n.id) ?? null,
    isFixed: false,
  }));

  // Use seeded shuffle to select which nodes to reveal as hints
  const indices = filledNodes.map((_, i) => i);
  const shuffledIndices = rng.shuffle(indices);
  const keepVisible = new Set(shuffledIndices.slice(0, hintsToShow));

  // Mask nodes (reveal only hint nodes)
  const maskedNodes = filledNodes.map((n, i) => ({
    ...n,
    isFixed: keepVisible.has(i),
    value: keepVisible.has(i) ? n.value : null,
  }));

  return {
    ...basePuzzle,
    id: `daily_${rng.seed}`,
    nodes: maskedNodes,
  };
}

// ============================================================================
// Daily Challenge API
// ============================================================================

/**
 * Get today's daily challenge puzzle for MagicGraph.
 * Always returns the same puzzle for the same date.
 *
 * @param date - Date string in YYYY-MM-DD format (defaults to today)
 * @returns Puzzle configured for daily challenge
 */
export function getDailyMagicGraphPuzzle(date?: string): PuzzleConfig {
  const dateStr = date ?? new Date().toISOString().split('T')[0];
  const rng = createDailyRandom(dateStr, 'magic-graph');

  // Daily challenges are always medium difficulty for fair comparison
  return generateSeededPuzzle(rng, 'medium');
}

/**
 * Preview a future daily puzzle (for testing/admin).
 *
 * @param daysFromNow - Number of days in the future (0 = today)
 * @returns Puzzle for that date
 */
export function previewDailyPuzzle(daysFromNow: number = 0): PuzzleConfig {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  const dateStr = date.toISOString().split('T')[0];
  return getDailyMagicGraphPuzzle(dateStr);
}
