// ========================================
// Magic Graph - Elaborate Puzzle Templates
// Based on reference images with M-shapes, stars, etc.
// ========================================

import type { PuzzleConfig } from "./types";
import { alphabetPuzzles } from "./alphabetPuzzles";

/**
 * Line puzzle - 3 nodes in a row (simplest valid puzzle)
 */
export const linePuzzle: Omit<PuzzleConfig, "id"> = {
  name: "Line of Three",
  nodes: [
    { id: "n1", position: { x: 50, y: 125 }, value: null, isFixed: false },
    { id: "n2", position: { x: 150, y: 125 }, value: null, isFixed: false },
    { id: "n3", position: { x: 250, y: 125 }, value: null, isFixed: false },
  ],
  lines: [{ id: "l1", nodeIds: ["n1", "n2", "n3"] }],
  targetSum: 6,
  availableNumbers: [1, 2, 3],
  difficulty: "easy",
  isSolvable: true,
};

/**
 * Cross/Plus puzzle - 5 nodes
 */
export const crossPuzzle: Omit<PuzzleConfig, "id"> = {
  name: "Cross",
  nodes: [
    { id: "n1", position: { x: 150, y: 30 }, value: null, isFixed: false },
    { id: "n2", position: { x: 50, y: 125 }, value: null, isFixed: false },
    { id: "n3", position: { x: 150, y: 125 }, value: null, isFixed: false },
    { id: "n4", position: { x: 250, y: 125 }, value: null, isFixed: false },
    { id: "n5", position: { x: 150, y: 220 }, value: null, isFixed: false },
  ],
  lines: [
    { id: "l1", nodeIds: ["n1", "n3", "n5"] },
    { id: "l2", nodeIds: ["n2", "n3", "n4"] },
  ],
  targetSum: 9,
  availableNumbers: [1, 2, 3, 4, 5],
  difficulty: "easy",
  isSolvable: true,
};

/**
 * Magic Triangle - 6 nodes (3 corners + 3 midpoints)
 */
export const magicTrianglePuzzle: Omit<PuzzleConfig, "id"> = {
  name: "Magic Triangle",
  nodes: [
    { id: "n1", position: { x: 150, y: 20 }, value: null, isFixed: false },
    { id: "n2", position: { x: 100, y: 80 }, value: null, isFixed: false },
    { id: "n3", position: { x: 200, y: 80 }, value: null, isFixed: false },
    { id: "n4", position: { x: 50, y: 160 }, value: null, isFixed: false },
    { id: "n5", position: { x: 150, y: 160 }, value: null, isFixed: false },
    { id: "n6", position: { x: 250, y: 160 }, value: null, isFixed: false },
  ],
  lines: [
    { id: "l1", nodeIds: ["n1", "n2", "n4"] },
    { id: "l2", nodeIds: ["n1", "n3", "n6"] },
    { id: "l3", nodeIds: ["n4", "n5", "n6"] },
  ],
  targetSum: 9,
  availableNumbers: [1, 2, 3, 4, 5, 6],
  difficulty: "medium",
  isSolvable: true,
};

/**
 * Diamond/Rhombus Shape
 */
export const diamondPuzzle: Omit<PuzzleConfig, "id"> = {
  name: "Diamond",
  nodes: [
    { id: "n1", position: { x: 150, y: 10 }, value: null, isFixed: false }, // Top
    { id: "n2", position: { x: 100, y: 60 }, value: null, isFixed: false }, // Upper left
    { id: "n3", position: { x: 200, y: 60 }, value: null, isFixed: false }, // Upper right
    { id: "n4", position: { x: 50, y: 110 }, value: null, isFixed: false }, // Middle left
    { id: "n5", position: { x: 150, y: 110 }, value: null, isFixed: false }, // Center
    { id: "n6", position: { x: 250, y: 110 }, value: null, isFixed: false }, // Middle right
    { id: "n7", position: { x: 100, y: 160 }, value: null, isFixed: false }, // Lower left
    { id: "n8", position: { x: 200, y: 160 }, value: null, isFixed: false }, // Lower right
    { id: "n9", position: { x: 150, y: 210 }, value: null, isFixed: false }, // Bottom
  ],
  lines: [
    { id: "l1", nodeIds: ["n1", "n2", "n4"] }, // Top-left edge
    { id: "l2", nodeIds: ["n1", "n3", "n6"] }, // Top-right edge
    { id: "l3", nodeIds: ["n4", "n7", "n9"] }, // Bottom-left edge
    { id: "l4", nodeIds: ["n6", "n8", "n9"] }, // Bottom-right edge
    { id: "l5", nodeIds: ["n2", "n5", "n8"] }, // Diagonal \
    { id: "l6", nodeIds: ["n3", "n5", "n7"] }, // Diagonal /
  ],
  targetSum: 15,
  availableNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  difficulty: "medium",
  isSolvable: true,
};

/**
 * Magic Square (3x3)
 */
export const magicSquarePuzzle: Omit<PuzzleConfig, "id"> = {
  name: "Magic Square 3×3",
  nodes: [
    { id: "n1", position: { x: 50, y: 50 }, value: null, isFixed: false },
    { id: "n2", position: { x: 150, y: 50 }, value: null, isFixed: false },
    { id: "n3", position: { x: 250, y: 50 }, value: null, isFixed: false },
    { id: "n4", position: { x: 50, y: 125 }, value: null, isFixed: false },
    { id: "n5", position: { x: 150, y: 125 }, value: null, isFixed: false },
    { id: "n6", position: { x: 250, y: 125 }, value: null, isFixed: false },
    { id: "n7", position: { x: 50, y: 200 }, value: null, isFixed: false },
    { id: "n8", position: { x: 150, y: 200 }, value: null, isFixed: false },
    { id: "n9", position: { x: 250, y: 200 }, value: null, isFixed: false },
  ],
  lines: [
    { id: "r1", nodeIds: ["n1", "n2", "n3"] },
    { id: "r2", nodeIds: ["n4", "n5", "n6"] },
    { id: "r3", nodeIds: ["n7", "n8", "n9"] },
    { id: "c1", nodeIds: ["n1", "n4", "n7"] },
    { id: "c2", nodeIds: ["n2", "n5", "n8"] },
    { id: "c3", nodeIds: ["n3", "n6", "n9"] },
  ],
  targetSum: 15,
  availableNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  difficulty: "hard",
  isSolvable: true,
};

/**
 * All verified solvable puzzle templates including alphabet letters.
 */
export const puzzleTemplates = [
  linePuzzle,
  crossPuzzle,
  magicTrianglePuzzle,
  diamondPuzzle,
  magicSquarePuzzle,
  ...alphabetPuzzles,
];

// Re-export alphabet puzzles for use in other modules
export {
  alphabetPuzzles,
  easyLetters,
  mediumLetters,
  hardLetters,
  getAlphabetPuzzlesForDifficulty,
} from "./alphabetPuzzles";
export type { LetterPuzzle } from "./alphabetPuzzles";
