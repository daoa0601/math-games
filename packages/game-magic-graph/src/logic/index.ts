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
} from "./types";

// Re-export functions
export { getLineStatus, isPuzzleSolved, solve } from "./solver";
export {
  magicTrianglePuzzle,
  linePuzzle,
  crossPuzzle,
  puzzleTemplates,
} from "./puzzles";
