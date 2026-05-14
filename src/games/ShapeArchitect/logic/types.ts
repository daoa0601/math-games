// ========================================
// Shape Architect - Type Definitions
// ========================================

import type { VoxelGrid } from './voxel-grid'

export type CellState = 0 | 1 | 2
// 0 = Empty
// 1 = Target (ghost shape)
// 2 = Filled (placed block)

export interface Position3D {
  x: number
  y: number
  z: number
}

/**
 * 3D rotation angles (Euler angles).
 * Each axis can be 0, 90, 180, or 270 degrees.
 * - x: Pitch (rotation around X-axis, tilting forward/back)
 * - y: Yaw (rotation around Y-axis, spinning left/right)
 * - z: Roll (rotation around Z-axis, 2D rotation on floor plane)
 */
export interface Rotation3D {
  x: number // 0, 90, 180, 270
  y: number // 0, 90, 180, 270
  z: number // 0, 90, 180, 270
}

/** Default rotation (no rotation applied) */
export const DEFAULT_ROTATION: Rotation3D = { x: 0, y: 0, z: 0 }

/** Rotation axis type for single-axis rotation operations */
export type RotationAxis = 'x' | 'y' | 'z'

/**
 * Puzzle difficulty levels.
 * - easy: 3-4 tetrominoes (12-16 cells)
 * - medium: 5-6 tetrominoes (20-24 cells)
 * - hard: 7-8 tetrominoes (28-32 cells)
 * - expert: 6-8 hexominoes (36-48 cells)
 * - master: 5-7 heptominoes (35-49 cells)
 */
export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert' | 'master'

export interface Piece {
  id: string
  name: string
  color: string
  layout: Position3D[] // Relative positions of cubes
}

export interface PlacedPiece {
  pieceId: string
  position: Position3D
  rotation: Rotation3D // 3D rotation (x, y, z axes)
  color: string // Store the piece color for display
}

export interface LevelConfig {
  id: string
  name: string
  type: '2D' | '3D'
  gridSize: [number, number, number] // [width, height, depth]
  targetVoxels: Position3D[]
  pieces: Piece[]
  difficulty: Difficulty
}

/** Interaction mode for the game */
export type InteractionMode = 'idle' | 'place' | 'move'

export interface GameState {
  level: LevelConfig
  grid: VoxelGrid
  placedPieces: PlacedPiece[]
  remainingPieces: Piece[]
  selectedPieceId: string | null
  rotation: Rotation3D // Current rotation for piece being placed
  isSolved: boolean
  /** Current interaction mode */
  interactionMode: InteractionMode
  /** ID of placed piece being moved (when in 'move' mode) */
  selectedPlacedPieceId: string | null
}

export interface ShapeArchitectGameState {
  grid: CellState[][][]
  placedPieces: PlacedPiece[]
  remainingPieces: Piece[]
  isSolved: boolean
  moveCount: number
  accepted: boolean
  error?: string
}
