// ========================================
// Magic Graph - Elaborate Puzzle Templates
// Based on reference images with M-shapes, stars, etc.
// ========================================

import type { PuzzleConfig } from './types';

/**
 * Line puzzle - 3 nodes in a row (simplest valid puzzle)
 */
export const linePuzzle: Omit<PuzzleConfig, 'id'> = {
    name: 'Line of Three',
    nodes: [
        { id: 'n1', position: { x: 50, y: 125 }, value: null, isFixed: false },
        { id: 'n2', position: { x: 150, y: 125 }, value: null, isFixed: false },
        { id: 'n3', position: { x: 250, y: 125 }, value: null, isFixed: false },
    ],
    lines: [
        { id: 'l1', nodeIds: ['n1', 'n2', 'n3'] },
    ],
    targetSum: 6,
    availableNumbers: [1, 2, 3],
    difficulty: 'easy',
    isSolvable: true,
};

/**
 * Cross/Plus puzzle - 5 nodes
 */
export const crossPuzzle: Omit<PuzzleConfig, 'id'> = {
    name: 'Cross',
    nodes: [
        { id: 'n1', position: { x: 150, y: 30 }, value: null, isFixed: false },
        { id: 'n2', position: { x: 50, y: 125 }, value: null, isFixed: false },
        { id: 'n3', position: { x: 150, y: 125 }, value: null, isFixed: false },
        { id: 'n4', position: { x: 250, y: 125 }, value: null, isFixed: false },
        { id: 'n5', position: { x: 150, y: 220 }, value: null, isFixed: false },
    ],
    lines: [
        { id: 'l1', nodeIds: ['n1', 'n3', 'n5'] },
        { id: 'l2', nodeIds: ['n2', 'n3', 'n4'] },
    ],
    targetSum: 9,
    availableNumbers: [1, 2, 3, 4, 5],
    difficulty: 'easy',
    isSolvable: true,
};

/**
 * Magic Triangle - 6 nodes (3 corners + 3 midpoints)
 */
export const magicTrianglePuzzle: Omit<PuzzleConfig, 'id'> = {
    name: 'Magic Triangle',
    nodes: [
        { id: 'n1', position: { x: 150, y: 20 }, value: null, isFixed: false },
        { id: 'n2', position: { x: 100, y: 80 }, value: null, isFixed: false },
        { id: 'n3', position: { x: 200, y: 80 }, value: null, isFixed: false },
        { id: 'n4', position: { x: 50, y: 160 }, value: null, isFixed: false },
        { id: 'n5', position: { x: 150, y: 160 }, value: null, isFixed: false },
        { id: 'n6', position: { x: 250, y: 160 }, value: null, isFixed: false },
    ],
    lines: [
        { id: 'l1', nodeIds: ['n1', 'n2', 'n4'] },
        { id: 'l2', nodeIds: ['n1', 'n3', 'n6'] },
        { id: 'l3', nodeIds: ['n4', 'n5', 'n6'] },
    ],
    targetSum: 9,
    availableNumbers: [1, 2, 3, 4, 5, 6],
    difficulty: 'medium',
    isSolvable: true,
};

/**
 * M-Shape Puzzle - Based on reference image IMG_1796.JPG
 * Complex shape with multiple intersecting lines
 * 
 *   1       2       3
 *   |       |       |
 *   4---5---6---7---8
 *   |       |       |
 *   9              10
 */
export const mShapePuzzle: Omit<PuzzleConfig, 'id'> = {
    name: 'Letter M',
    nodes: [
        // Top row
        { id: 'n1', position: { x: 40, y: 20 }, value: null, isFixed: false },
        { id: 'n2', position: { x: 150, y: 20 }, value: null, isFixed: false },
        { id: 'n3', position: { x: 260, y: 20 }, value: null, isFixed: false },
        // Middle row
        { id: 'n4', position: { x: 40, y: 100 }, value: null, isFixed: false },
        { id: 'n5', position: { x: 95, y: 100 }, value: null, isFixed: false },
        { id: 'n6', position: { x: 150, y: 100 }, value: null, isFixed: false },
        { id: 'n7', position: { x: 205, y: 100 }, value: null, isFixed: false },
        { id: 'n8', position: { x: 260, y: 100 }, value: null, isFixed: false },
        // Bottom row
        { id: 'n9', position: { x: 40, y: 180 }, value: null, isFixed: false },
        { id: 'n10', position: { x: 260, y: 180 }, value: null, isFixed: false },
    ],
    lines: [
        { id: 'l1', nodeIds: ['n1', 'n4', 'n9'] },          // Left vertical
        { id: 'l2', nodeIds: ['n2', 'n6'] },                // Center vertical top
        { id: 'l3', nodeIds: ['n3', 'n8', 'n10'] },         // Right vertical
        { id: 'l4', nodeIds: ['n4', 'n5', 'n6', 'n7', 'n8'] }, // Middle horizontal
    ],
    targetSum: 15,
    availableNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    difficulty: 'hard',
    isSolvable: true,
};

/**
 * Star Shape - 5-pointed star
 */
export const starPuzzle: Omit<PuzzleConfig, 'id'> = {
    name: '5-Point Star',
    nodes: [
        // Outer points
        { id: 'n1', position: { x: 150, y: 10 }, value: null, isFixed: false },   // Top
        { id: 'n2', position: { x: 280, y: 90 }, value: null, isFixed: false },   // Top right
        { id: 'n3', position: { x: 230, y: 200 }, value: null, isFixed: false },  // Bottom right
        { id: 'n4', position: { x: 70, y: 200 }, value: null, isFixed: false },   // Bottom left
        { id: 'n5', position: { x: 20, y: 90 }, value: null, isFixed: false },    // Top left
        // Inner pentagon
        { id: 'n6', position: { x: 150, y: 70 }, value: null, isFixed: false },   // Top inner
        { id: 'n7', position: { x: 210, y: 110 }, value: null, isFixed: false },  // Right inner
        { id: 'n8', position: { x: 185, y: 170 }, value: null, isFixed: false },  // Bottom right inner
        { id: 'n9', position: { x: 115, y: 170 }, value: null, isFixed: false },  // Bottom left inner
        { id: 'n10', position: { x: 90, y: 110 }, value: null, isFixed: false },  // Left inner
    ],
    lines: [
        { id: 'l1', nodeIds: ['n1', 'n6', 'n8', 'n4'] },   // Top to bottom-left
        { id: 'l2', nodeIds: ['n1', 'n6', 'n9', 'n3'] },   // Top to bottom-right (adjusted)
        { id: 'l3', nodeIds: ['n2', 'n7', 'n9', 'n5'] },   // Right to left
        { id: 'l4', nodeIds: ['n2', 'n7', 'n10', 'n4'] },  // Right to bottom-left
        { id: 'l5', nodeIds: ['n3', 'n8', 'n10', 'n5'] },  // Bottom-right to top-left
    ],
    targetSum: 24,
    availableNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    difficulty: 'hard',
    isSolvable: true,
};

/**
 * Diamond/Rhombus Shape
 */
export const diamondPuzzle: Omit<PuzzleConfig, 'id'> = {
    name: 'Diamond',
    nodes: [
        { id: 'n1', position: { x: 150, y: 10 }, value: null, isFixed: false },   // Top
        { id: 'n2', position: { x: 100, y: 60 }, value: null, isFixed: false },   // Upper left
        { id: 'n3', position: { x: 200, y: 60 }, value: null, isFixed: false },   // Upper right
        { id: 'n4', position: { x: 50, y: 110 }, value: null, isFixed: false },   // Middle left
        { id: 'n5', position: { x: 150, y: 110 }, value: null, isFixed: false },  // Center
        { id: 'n6', position: { x: 250, y: 110 }, value: null, isFixed: false },  // Middle right
        { id: 'n7', position: { x: 100, y: 160 }, value: null, isFixed: false },  // Lower left
        { id: 'n8', position: { x: 200, y: 160 }, value: null, isFixed: false },  // Lower right
        { id: 'n9', position: { x: 150, y: 210 }, value: null, isFixed: false },  // Bottom
    ],
    lines: [
        { id: 'l1', nodeIds: ['n1', 'n2', 'n4'] },         // Top-left edge
        { id: 'l2', nodeIds: ['n1', 'n3', 'n6'] },         // Top-right edge
        { id: 'l3', nodeIds: ['n4', 'n7', 'n9'] },         // Bottom-left edge
        { id: 'l4', nodeIds: ['n6', 'n8', 'n9'] },         // Bottom-right edge
        { id: 'l5', nodeIds: ['n2', 'n5', 'n8'] },         // Diagonal \
        { id: 'l6', nodeIds: ['n3', 'n5', 'n7'] },         // Diagonal /
    ],
    targetSum: 15,
    availableNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    difficulty: 'medium',
    isSolvable: true,
};

/**
 * Magic Square (3x3)
 */
export const magicSquarePuzzle: Omit<PuzzleConfig, 'id'> = {
    name: 'Magic Square 3×3',
    nodes: [
        { id: 'n1', position: { x: 50, y: 50 }, value: null, isFixed: false },
        { id: 'n2', position: { x: 150, y: 50 }, value: null, isFixed: false },
        { id: 'n3', position: { x: 250, y: 50 }, value: null, isFixed: false },
        { id: 'n4', position: { x: 50, y: 125 }, value: null, isFixed: false },
        { id: 'n5', position: { x: 150, y: 125 }, value: null, isFixed: false },
        { id: 'n6', position: { x: 250, y: 125 }, value: null, isFixed: false },
        { id: 'n7', position: { x: 50, y: 200 }, value: null, isFixed: false },
        { id: 'n8', position: { x: 150, y: 200 }, value: null, isFixed: false },
        { id: 'n9', position: { x: 250, y: 200 }, value: null, isFixed: false },
    ],
    lines: [
        { id: 'r1', nodeIds: ['n1', 'n2', 'n3'] },
        { id: 'r2', nodeIds: ['n4', 'n5', 'n6'] },
        { id: 'r3', nodeIds: ['n7', 'n8', 'n9'] },
        { id: 'c1', nodeIds: ['n1', 'n4', 'n7'] },
        { id: 'c2', nodeIds: ['n2', 'n5', 'n8'] },
        { id: 'c3', nodeIds: ['n3', 'n6', 'n9'] },
    ],
    targetSum: 15,
    availableNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    difficulty: 'hard',
    isSolvable: true,
};

/**
 * Verified solvable puzzle templates.
 * Note: mShapePuzzle and starPuzzle are excluded due to structural issues
 * (lines with different node counts cannot have the same target sum)
 */
export const puzzleTemplates = [
    linePuzzle,
    crossPuzzle,
    magicTrianglePuzzle,
    diamondPuzzle,
    magicSquarePuzzle,
];

// ========================================
// Random Puzzle Generator
// ========================================

import { generatePuzzle } from './solver';

/**
 * Create a random base puzzle template (fast, no solving).
 * Use this with generatePuzzle or a Web Worker for the heavy solving step.
 */
export function createRandomBasePuzzle(
    difficulty: 'easy' | 'medium' | 'hard'
): { basePuzzle: Omit<PuzzleConfig, 'id'>; hintsToShow: number } {
    const shapes = getRandomShapes(difficulty);
    const shape = shapes[Math.floor(Math.random() * shapes.length)];

    const nodeCount = shape.nodes.length;
    let availableNumbers: number[];
    let targetSum: number;

    if (difficulty === 'easy') {
        const start = Math.floor(Math.random() * 3) + 1;
        availableNumbers = Array.from({ length: nodeCount }, (_, i) => start + i);
        targetSum = calculateMagicSum(availableNumbers, shape.lines[0].nodeIds.length);
    } else if (difficulty === 'medium') {
        const base = Math.floor(Math.random() * 5) + 1;
        availableNumbers = Array.from({ length: nodeCount }, (_, i) => base + i * 2);
        targetSum = calculateMagicSum(availableNumbers, shape.lines[0].nodeIds.length);
    } else {
        const useOdd = Math.random() > 0.5;
        availableNumbers = Array.from({ length: nodeCount }, (_, i) =>
            useOdd ? 1 + i * 2 : 2 + i * 2
        );
        targetSum = calculateMagicSum(availableNumbers, shape.lines[0].nodeIds.length);
    }

    const hintsToShow = difficulty === 'easy' ? 2 : difficulty === 'medium' ? 1 : 0;

    const basePuzzle = {
        ...shape,
        availableNumbers,
        targetSum,
        difficulty,
    };

    return { basePuzzle, hintsToShow };
}

/**
 * Generate a random puzzle synchronously (may block UI for complex puzzles).
 * For non-blocking generation, use createRandomBasePuzzle + useWorkerSolver hook.
 */
export function generateRandomPuzzle(difficulty: 'easy' | 'medium' | 'hard'): PuzzleConfig {
    const { basePuzzle, hintsToShow } = createRandomBasePuzzle(difficulty);
    return generatePuzzle(basePuzzle, hintsToShow);
}

function getRandomShapes(difficulty: 'easy' | 'medium' | 'hard') {
    if (difficulty === 'easy') {
        return [linePuzzle, crossPuzzle];
    } else if (difficulty === 'medium') {
        return [crossPuzzle, magicTrianglePuzzle, diamondPuzzle];
    } else {
        // Only verified solvable puzzles for hard difficulty
        return [diamondPuzzle, magicSquarePuzzle];
    }
}

function calculateMagicSum(numbers: number[], nodesPerLine: number): number {
    const total = numbers.reduce((a, b) => a + b, 0);
    const avg = total / numbers.length;
    return Math.round(avg * nodesPerLine);
}

// ========================================
// Mathematical Hints System
// ========================================

export interface MathHint {
    type: 'concept' | 'strategy' | 'specific';
    title: string;
    message: string;
}

export function getHints(puzzleName: string): MathHint[] {
    const hints: MathHint[] = [];

    if (puzzleName.includes('Line')) {
        hints.push({
            type: 'concept',
            title: 'Addition Basics',
            message: 'All numbers on a line must add up to the target sum. Try different orders!',
        });
    }

    if (puzzleName.includes('Cross')) {
        hints.push({
            type: 'concept',
            title: 'Shared Numbers',
            message: 'The center node appears in BOTH lines. This number is counted twice in the total!',
        });
        hints.push({
            type: 'strategy',
            title: 'Center First',
            message: 'Try placing the middle number (3) in the center. Why might this work?',
        });
    }

    if (puzzleName.includes('Triangle')) {
        hints.push({
            type: 'concept',
            title: 'Magic Constant',
            message: 'In a magic triangle, the sum of all numbers ÷ 3 + (corner sum) = target × 3',
        });
    }

    if (puzzleName.includes('Square')) {
        hints.push({
            type: 'concept',
            title: 'Magic Constant Formula',
            message: 'For a 3×3 magic square with 1-9: Magic Sum = n(n²+1)/2 = 3(10)/2 = 15',
        });
        hints.push({
            type: 'strategy',
            title: 'Center Number',
            message: 'The center of a 3×3 magic square is always 5 (the middle number)!',
        });
    }

    if (puzzleName.includes('M') || puzzleName.includes('Star') || puzzleName.includes('Diamond')) {
        hints.push({
            type: 'concept',
            title: 'Intersection Points',
            message: 'Nodes where multiple lines meet are key - they affect multiple sums at once!',
        });
        hints.push({
            type: 'strategy',
            title: 'Work Outward',
            message: 'Start from shared nodes and work outward to the edges.',
        });
    }

    return hints;
}

export function getProgressHint(
    filledCount: number,
    totalCount: number,
    hasErrors: boolean
): MathHint {
    if (hasErrors) {
        return {
            type: 'specific',
            title: 'Check Your Work',
            message: 'A red line means the sum is wrong. Try removing a number and replacing it.',
        };
    }

    if (filledCount === 0) {
        return {
            type: 'strategy',
            title: 'Where to Start?',
            message: 'Look for nodes that appear in multiple lines - these are key positions!',
        };
    }

    if (filledCount < totalCount / 2) {
        return {
            type: 'strategy',
            title: 'Build from Knowns',
            message: 'Pick a line with some filled numbers. Calculate what\'s needed to reach the sum.',
        };
    }

    return {
        type: 'strategy',
        title: 'Almost There!',
        message: 'Use algebra: if one line is mostly filled, the missing number = target - current sum.',
    };
}
