// ========================================
// Shape Architect Logic - Barrel Export
// ========================================

// VoxelGrid
export { VoxelGrid } from './voxel-grid'

// Types
export type {
  CellState,
  Position3D,
  Rotation3D,
  RotationAxis,
  Difficulty,
  Piece,
  PlacedPiece,
  LevelConfig,
  GameState,
  ShapeArchitectGameState,
} from './types'

export { DEFAULT_ROTATION } from './types'

// Engine functions
export {
  createGrid,
  initializeGrid,
  isInBounds,
  normalizeAngle,
  rotateBy90OnAxis,
  rotatePieceLayout,
  rotatePieceLayout3D,
  getPieceWorldPositions,
  canPlacePiece,
  findNearestValidPosition,
  placePiece,
  removePieceFromGrid,
  checkSolved,
  createGameState,
  tryPlacePiece,
  calculatePieceVolume,
  validateLevelVolume,
  validateAllLevels,
  type LevelValidation,
} from './engine'

// Presets
export {
  presetLevels,
  generateRandomLevel,
  runLevelValidation,
} from './presets'
export {
  TETRACUBE,
  PENTACUBE,
  TETRACUBE_KEYS,
  PENTACUBE_KEYS,
} from './polycubes'

// Seeded Generator
export {
  getDailyShapeArchitectLevel,
  previewDailyLevel,
  generateCohesivePuzzle,
  generateGuaranteedSolvableWithRetry,
} from './seededGenerator'

export { generateConstructivePuzzle } from './puzzleEngine'

// Solver
export {
  solvePuzzle,
  solvePuzzleEffect,
  isSolvable,
  generate2DRotations,
  generate3DRotations,
  type SolverResult,
  type SolutionStep,
} from './solver'

// DLX Solver
export { solvePuzzleDLX } from './dlx-solver'

// Bitboard
export { VoxelBitboard } from './voxel-bitboard'
