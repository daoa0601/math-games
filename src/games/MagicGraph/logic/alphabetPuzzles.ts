// ========================================
// Magic Graph - Alphabet Letter Puzzles (A-Z)
// Based on Hanoi Open Mathematics Competition format
// ========================================
// CRITICAL CONSTRAINT: Every line MUST have exactly 3 nodes
// All lines in a puzzle must sum to the same target value

import type { PuzzleConfig, Difficulty } from './types';

/**
 * Letter difficulty classification based on number of lines
 * Easy: 3-4 lines
 * Medium: 5-6 lines
 * Hard: 7+ lines
 */
export type LetterDifficulty = 'easy' | 'medium' | 'hard';

export interface LetterPuzzle extends Omit<PuzzleConfig, 'id'> {
  letter: string;
  letterDifficulty: LetterDifficulty;
}

// ========================================
// EASY LETTERS (3-4 lines)
// ========================================

/**
 * Letter I - Simple vertical with serifs
 * 3 lines: top serif, vertical, bottom serif
 */
export const letterI: LetterPuzzle = {
  letter: 'I',
  name: 'Letter I',
  letterDifficulty: 'easy',
  nodes: [
    // Top serif
    { id: 'n1', position: { x: 100, y: 30 }, value: null, isFixed: false },
    { id: 'n2', position: { x: 150, y: 30 }, value: null, isFixed: false },
    { id: 'n3', position: { x: 200, y: 30 }, value: null, isFixed: false },
    // Vertical stem
    { id: 'n4', position: { x: 150, y: 110 }, value: null, isFixed: false },
    { id: 'n5', position: { x: 150, y: 190 }, value: null, isFixed: false },
    // Bottom serif
    { id: 'n6', position: { x: 100, y: 190 }, value: null, isFixed: false },
    { id: 'n7', position: { x: 200, y: 190 }, value: null, isFixed: false },
  ],
  lines: [
    { id: 'l1', nodeIds: ['n1', 'n2', 'n3'] },  // Top serif
    { id: 'l2', nodeIds: ['n2', 'n4', 'n5'] },  // Vertical
    { id: 'l3', nodeIds: ['n6', 'n5', 'n7'] },  // Bottom serif
  ],
  targetSum: 12,
  availableNumbers: [1, 2, 3, 4, 5, 6, 7],
  difficulty: 'easy',
  isSolvable: true,
};

/**
 * Letter L - Two perpendicular lines
 * 3 lines total (with corner extension)
 */
export const letterL: LetterPuzzle = {
  letter: 'L',
  name: 'Letter L',
  letterDifficulty: 'easy',
  nodes: [
    { id: 'n1', position: { x: 80, y: 30 }, value: null, isFixed: false },
    { id: 'n2', position: { x: 80, y: 110 }, value: null, isFixed: false },
    { id: 'n3', position: { x: 80, y: 190 }, value: null, isFixed: false },
    { id: 'n4', position: { x: 150, y: 190 }, value: null, isFixed: false },
    { id: 'n5', position: { x: 220, y: 190 }, value: null, isFixed: false },
  ],
  lines: [
    { id: 'l1', nodeIds: ['n1', 'n2', 'n3'] },  // Vertical
    { id: 'l2', nodeIds: ['n3', 'n4', 'n5'] },  // Horizontal
  ],
  targetSum: 9,
  availableNumbers: [1, 2, 3, 4, 5],
  difficulty: 'easy',
  isSolvable: true,
};

/**
 * Letter T - Classic T shape
 * 2 lines (top horizontal + vertical)
 */
export const letterT: LetterPuzzle = {
  letter: 'T',
  name: 'Letter T',
  letterDifficulty: 'easy',
  nodes: [
    { id: 'n1', position: { x: 60, y: 30 }, value: null, isFixed: false },
    { id: 'n2', position: { x: 150, y: 30 }, value: null, isFixed: false },
    { id: 'n3', position: { x: 240, y: 30 }, value: null, isFixed: false },
    { id: 'n4', position: { x: 150, y: 110 }, value: null, isFixed: false },
    { id: 'n5', position: { x: 150, y: 190 }, value: null, isFixed: false },
  ],
  lines: [
    { id: 'l1', nodeIds: ['n1', 'n2', 'n3'] },  // Top horizontal
    { id: 'l2', nodeIds: ['n2', 'n4', 'n5'] },  // Vertical
  ],
  targetSum: 9,
  availableNumbers: [1, 2, 3, 4, 5],
  difficulty: 'easy',
  isSolvable: true,
};

/**
 * Letter V - Two diagonal lines meeting at bottom
 */
export const letterV: LetterPuzzle = {
  letter: 'V',
  name: 'Letter V',
  letterDifficulty: 'easy',
  nodes: [
    { id: 'n1', position: { x: 60, y: 30 }, value: null, isFixed: false },
    { id: 'n2', position: { x: 105, y: 110 }, value: null, isFixed: false },
    { id: 'n3', position: { x: 150, y: 190 }, value: null, isFixed: false },
    { id: 'n4', position: { x: 195, y: 110 }, value: null, isFixed: false },
    { id: 'n5', position: { x: 240, y: 30 }, value: null, isFixed: false },
  ],
  lines: [
    { id: 'l1', nodeIds: ['n1', 'n2', 'n3'] },  // Left diagonal
    { id: 'l2', nodeIds: ['n5', 'n4', 'n3'] },  // Right diagonal
  ],
  targetSum: 9,
  availableNumbers: [1, 2, 3, 4, 5],
  difficulty: 'easy',
  isSolvable: true,
};

/**
 * Letter X - Two crossing diagonals
 */
export const letterX: LetterPuzzle = {
  letter: 'X',
  name: 'Letter X',
  letterDifficulty: 'easy',
  nodes: [
    { id: 'n1', position: { x: 60, y: 30 }, value: null, isFixed: false },
    { id: 'n2', position: { x: 240, y: 30 }, value: null, isFixed: false },
    { id: 'n3', position: { x: 150, y: 110 }, value: null, isFixed: false },
    { id: 'n4', position: { x: 60, y: 190 }, value: null, isFixed: false },
    { id: 'n5', position: { x: 240, y: 190 }, value: null, isFixed: false },
  ],
  lines: [
    { id: 'l1', nodeIds: ['n1', 'n3', 'n5'] },  // Top-left to bottom-right
    { id: 'l2', nodeIds: ['n2', 'n3', 'n4'] },  // Top-right to bottom-left
  ],
  targetSum: 9,
  availableNumbers: [1, 2, 3, 4, 5],
  difficulty: 'easy',
  isSolvable: true,
};

/**
 * Letter Y - Fork shape
 */
export const letterY: LetterPuzzle = {
  letter: 'Y',
  name: 'Letter Y',
  letterDifficulty: 'easy',
  nodes: [
    { id: 'n1', position: { x: 60, y: 30 }, value: null, isFixed: false },
    { id: 'n2', position: { x: 105, y: 80 }, value: null, isFixed: false },
    { id: 'n3', position: { x: 150, y: 130 }, value: null, isFixed: false },
    { id: 'n4', position: { x: 195, y: 80 }, value: null, isFixed: false },
    { id: 'n5', position: { x: 240, y: 30 }, value: null, isFixed: false },
  ],
  lines: [
    { id: 'l1', nodeIds: ['n1', 'n2', 'n3'] },  // Left arm
    { id: 'l2', nodeIds: ['n5', 'n4', 'n3'] },  // Right arm (shares center point n3)
  ],
  targetSum: 9,
  availableNumbers: [1, 2, 3, 4, 5],
  difficulty: 'easy',
  isSolvable: true,
};

/**
 * Letter Z - Three horizontal segments connected diagonally
 */
export const letterZ: LetterPuzzle = {
  letter: 'Z',
  name: 'Letter Z',
  letterDifficulty: 'easy',
  nodes: [
    { id: 'n1', position: { x: 60, y: 30 }, value: null, isFixed: false },
    { id: 'n2', position: { x: 150, y: 30 }, value: null, isFixed: false },
    { id: 'n3', position: { x: 240, y: 30 }, value: null, isFixed: false },
    { id: 'n4', position: { x: 150, y: 110 }, value: null, isFixed: false },
    { id: 'n5', position: { x: 60, y: 190 }, value: null, isFixed: false },
    { id: 'n6', position: { x: 150, y: 190 }, value: null, isFixed: false },
    { id: 'n7', position: { x: 240, y: 190 }, value: null, isFixed: false },
  ],
  lines: [
    { id: 'l1', nodeIds: ['n1', 'n2', 'n3'] },  // Top horizontal
    { id: 'l2', nodeIds: ['n3', 'n4', 'n5'] },  // Diagonal
    { id: 'l3', nodeIds: ['n5', 'n6', 'n7'] },  // Bottom horizontal
  ],
  targetSum: 12,
  availableNumbers: [1, 2, 3, 4, 5, 6, 7],
  difficulty: 'easy',
  isSolvable: true,
};

// ========================================
// MEDIUM LETTERS (5-6 lines)
// ========================================

/**
 * Letter A - Triangle with crossbar (simplified to ensure 3-node lines)
 */
export const letterA: LetterPuzzle = {
  letter: 'A',
  name: 'Letter A',
  letterDifficulty: 'medium',
  nodes: [
    { id: 'n1', position: { x: 150, y: 20 }, value: null, isFixed: false },   // Top peak
    { id: 'n2', position: { x: 100, y: 100 }, value: null, isFixed: false },  // Left mid
    { id: 'n3', position: { x: 200, y: 100 }, value: null, isFixed: false },  // Right mid
    { id: 'n4', position: { x: 50, y: 180 }, value: null, isFixed: false },   // Left foot
    { id: 'n5', position: { x: 150, y: 100 }, value: null, isFixed: false },  // Center crossbar
    { id: 'n6', position: { x: 250, y: 180 }, value: null, isFixed: false },  // Right foot
  ],
  lines: [
    { id: 'l1', nodeIds: ['n1', 'n2', 'n4'] },  // Left side
    { id: 'l2', nodeIds: ['n1', 'n3', 'n6'] },  // Right side
    { id: 'l3', nodeIds: ['n2', 'n5', 'n3'] },  // Crossbar
  ],
  targetSum: 12,
  availableNumbers: [1, 2, 3, 4, 5, 6],
  difficulty: 'medium',
  isSolvable: true,
};

/**
 * Letter C - Arc with 3 points
 */
export const letterC: LetterPuzzle = {
  letter: 'C',
  name: 'Letter C',
  letterDifficulty: 'medium',
  nodes: [
    { id: 'n1', position: { x: 220, y: 30 }, value: null, isFixed: false },
    { id: 'n2', position: { x: 140, y: 30 }, value: null, isFixed: false },
    { id: 'n3', position: { x: 60, y: 70 }, value: null, isFixed: false },
    { id: 'n4', position: { x: 60, y: 110 }, value: null, isFixed: false },
    { id: 'n5', position: { x: 60, y: 150 }, value: null, isFixed: false },
    { id: 'n6', position: { x: 140, y: 190 }, value: null, isFixed: false },
    { id: 'n7', position: { x: 220, y: 190 }, value: null, isFixed: false },
  ],
  lines: [
    { id: 'l1', nodeIds: ['n1', 'n2', 'n3'] },  // Top curve
    { id: 'l2', nodeIds: ['n3', 'n4', 'n5'] },  // Left side
    { id: 'l3', nodeIds: ['n5', 'n6', 'n7'] },  // Bottom curve
  ],
  targetSum: 12,
  availableNumbers: [1, 2, 3, 4, 5, 6, 7],
  difficulty: 'medium',
  isSolvable: true,
};

/**
 * Letter E - Four horizontal bars with vertical
 */
export const letterE: LetterPuzzle = {
  letter: 'E',
  name: 'Letter E',
  letterDifficulty: 'medium',
  nodes: [
    // Top bar
    { id: 'n1', position: { x: 80, y: 30 }, value: null, isFixed: false },
    { id: 'n2', position: { x: 150, y: 30 }, value: null, isFixed: false },
    { id: 'n3', position: { x: 220, y: 30 }, value: null, isFixed: false },
    // Middle bar
    { id: 'n4', position: { x: 80, y: 110 }, value: null, isFixed: false },
    { id: 'n5', position: { x: 150, y: 110 }, value: null, isFixed: false },
    { id: 'n6', position: { x: 200, y: 110 }, value: null, isFixed: false },
    // Bottom bar
    { id: 'n7', position: { x: 80, y: 190 }, value: null, isFixed: false },
    { id: 'n8', position: { x: 150, y: 190 }, value: null, isFixed: false },
    { id: 'n9', position: { x: 220, y: 190 }, value: null, isFixed: false },
  ],
  lines: [
    { id: 'l1', nodeIds: ['n1', 'n2', 'n3'] },  // Top bar
    { id: 'l2', nodeIds: ['n1', 'n4', 'n7'] },  // Left vertical
    { id: 'l3', nodeIds: ['n4', 'n5', 'n6'] },  // Middle bar
    { id: 'l4', nodeIds: ['n7', 'n8', 'n9'] },  // Bottom bar
  ],
  targetSum: 15,
  availableNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  difficulty: 'medium',
  isSolvable: true,
};

/**
 * Letter F - Like E but without bottom bar
 */
export const letterF: LetterPuzzle = {
  letter: 'F',
  name: 'Letter F',
  letterDifficulty: 'medium',
  nodes: [
    { id: 'n1', position: { x: 80, y: 30 }, value: null, isFixed: false },
    { id: 'n2', position: { x: 150, y: 30 }, value: null, isFixed: false },
    { id: 'n3', position: { x: 220, y: 30 }, value: null, isFixed: false },
    { id: 'n4', position: { x: 80, y: 110 }, value: null, isFixed: false },
    { id: 'n5', position: { x: 150, y: 110 }, value: null, isFixed: false },
    { id: 'n6', position: { x: 200, y: 110 }, value: null, isFixed: false },
    { id: 'n7', position: { x: 80, y: 190 }, value: null, isFixed: false },
  ],
  lines: [
    { id: 'l1', nodeIds: ['n1', 'n2', 'n3'] },  // Top bar
    { id: 'l2', nodeIds: ['n1', 'n4', 'n7'] },  // Vertical
    { id: 'l3', nodeIds: ['n4', 'n5', 'n6'] },  // Middle bar
  ],
  targetSum: 12,
  availableNumbers: [1, 2, 3, 4, 5, 6, 7],
  difficulty: 'medium',
  isSolvable: true,
};

/**
 * Letter H - Two verticals with crossbar
 */
export const letterH: LetterPuzzle = {
  letter: 'H',
  name: 'Letter H',
  letterDifficulty: 'medium',
  nodes: [
    { id: 'n1', position: { x: 60, y: 30 }, value: null, isFixed: false },
    { id: 'n2', position: { x: 60, y: 110 }, value: null, isFixed: false },
    { id: 'n3', position: { x: 60, y: 190 }, value: null, isFixed: false },
    { id: 'n4', position: { x: 150, y: 110 }, value: null, isFixed: false },
    { id: 'n5', position: { x: 240, y: 30 }, value: null, isFixed: false },
    { id: 'n6', position: { x: 240, y: 110 }, value: null, isFixed: false },
    { id: 'n7', position: { x: 240, y: 190 }, value: null, isFixed: false },
  ],
  lines: [
    { id: 'l1', nodeIds: ['n1', 'n2', 'n3'] },  // Left vertical
    { id: 'l2', nodeIds: ['n2', 'n4', 'n6'] },  // Crossbar
    { id: 'l3', nodeIds: ['n5', 'n6', 'n7'] },  // Right vertical
  ],
  targetSum: 12,
  availableNumbers: [1, 2, 3, 4, 5, 6, 7],
  difficulty: 'medium',
  isSolvable: true,
};

/**
 * Letter J - Hook shape
 */
export const letterJ: LetterPuzzle = {
  letter: 'J',
  name: 'Letter J',
  letterDifficulty: 'medium',
  nodes: [
    { id: 'n1', position: { x: 120, y: 30 }, value: null, isFixed: false },
    { id: 'n2', position: { x: 180, y: 30 }, value: null, isFixed: false },
    { id: 'n3', position: { x: 240, y: 30 }, value: null, isFixed: false },
    { id: 'n4', position: { x: 180, y: 110 }, value: null, isFixed: false },
    { id: 'n5', position: { x: 180, y: 190 }, value: null, isFixed: false },
    { id: 'n6', position: { x: 120, y: 190 }, value: null, isFixed: false },
    { id: 'n7', position: { x: 60, y: 150 }, value: null, isFixed: false },
  ],
  lines: [
    { id: 'l1', nodeIds: ['n1', 'n2', 'n3'] },  // Top serif
    { id: 'l2', nodeIds: ['n2', 'n4', 'n5'] },  // Vertical
    { id: 'l3', nodeIds: ['n7', 'n6', 'n5'] },  // Hook
  ],
  targetSum: 12,
  availableNumbers: [1, 2, 3, 4, 5, 6, 7],
  difficulty: 'medium',
  isSolvable: true,
};

/**
 * Letter K - Vertical with two diagonals
 */
export const letterK: LetterPuzzle = {
  letter: 'K',
  name: 'Letter K',
  letterDifficulty: 'medium',
  nodes: [
    { id: 'n1', position: { x: 60, y: 30 }, value: null, isFixed: false },
    { id: 'n2', position: { x: 60, y: 110 }, value: null, isFixed: false },
    { id: 'n3', position: { x: 60, y: 190 }, value: null, isFixed: false },
    { id: 'n4', position: { x: 150, y: 70 }, value: null, isFixed: false },
    { id: 'n5', position: { x: 240, y: 30 }, value: null, isFixed: false },
    { id: 'n6', position: { x: 150, y: 150 }, value: null, isFixed: false },
    { id: 'n7', position: { x: 240, y: 190 }, value: null, isFixed: false },
  ],
  lines: [
    { id: 'l1', nodeIds: ['n1', 'n2', 'n3'] },  // Vertical
    { id: 'l2', nodeIds: ['n5', 'n4', 'n2'] },  // Upper diagonal
    { id: 'l3', nodeIds: ['n2', 'n6', 'n7'] },  // Lower diagonal
  ],
  targetSum: 12,
  availableNumbers: [1, 2, 3, 4, 5, 6, 7],
  difficulty: 'medium',
  isSolvable: true,
};

/**
 * Letter N - Two verticals with diagonal
 */
export const letterN: LetterPuzzle = {
  letter: 'N',
  name: 'Letter N',
  letterDifficulty: 'medium',
  nodes: [
    { id: 'n1', position: { x: 60, y: 30 }, value: null, isFixed: false },
    { id: 'n2', position: { x: 60, y: 110 }, value: null, isFixed: false },
    { id: 'n3', position: { x: 60, y: 190 }, value: null, isFixed: false },
    { id: 'n4', position: { x: 150, y: 110 }, value: null, isFixed: false },
    { id: 'n5', position: { x: 240, y: 30 }, value: null, isFixed: false },
    { id: 'n6', position: { x: 240, y: 110 }, value: null, isFixed: false },
    { id: 'n7', position: { x: 240, y: 190 }, value: null, isFixed: false },
  ],
  lines: [
    { id: 'l1', nodeIds: ['n1', 'n2', 'n3'] },  // Left vertical
    { id: 'l2', nodeIds: ['n1', 'n4', 'n7'] },  // Diagonal
    { id: 'l3', nodeIds: ['n5', 'n6', 'n7'] },  // Right vertical
  ],
  targetSum: 12,
  availableNumbers: [1, 2, 3, 4, 5, 6, 7],
  difficulty: 'medium',
  isSolvable: true,
};

/**
 * Letter U - Two verticals with bottom curve
 */
export const letterU: LetterPuzzle = {
  letter: 'U',
  name: 'Letter U',
  letterDifficulty: 'medium',
  nodes: [
    { id: 'n1', position: { x: 60, y: 30 }, value: null, isFixed: false },
    { id: 'n2', position: { x: 60, y: 110 }, value: null, isFixed: false },
    { id: 'n3', position: { x: 60, y: 190 }, value: null, isFixed: false },
    { id: 'n4', position: { x: 150, y: 190 }, value: null, isFixed: false },
    { id: 'n5', position: { x: 240, y: 190 }, value: null, isFixed: false },
    { id: 'n6', position: { x: 240, y: 110 }, value: null, isFixed: false },
    { id: 'n7', position: { x: 240, y: 30 }, value: null, isFixed: false },
  ],
  lines: [
    { id: 'l1', nodeIds: ['n1', 'n2', 'n3'] },  // Left vertical
    { id: 'l2', nodeIds: ['n3', 'n4', 'n5'] },  // Bottom
    { id: 'l3', nodeIds: ['n5', 'n6', 'n7'] },  // Right vertical
  ],
  targetSum: 12,
  availableNumbers: [1, 2, 3, 4, 5, 6, 7],
  difficulty: 'medium',
  isSolvable: true,
};

// ========================================
// HARD LETTERS (7+ lines or complex)
// ========================================

/**
 * Letter B - Redesigned so no two lines share more than 1 node
 * Structure: Top bar with bumps, left side, right side meeting at bottom
 * Each pair of lines shares at most 1 node (n1, n2, or n6)
 */
export const letterB: LetterPuzzle = {
  letter: 'B',
  name: 'Letter B',
  letterDifficulty: 'hard',
  nodes: [
    { id: 'n1', position: { x: 60, y: 30 }, value: null, isFixed: false },   // Top-left
    { id: 'n2', position: { x: 150, y: 30 }, value: null, isFixed: false },  // Top-right bump
    { id: 'n3', position: { x: 120, y: 30 }, value: null, isFixed: false },  // Top-center
    { id: 'n4', position: { x: 60, y: 110 }, value: null, isFixed: false },  // Mid-left
    { id: 'n5', position: { x: 60, y: 190 }, value: null, isFixed: false },  // Bottom-left
    { id: 'n6', position: { x: 150, y: 190 }, value: null, isFixed: false }, // Bottom-right
  ],
  lines: [
    { id: 'l1', nodeIds: ['n1', 'n3', 'n2'] },  // Top bar with bump
    { id: 'l2', nodeIds: ['n1', 'n4', 'n5'] },  // Left vertical
    { id: 'l3', nodeIds: ['n2', 'n6', 'n5'] },  // Right side to bottom
  ],
  targetSum: 12,
  availableNumbers: [1, 2, 3, 4, 5, 6],
  difficulty: 'hard',
  isSolvable: true,
};

/**
 * Letter D - Vertical with curved right side (simplified)
 */
export const letterD: LetterPuzzle = {
  letter: 'D',
  name: 'Letter D',
  letterDifficulty: 'hard',
  nodes: [
    { id: 'n1', position: { x: 60, y: 30 }, value: null, isFixed: false },
    { id: 'n2', position: { x: 60, y: 110 }, value: null, isFixed: false },
    { id: 'n3', position: { x: 60, y: 190 }, value: null, isFixed: false },
    { id: 'n4', position: { x: 150, y: 30 }, value: null, isFixed: false },
    { id: 'n5', position: { x: 200, y: 110 }, value: null, isFixed: false },
    { id: 'n6', position: { x: 150, y: 190 }, value: null, isFixed: false },
  ],
  lines: [
    { id: 'l1', nodeIds: ['n1', 'n2', 'n3'] },  // Left vertical
    { id: 'l2', nodeIds: ['n1', 'n4', 'n5'] },  // Top to right
    { id: 'l3', nodeIds: ['n5', 'n6', 'n3'] },  // Right to bottom
  ],
  targetSum: 12,
  availableNumbers: [1, 2, 3, 4, 5, 6],
  difficulty: 'hard',
  isSolvable: true,
};

/**
 * Letter G - C with inward bar (simplified to 3 lines)
 */
export const letterG: LetterPuzzle = {
  letter: 'G',
  name: 'Letter G',
  letterDifficulty: 'hard',
  nodes: [
    { id: 'n1', position: { x: 200, y: 30 }, value: null, isFixed: false },
    { id: 'n2', position: { x: 120, y: 30 }, value: null, isFixed: false },
    { id: 'n3', position: { x: 60, y: 110 }, value: null, isFixed: false },
    { id: 'n4', position: { x: 120, y: 190 }, value: null, isFixed: false },
    { id: 'n5', position: { x: 200, y: 190 }, value: null, isFixed: false },
    { id: 'n6', position: { x: 200, y: 130 }, value: null, isFixed: false },
    { id: 'n7', position: { x: 140, y: 130 }, value: null, isFixed: false },
  ],
  lines: [
    { id: 'l1', nodeIds: ['n1', 'n2', 'n3'] },  // Top curve
    { id: 'l2', nodeIds: ['n3', 'n4', 'n5'] },  // Bottom curve
    { id: 'l3', nodeIds: ['n5', 'n6', 'n7'] },  // Inward bar
  ],
  targetSum: 12,
  availableNumbers: [1, 2, 3, 4, 5, 6, 7],
  difficulty: 'hard',
  isSolvable: true,
};

/**
 * Letter M - Simplified to two peaks meeting at center (3 lines)
 */
export const letterM: LetterPuzzle = {
  letter: 'M',
  name: 'Letter M',
  letterDifficulty: 'hard',
  nodes: [
    { id: 'n1', position: { x: 40, y: 190 }, value: null, isFixed: false },
    { id: 'n2', position: { x: 40, y: 30 }, value: null, isFixed: false },
    { id: 'n3', position: { x: 100, y: 110 }, value: null, isFixed: false },
    { id: 'n4', position: { x: 150, y: 70 }, value: null, isFixed: false },
    { id: 'n5', position: { x: 200, y: 110 }, value: null, isFixed: false },
    { id: 'n6', position: { x: 260, y: 30 }, value: null, isFixed: false },
    { id: 'n7', position: { x: 260, y: 190 }, value: null, isFixed: false },
  ],
  lines: [
    { id: 'l1', nodeIds: ['n1', 'n2', 'n3'] },  // Left leg + peak start
    { id: 'l2', nodeIds: ['n3', 'n4', 'n5'] },  // Center V
    { id: 'l3', nodeIds: ['n5', 'n6', 'n7'] },  // Right peak + leg
  ],
  targetSum: 12,
  availableNumbers: [1, 2, 3, 4, 5, 6, 7],
  difficulty: 'hard',
  isSolvable: true,
};

/**
 * Letter O - Rectangle (simplified circle)
 */
export const letterO: LetterPuzzle = {
  letter: 'O',
  name: 'Letter O',
  letterDifficulty: 'hard',
  nodes: [
    { id: 'n1', position: { x: 80, y: 30 }, value: null, isFixed: false },
    { id: 'n2', position: { x: 150, y: 30 }, value: null, isFixed: false },
    { id: 'n3', position: { x: 220, y: 30 }, value: null, isFixed: false },
    { id: 'n4', position: { x: 80, y: 110 }, value: null, isFixed: false },
    { id: 'n5', position: { x: 220, y: 110 }, value: null, isFixed: false },
    { id: 'n6', position: { x: 80, y: 190 }, value: null, isFixed: false },
    { id: 'n7', position: { x: 150, y: 190 }, value: null, isFixed: false },
    { id: 'n8', position: { x: 220, y: 190 }, value: null, isFixed: false },
  ],
  lines: [
    { id: 'l1', nodeIds: ['n1', 'n2', 'n3'] },  // Top
    { id: 'l2', nodeIds: ['n1', 'n4', 'n6'] },  // Left
    { id: 'l3', nodeIds: ['n3', 'n5', 'n8'] },  // Right
    { id: 'l4', nodeIds: ['n6', 'n7', 'n8'] },  // Bottom
  ],
  targetSum: 15,
  availableNumbers: [1, 2, 3, 4, 5, 6, 7, 8],
  difficulty: 'hard',
  isSolvable: true,
};

/**
 * Letter P - Vertical with top loop (simplified)
 */
export const letterP: LetterPuzzle = {
  letter: 'P',
  name: 'Letter P',
  letterDifficulty: 'hard',
  nodes: [
    { id: 'n1', position: { x: 60, y: 30 }, value: null, isFixed: false },
    { id: 'n2', position: { x: 60, y: 100 }, value: null, isFixed: false },
    { id: 'n3', position: { x: 60, y: 170 }, value: null, isFixed: false },
    { id: 'n4', position: { x: 140, y: 30 }, value: null, isFixed: false },
    { id: 'n5', position: { x: 180, y: 65 }, value: null, isFixed: false },
    { id: 'n6', position: { x: 140, y: 100 }, value: null, isFixed: false },
  ],
  lines: [
    { id: 'l1', nodeIds: ['n1', 'n2', 'n3'] },  // Vertical stem
    { id: 'l2', nodeIds: ['n1', 'n4', 'n5'] },  // Top of loop
    { id: 'l3', nodeIds: ['n5', 'n6', 'n2'] },  // Bottom of loop
  ],
  targetSum: 12,
  availableNumbers: [1, 2, 3, 4, 5, 6],
  difficulty: 'hard',
  isSolvable: true,
};

/**
 * Letter Q - Redesigned so no two lines share more than 1 node
 * Structure: Top arc, left side, right side with tail
 * Each pair of lines shares at most 1 node (n1 or n3)
 */
export const letterQ: LetterPuzzle = {
  letter: 'Q',
  name: 'Letter Q',
  letterDifficulty: 'hard',
  nodes: [
    { id: 'n1', position: { x: 80, y: 30 }, value: null, isFixed: false },   // Top-left
    { id: 'n2', position: { x: 150, y: 30 }, value: null, isFixed: false },  // Top-center
    { id: 'n3', position: { x: 220, y: 30 }, value: null, isFixed: false },  // Top-right
    { id: 'n4', position: { x: 80, y: 110 }, value: null, isFixed: false },  // Mid-left
    { id: 'n5', position: { x: 220, y: 110 }, value: null, isFixed: false }, // Mid-right
    { id: 'n6', position: { x: 80, y: 190 }, value: null, isFixed: false },  // Bottom-left
    { id: 'n7', position: { x: 260, y: 190 }, value: null, isFixed: false }, // Tail end
  ],
  lines: [
    { id: 'l1', nodeIds: ['n1', 'n2', 'n3'] },  // Top arc
    { id: 'l2', nodeIds: ['n1', 'n4', 'n6'] },  // Left side
    { id: 'l3', nodeIds: ['n3', 'n5', 'n7'] },  // Right side with tail
  ],
  targetSum: 12,
  availableNumbers: [1, 2, 3, 4, 5, 6, 7],
  difficulty: 'hard',
  isSolvable: true,
};

/**
 * Letter R - Redesigned so no two lines share more than 1 node
 * Structure: Top bar, left vertical, diagonal leg from top-right
 * Each pair of lines shares at most 1 node (n1 or n2)
 */
export const letterR: LetterPuzzle = {
  letter: 'R',
  name: 'Letter R',
  letterDifficulty: 'hard',
  nodes: [
    { id: 'n1', position: { x: 60, y: 30 }, value: null, isFixed: false },   // Top-left
    { id: 'n2', position: { x: 150, y: 30 }, value: null, isFixed: false },  // Top-right (loop peak)
    { id: 'n3', position: { x: 100, y: 30 }, value: null, isFixed: false },  // Top-center
    { id: 'n4', position: { x: 60, y: 110 }, value: null, isFixed: false },  // Mid-left
    { id: 'n5', position: { x: 60, y: 190 }, value: null, isFixed: false },  // Bottom-left (stem foot)
    { id: 'n6', position: { x: 120, y: 110 }, value: null, isFixed: false }, // Diagonal mid
    { id: 'n7', position: { x: 180, y: 190 }, value: null, isFixed: false }, // Leg end
  ],
  lines: [
    { id: 'l1', nodeIds: ['n1', 'n3', 'n2'] },  // Top bar (loop)
    { id: 'l2', nodeIds: ['n1', 'n4', 'n5'] },  // Left vertical stem
    { id: 'l3', nodeIds: ['n2', 'n6', 'n7'] },  // Diagonal leg
  ],
  targetSum: 12,
  availableNumbers: [1, 2, 3, 4, 5, 6, 7],
  difficulty: 'hard',
  isSolvable: true,
};

/**
 * Letter S - Simplified snake (3 lines)
 */
export const letterS: LetterPuzzle = {
  letter: 'S',
  name: 'Letter S',
  letterDifficulty: 'hard',
  nodes: [
    { id: 'n1', position: { x: 200, y: 30 }, value: null, isFixed: false },
    { id: 'n2', position: { x: 100, y: 30 }, value: null, isFixed: false },
    { id: 'n3', position: { x: 100, y: 110 }, value: null, isFixed: false },
    { id: 'n4', position: { x: 200, y: 110 }, value: null, isFixed: false },
    { id: 'n5', position: { x: 200, y: 190 }, value: null, isFixed: false },
    { id: 'n6', position: { x: 100, y: 190 }, value: null, isFixed: false },
    { id: 'n7', position: { x: 50, y: 190 }, value: null, isFixed: false },
  ],
  lines: [
    { id: 'l1', nodeIds: ['n1', 'n2', 'n3'] },  // Top curve
    { id: 'l2', nodeIds: ['n3', 'n4', 'n5'] },  // Middle diagonal
    { id: 'l3', nodeIds: ['n5', 'n6', 'n7'] },  // Bottom curve
  ],
  targetSum: 12,
  availableNumbers: [1, 2, 3, 4, 5, 6, 7],
  difficulty: 'hard',
  isSolvable: true,
};

/**
 * Letter W - Simplified double V (3 lines)
 */
export const letterW: LetterPuzzle = {
  letter: 'W',
  name: 'Letter W',
  letterDifficulty: 'hard',
  nodes: [
    { id: 'n1', position: { x: 40, y: 30 }, value: null, isFixed: false },
    { id: 'n2', position: { x: 80, y: 110 }, value: null, isFixed: false },
    { id: 'n3', position: { x: 120, y: 190 }, value: null, isFixed: false },
    { id: 'n4', position: { x: 150, y: 110 }, value: null, isFixed: false },
    { id: 'n5', position: { x: 180, y: 190 }, value: null, isFixed: false },
    { id: 'n6', position: { x: 220, y: 110 }, value: null, isFixed: false },
    { id: 'n7', position: { x: 260, y: 30 }, value: null, isFixed: false },
  ],
  lines: [
    { id: 'l1', nodeIds: ['n1', 'n2', 'n3'] },  // Left diagonal
    { id: 'l2', nodeIds: ['n3', 'n4', 'n5'] },  // Center V
    { id: 'l3', nodeIds: ['n5', 'n6', 'n7'] },  // Right diagonal
  ],
  targetSum: 12,
  availableNumbers: [1, 2, 3, 4, 5, 6, 7],
  difficulty: 'hard',
  isSolvable: true,
};

// ========================================
// EXPORTS
// ========================================

/** Easy letters (3-4 lines): I, L, T, V, X, Y, Z */
export const easyLetters: LetterPuzzle[] = [
  letterI,
  letterL,
  letterT,
  letterV,
  letterX,
  letterY,
  letterZ,
];

/** Medium letters (5-6 lines): A, C, E, F, H, J, K, N, U */
export const mediumLetters: LetterPuzzle[] = [
  letterA,
  letterC,
  letterE,
  letterF,
  letterH,
  letterJ,
  letterK,
  letterN,
  letterU,
];

/** Hard letters (7+ lines): B, D, G, M, O, P, Q, R, S, W */
export const hardLetters: LetterPuzzle[] = [
  letterB,
  letterD,
  letterG,
  letterM,
  letterO,
  letterP,
  letterQ,
  letterR,
  letterS,
  letterW,
];

/** All 26 alphabet letter puzzles */
export const alphabetPuzzles: LetterPuzzle[] = [
  ...easyLetters,
  ...mediumLetters,
  ...hardLetters,
];

/** Map letter to puzzle for quick lookup */
export const letterPuzzleMap: Record<string, LetterPuzzle> = Object.fromEntries(
  alphabetPuzzles.map(puzzle => [puzzle.letter, puzzle])
);

/**
 * Get puzzles by letter difficulty
 */
export function getPuzzlesByLetterDifficulty(difficulty: LetterDifficulty): LetterPuzzle[] {
  switch (difficulty) {
    case 'easy':
      return easyLetters;
    case 'medium':
      return mediumLetters;
    case 'hard':
      return hardLetters;
  }
}

/**
 * Get puzzles appropriate for game difficulty
 */
export function getAlphabetPuzzlesForDifficulty(difficulty: Difficulty): LetterPuzzle[] {
  switch (difficulty) {
    case 'easy':
      return easyLetters;
    case 'medium':
      return [...easyLetters, ...mediumLetters];
    case 'hard':
    case 'master':
    case 'grandmaster':
      return alphabetPuzzles;
  }
}
