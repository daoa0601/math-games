import {
  initializeGrid,
  placePiece,
  VoxelGrid,
} from '@math-games/game-shape-architect'
import type {
  CellState,
  LevelConfig,
  Piece,
  PlacedPiece,
  ShapeArchitectGameState,
  SolutionStep,
} from '@math-games/game-shape-architect'

export function buildSolvedGrid(config: LevelConfig, solution: SolutionStep[]) {
  return solution.reduce((grid, step) => {
    const piece = config.pieces.find((c) => c.id === step.pieceId)
    return piece ? placePiece(grid, piece, step.position, step.rotation) : grid
  }, initializeGrid(config))
}

export function buildPlacedPieces(
  config: LevelConfig,
  solution: SolutionStep[],
): PlacedPiece[] {
  return solution.flatMap((step) => {
    const piece = config.pieces.find((c) => c.id === step.pieceId)
    if (!piece) return []
    return {
      pieceId: step.pieceId,
      position: step.position,
      rotation: step.rotation,
      color: piece.color,
    }
  })
}

export function pieceIsPlaced(placedPieces: PlacedPiece[], piece: Piece) {
  return placedPieces.some((p) => p.pieceId === piece.id)
}

export function createInitialServerState(
  config: LevelConfig,
): ShapeArchitectGameState {
  return {
    grid: initializeGrid(config).toNestedArray(),
    placedPieces: [],
    remainingPieces: [...config.pieces],
    isSolved: false,
    moveCount: 0,
    accepted: true,
  }
}

export function gridFromState(gridState: CellState[][][]): VoxelGrid {
  return VoxelGrid.fromNestedArray(gridState)
}

export function buildOptimisticGrid(
  config: LevelConfig,
  placements: PlacedPiece[],
): VoxelGrid {
  return placements.reduce((grid, placement) => {
    const piece = config.pieces.find((c) => c.id === placement.pieceId)
    return piece
      ? placePiece(grid, piece, placement.position, placement.rotation)
      : grid
  }, initializeGrid(config))
}
