// ========================================
// Shape Architect Logic - Barrel Export
// ========================================

// Types
export type {
    CellState,
    Position3D,
    Rotation3D,
    RotationAxis,
    Piece,
    PlacedPiece,
    LevelConfig,
    GameState,
} from './types';

export { DEFAULT_ROTATION } from './types';

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
} from './engine';

// Presets
export {
    presetLevels,
    generateRandomLevel,
    runLevelValidation,
} from './presets';

// Seeded Generator
export {
    getDailyShapeArchitectLevel,
    previewDailyLevel,
    generateCohesivePuzzle,
    generateGuaranteedSolvableWithRetry,
} from './seededGenerator';

// Solver
export {
    solvePuzzle,
    isSolvable,
    generate2DRotations,
    generate3DRotations,
    type SolverResult,
    type SolutionStep,
} from './solver';
