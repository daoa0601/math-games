// Re-export types
export type {
    Position,
    GraphNode,
    Line,
    PuzzleConfig,
    PuzzleState,
    LineStatus,
    LineWithStatus,
    Difficulty,
    OptimizationGoal,
} from './types';

// Re-export functions
export { getLineStatus, isPuzzleSolved, solve, generatePuzzle, findImpossibleLines, isLinePossible, analyzeNodes, findBestStartingNode, deriveAlgebraicHints } from './solver';
export type { NodeAnalysis, AlgebraicHint } from './solver';
export { magicTrianglePuzzle, linePuzzle, crossPuzzle, mShapePuzzle, puzzleTemplates } from './puzzles';
