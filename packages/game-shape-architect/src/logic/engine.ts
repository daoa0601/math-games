// ========================================
// Shape Architect - Voxel Engine
// ========================================

import type {
  Position3D,
  Piece,
  LevelConfig,
  GameState,
  PlacedPiece,
  Rotation3D,
  RotationAxis,
} from './types'
import { DEFAULT_ROTATION } from './types'
import { VoxelGrid } from './voxel-grid'

export function createGrid(size: [number, number, number]): VoxelGrid {
  return VoxelGrid.create(size)
}

export function initializeGrid(level: LevelConfig): VoxelGrid {
  return VoxelGrid.fromLevel(level.targetVoxels, level.gridSize)
}

export function isInBounds(
  pos: Position3D,
  size: [number, number, number],
): boolean {
  return (
    pos.x >= 0 &&
    pos.x < size[0] &&
    pos.y >= 0 &&
    pos.y < size[1] &&
    pos.z >= 0 &&
    pos.z < size[2]
  )
}

// ========================================
// 3D Rotation System
// ========================================

export function normalizeAngle(angle: number): number {
  return ((angle % 360) + 360) % 360
}

export function rotateBy90OnAxis(
  rotation: Rotation3D,
  axis: RotationAxis,
): Rotation3D {
  return {
    x: axis === 'x' ? normalizeAngle(rotation.x + 90) : rotation.x,
    y: axis === 'y' ? normalizeAngle(rotation.y + 90) : rotation.y,
    z: axis === 'z' ? normalizeAngle(rotation.z + 90) : rotation.z,
  }
}

function rotatePositionAroundX(pos: Position3D): Position3D {
  return { x: pos.x, y: -pos.z, z: pos.y }
}

function rotatePositionAroundY(pos: Position3D): Position3D {
  return { x: pos.z, y: pos.y, z: -pos.x }
}

function rotatePositionAroundZ(pos: Position3D): Position3D {
  return { x: -pos.y, y: pos.x, z: pos.z }
}

function normalizeLayout(layout: Position3D[]): Position3D[] {
  if (layout.length === 0) return layout

  const minX = Math.min(...layout.map((p) => p.x))
  const minY = Math.min(...layout.map((p) => p.y))
  const minZ = Math.min(...layout.map((p) => p.z))

  return layout.map((pos) => ({
    x: pos.x - minX,
    y: pos.y - minY,
    z: pos.z - minZ,
  }))
}

export function rotatePieceLayout3D(
  layout: Position3D[],
  rotation: Rotation3D,
): Position3D[] {
  let result = [...layout]

  const xTimes = (normalizeAngle(rotation.x) / 90) % 4
  for (let i = 0; i < xTimes; i++) {
    result = result.map(rotatePositionAroundX)
  }

  const yTimes = (normalizeAngle(rotation.y) / 90) % 4
  for (let i = 0; i < yTimes; i++) {
    result = result.map(rotatePositionAroundY)
  }

  const zTimes = (normalizeAngle(rotation.z) / 90) % 4
  for (let i = 0; i < zTimes; i++) {
    result = result.map(rotatePositionAroundZ)
  }

  return normalizeLayout(result)
}

export function rotatePieceLayout(
  layout: Position3D[],
  rotation: number,
): Position3D[] {
  const times = (rotation / 90) % 4
  let result = [...layout]

  for (let i = 0; i < times; i++) {
    result = result.map(rotatePositionAroundZ)
  }

  const minX = Math.min(...result.map((p) => p.x))
  const minY = Math.min(...result.map((p) => p.y))

  return result.map((pos) => ({
    x: pos.x - minX,
    y: pos.y - minY,
    z: pos.z,
  }))
}

export function getPieceWorldPositions(
  piece: Piece,
  position: Position3D,
  rotation: Rotation3D,
): Position3D[] {
  const rotatedLayout = rotatePieceLayout3D(piece.layout, rotation)
  return rotatedLayout.map((local) => ({
    x: position.x + local.x,
    y: position.y + local.y,
    z: position.z + local.z,
  }))
}

export function canPlacePiece(
  grid: VoxelGrid,
  piece: Piece,
  position: Position3D,
  rotation: Rotation3D,
  gridSize: [number, number, number],
): boolean {
  const worldPositions = getPieceWorldPositions(piece, position, rotation)
  let hasTargetCell = false

  for (const pos of worldPositions) {
    if (!isInBounds(pos, gridSize)) {
      return false
    }

    const cell = grid.get(pos.x, pos.y, pos.z)

    if (cell === 2) {
      return false
    }

    if (cell === 1) {
      hasTargetCell = true
    } else {
      return false
    }
  }

  return hasTargetCell
}

export function findNearestValidPosition(
  grid: VoxelGrid,
  piece: Piece,
  attemptedPosition: Position3D,
  rotation: Rotation3D,
  gridSize: [number, number, number],
  maxSearchRadius: number = 2,
): Position3D | null {
  if (canPlacePiece(grid, piece, attemptedPosition, rotation, gridSize)) {
    return attemptedPosition
  }

  for (let radius = 1; radius <= maxSearchRadius; radius++) {
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dz = -radius; dz <= radius; dz++) {
          if (Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dz)) !== radius) {
            continue
          }

          const candidatePos: Position3D = {
            x: attemptedPosition.x + dx,
            y: attemptedPosition.y + dy,
            z: attemptedPosition.z + dz,
          }

          if (canPlacePiece(grid, piece, candidatePos, rotation, gridSize)) {
            return candidatePos
          }
        }
      }
    }
  }

  return null
}

export function placePiece(
  grid: VoxelGrid,
  piece: Piece,
  position: Position3D,
  rotation: Rotation3D,
): VoxelGrid {
  const newGrid = grid.clone()
  const worldPositions = getPieceWorldPositions(piece, position, rotation)

  for (const pos of worldPositions) {
    newGrid.set(pos.x, pos.y, pos.z, 2)
  }

  return newGrid
}

export function removePieceFromGrid(
  grid: VoxelGrid,
  piece: Piece,
  placedPiece: PlacedPiece,
  targetVoxels?: Position3D[],
): VoxelGrid {
  const newGrid = grid.clone()

  const worldPositions = getPieceWorldPositions(
    piece,
    placedPiece.position,
    placedPiece.rotation,
  )

  const targetSet = targetVoxels
    ? new Set(targetVoxels.map((p) => `${p.x},${p.y},${p.z}`))
    : null

  for (const pos of worldPositions) {
    if (newGrid.inBounds(pos.x, pos.y, pos.z)) {
      const key = `${pos.x},${pos.y},${pos.z}`
      newGrid.set(pos.x, pos.y, pos.z, targetSet?.has(key) ? 1 : 0)
    }
  }

  return newGrid
}

export function checkSolved(
  grid: VoxelGrid,
  targetVoxels: Position3D[],
): boolean {
  return targetVoxels.every((pos) => grid.get(pos.x, pos.y, pos.z) === 2)
}

export function createGameState(level: LevelConfig): GameState {
  return {
    level,
    grid: initializeGrid(level),
    placedPieces: [],
    remainingPieces: [...level.pieces],
    selectedPieceId: null,
    rotation: { ...DEFAULT_ROTATION },
    isSolved: false,
    interactionMode: 'idle',
    selectedPlacedPieceId: null,
  }
}

export function tryPlacePiece(
  state: GameState,
  position: Position3D,
): GameState | null {
  if (!state.selectedPieceId) return null

  const piece = state.remainingPieces.find(
    (p) => p.id === state.selectedPieceId,
  )
  if (!piece) return null

  const finalPosition = findNearestValidPosition(
    state.grid,
    piece,
    position,
    state.rotation,
    state.level.gridSize,
    2,
  )

  if (!finalPosition) {
    return null
  }

  const newGrid = placePiece(state.grid, piece, finalPosition, state.rotation)
  const newRemaining = state.remainingPieces.filter((p) => p.id !== piece.id)
  const newPlaced: PlacedPiece = {
    pieceId: piece.id,
    position: finalPosition,
    rotation: { ...state.rotation },
    color: piece.color,
  }

  const isSolved = checkSolved(newGrid, state.level.targetVoxels)

  return {
    ...state,
    grid: newGrid,
    placedPieces: [...state.placedPieces, newPlaced],
    remainingPieces: newRemaining,
    selectedPieceId: null,
    rotation: { ...DEFAULT_ROTATION },
    isSolved,
  }
}

// ========================================
// Piece Movement (for placed pieces)
// ========================================

export function createGridWithoutPiece(
  grid: VoxelGrid,
  piece: Piece,
  placedPiece: PlacedPiece,
  targetVoxels: Position3D[],
): VoxelGrid {
  return removePieceFromGrid(grid, piece, placedPiece, targetVoxels)
}

export function canMovePlacedPiece(
  state: GameState,
  placedPieceId: string,
  newPosition: Position3D,
  newRotation: Rotation3D,
): boolean {
  const placedPieceIndex = state.placedPieces.findIndex(
    (pp) => pp.pieceId === placedPieceId,
  )
  if (placedPieceIndex === -1) return false

  const placedPiece = state.placedPieces[placedPieceIndex]

  const piece = state.level.pieces.find((p) => p.id === placedPieceId)
  if (!piece) return false

  const gridWithoutPiece = createGridWithoutPiece(
    state.grid,
    piece,
    placedPiece,
    state.level.targetVoxels,
  )

  return canPlacePiece(
    gridWithoutPiece,
    piece,
    newPosition,
    newRotation,
    state.level.gridSize,
  )
}

export function movePlacedPiece(
  state: GameState,
  placedPieceId: string,
  newPosition: Position3D,
  newRotation: Rotation3D,
): GameState | null {
  if (!canMovePlacedPiece(state, placedPieceId, newPosition, newRotation)) {
    return null
  }

  const placedPieceIndex = state.placedPieces.findIndex(
    (pp) => pp.pieceId === placedPieceId,
  )
  if (placedPieceIndex === -1) return null

  const placedPiece = state.placedPieces[placedPieceIndex]

  if (
    placedPiece.position.x === newPosition.x &&
    placedPiece.position.y === newPosition.y &&
    placedPiece.position.z === newPosition.z &&
    placedPiece.rotation.x === newRotation.x &&
    placedPiece.rotation.y === newRotation.y &&
    placedPiece.rotation.z === newRotation.z
  ) {
    return null
  }

  const piece = state.level.pieces.find((p) => p.id === placedPieceId)
  if (!piece) return null

  const gridWithoutPiece = createGridWithoutPiece(
    state.grid,
    piece,
    placedPiece,
    state.level.targetVoxels,
  )

  const newGrid = placePiece(gridWithoutPiece, piece, newPosition, newRotation)

  const newPlacedPieces = [...state.placedPieces]
  newPlacedPieces[placedPieceIndex] = {
    ...placedPiece,
    position: newPosition,
    rotation: newRotation,
  }

  const isSolved = checkSolved(newGrid, state.level.targetVoxels)

  return {
    ...state,
    grid: newGrid,
    placedPieces: newPlacedPieces,
    isSolved,
    interactionMode: 'idle',
    selectedPlacedPieceId: null,
  }
}

export function selectPlacedPieceForMove(
  state: GameState,
  placedPieceId: string,
): GameState | null {
  const exists = state.placedPieces.some((pp) => pp.pieceId === placedPieceId)
  if (!exists) return null

  return {
    ...state,
    interactionMode: 'move',
    selectedPlacedPieceId: placedPieceId,
    selectedPieceId: null,
  }
}

export function clearMovementSelection(state: GameState): GameState {
  return {
    ...state,
    interactionMode: 'idle',
    selectedPlacedPieceId: null,
  }
}

// ========================================
// Level Validation: Volume Conservation
// ========================================

export interface LevelValidation {
  isValid: boolean
  targetVolume: number
  pieceVolume: number
  volumeDifference: number
  message: string
}

export function calculatePieceVolume(pieces: Piece[]): number {
  return pieces.reduce((sum, piece) => sum + piece.layout.length, 0)
}

export function validateLevelVolume(level: LevelConfig): LevelValidation {
  const targetVolume = level.targetVoxels.length
  const pieceVolume = calculatePieceVolume(level.pieces)
  const volumeDifference = pieceVolume - targetVolume

  let message: string
  let isValid: boolean

  if (volumeDifference === 0) {
    isValid = true
    message = 'Volume matches - level may be solvable'
  } else if (volumeDifference > 0) {
    isValid = false
    message = `Pieces have ${volumeDifference} extra cells - cannot fit in target`
  } else {
    isValid = false
    message = `Target has ${Math.abs(volumeDifference)} unfillable cells - need more pieces`
  }

  return {
    isValid,
    targetVolume,
    pieceVolume,
    volumeDifference,
    message,
  }
}

export function validateAllLevels(
  levels: LevelConfig[],
): Map<string, LevelValidation> {
  const results = new Map<string, LevelValidation>()

  for (const level of levels) {
    results.set(level.id, validateLevelVolume(level))
  }

  return results
}
