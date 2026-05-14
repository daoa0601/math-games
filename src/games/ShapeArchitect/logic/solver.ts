// ========================================
// Shape Architect - Puzzle Solver
// Backtracking solver with early termination
// ========================================

import { Effect } from 'effect'

import { SolverTimeoutError } from '@/services/errors'

import type {
  LevelConfig,
  Piece,
  Position3D,
  Rotation3D,
} from './types'
import {
  initializeGrid,
  rotatePieceLayout3D,
  canPlacePiece,
  placePiece,
  checkSolved,
} from './engine'
import type { VoxelGrid } from './voxel-grid'

// ========================================
// Types
// ========================================

export interface SolutionStep {
  pieceId: string
  position: Position3D
  rotation: Rotation3D
}

export interface SolverResult {
  solvable: boolean
  solution?: SolutionStep[]
  searchedStates: number
  timeMs: number
  timedOut: boolean
}

// ========================================
// Rotation Generation
// ========================================

export function generate2DRotations(): Rotation3D[] {
  return [
    { x: 0, y: 0, z: 0 },
    { x: 0, y: 0, z: 90 },
    { x: 0, y: 0, z: 180 },
    { x: 0, y: 0, z: 270 },
  ]
}

export function generate3DRotations(): Rotation3D[] {
  return [
    { x: 0, y: 0, z: 0 },
    { x: 0, y: 90, z: 0 },
    { x: 0, y: 180, z: 0 },
    { x: 0, y: 270, z: 0 },
    { x: 180, y: 0, z: 0 },
    { x: 180, y: 90, z: 0 },
    { x: 180, y: 180, z: 0 },
    { x: 180, y: 270, z: 0 },
    { x: 0, y: 0, z: 90 },
    { x: 90, y: 0, z: 90 },
    { x: 180, y: 0, z: 90 },
    { x: 270, y: 0, z: 90 },
    { x: 0, y: 0, z: 270 },
    { x: 90, y: 0, z: 270 },
    { x: 180, y: 0, z: 270 },
    { x: 270, y: 0, z: 270 },
    { x: 270, y: 0, z: 0 },
    { x: 270, y: 0, z: 90 },
    { x: 270, y: 0, z: 180 },
    { x: 270, y: 0, z: 270 },
    { x: 90, y: 0, z: 0 },
    { x: 90, y: 0, z: 90 },
    { x: 90, y: 0, z: 180 },
    { x: 90, y: 0, z: 270 },
  ]
}

const ROTATIONS_2D = generate2DRotations()
const ROTATIONS_3D = generate3DRotations()

// ========================================
// Helper Functions
// ========================================

function findFirstUnfilledTarget(
  grid: VoxelGrid,
  targetVoxels: Position3D[],
): Position3D | null {
  for (const pos of targetVoxels) {
    if (grid.get(pos.x, pos.y, pos.z) === 1) {
      return pos
    }
  }
  return null
}

function getUniqueRotations(
  piece: Piece,
  rotations: Rotation3D[],
): Rotation3D[] {
  const seen = new Set<string>()
  const uniqueRotations: Rotation3D[] = []

  for (const rotation of rotations) {
    const rotated = rotatePieceLayout3D(piece.layout, rotation)
    const sorted = [...rotated].sort((a, b) =>
      a.x !== b.x ? a.x - b.x : a.y !== b.y ? a.y - b.y : a.z - b.z,
    )
    const key = sorted.map((p) => `${p.x},${p.y},${p.z}`).join('|')

    if (!seen.has(key)) {
      seen.add(key)
      uniqueRotations.push(rotation)
    }
  }

  return uniqueRotations
}

function findCandidatePositions(
  piece: Piece,
  rotation: Rotation3D,
  targetCell: Position3D,
): Position3D[] {
  const rotatedLayout = rotatePieceLayout3D(piece.layout, rotation)
  const candidates: Position3D[] = []

  for (const localPos of rotatedLayout) {
    const piecePosition: Position3D = {
      x: targetCell.x - localPos.x,
      y: targetCell.y - localPos.y,
      z: targetCell.z - localPos.z,
    }

    if (piecePosition.x >= 0 && piecePosition.y >= 0 && piecePosition.z >= 0) {
      candidates.push(piecePosition)
    }
  }

  return candidates
}

// ========================================
// Constraint Propagation
// ========================================

/**
 * Check if unfilled target cells form disconnected regions whose
 * volumes aren't achievable by any subset of remaining pieces.
 * Returns true if the state is provably unsolvable.
 */
function hasDisconnectedUnsolvableRegion(
  grid: VoxelGrid,
  targetVoxels: Position3D[],
  remainingPieces: Piece[],
  _gridSize: [number, number, number],
): boolean {
  // Collect unfilled target cells
  const unfilled: Position3D[] = []
  for (const pos of targetVoxels) {
    if (grid.get(pos.x, pos.y, pos.z) === 1) {
      unfilled.push(pos)
    }
  }

  if (unfilled.length === 0) return false

  // BFS to find connected components among unfilled targets
  const keyOf = (p: Position3D) => `${p.x},${p.y},${p.z}`
  const unfilledSet = new Set(unfilled.map(keyOf))
  const visited = new Set<string>()
  const regionSizes: number[] = []

  const directions: Position3D[] = [
    { x: 1, y: 0, z: 0 }, { x: -1, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 }, { x: 0, y: -1, z: 0 },
    { x: 0, y: 0, z: 1 }, { x: 0, y: 0, z: -1 },
  ]

  for (const start of unfilled) {
    const startKey = keyOf(start)
    if (visited.has(startKey)) continue

    let size = 0
    const queue: Position3D[] = [start]
    visited.add(startKey)

    while (queue.length > 0) {
      const curr = queue.pop()!
      size++

      for (const d of directions) {
        const next: Position3D = { x: curr.x + d.x, y: curr.y + d.y, z: curr.z + d.z }
        const nk = keyOf(next)
        if (!visited.has(nk) && unfilledSet.has(nk)) {
          visited.add(nk)
          queue.push(next)
        }
      }
    }

    regionSizes.push(size)
  }

  // If only one region, no disconnection issue
  if (regionSizes.length <= 1) return false

  // Check: can each region's volume be formed by summing some subset of
  // remaining piece sizes? Use the smallest region as a quick check.
  const pieceSizes = remainingPieces.map((p) => p.layout.length).sort((a, b) => a - b)
  const minPieceSize = pieceSizes.length > 0 ? pieceSizes[0] : 1

  for (const regionSize of regionSizes) {
    // A region smaller than the smallest remaining piece is unsolvable
    if (regionSize < minPieceSize) return true

    // A region whose volume isn't a valid subset sum is suspicious,
    // but subset-sum is expensive — just check the easy cases
    if (regionSize > 0 && pieceSizes.every((s) => s > regionSize)) return true
  }

  return false
}

// ========================================
// Main Solver
// ========================================

export function solvePuzzle(
  level: LevelConfig,
  maxTimeMs: number = 5000,
): SolverResult {
  const startTime = performance.now()
  let searchedStates = 0

  if (level.targetVoxels.length === 0) {
    return {
      solvable: true,
      solution: [],
      searchedStates: 0,
      timeMs: performance.now() - startTime,
      timedOut: false,
    }
  }

  const targetVolume = level.targetVoxels.length
  const pieceVolume = level.pieces.reduce((sum, p) => sum + p.layout.length, 0)

  if (pieceVolume !== targetVolume) {
    return {
      solvable: false,
      searchedStates: 0,
      timeMs: performance.now() - startTime,
      timedOut: false,
    }
  }

  const rotations = level.type === '3D' ? ROTATIONS_3D : ROTATIONS_2D

  const pieceRotations = new Map<string, Rotation3D[]>()
  for (const piece of level.pieces) {
    pieceRotations.set(piece.id, getUniqueRotations(piece, rotations))
  }

  const initialGrid = initializeGrid(level)

  function solve(
    grid: VoxelGrid,
    remainingPieces: Piece[],
    solution: SolutionStep[],
  ): SolutionStep[] | null {
    if (performance.now() - startTime > maxTimeMs) {
      return null
    }

    const unfilled = findFirstUnfilledTarget(grid, level.targetVoxels)

    if (unfilled === null) {
      if (checkSolved(grid, level.targetVoxels)) {
        return solution
      }
      return null
    }

    for (let i = 0; i < remainingPieces.length; i++) {
      const piece = remainingPieces[i]
      const uniqueRots = pieceRotations.get(piece.id)!

      for (const rotation of uniqueRots) {
        const candidates = findCandidatePositions(piece, rotation, unfilled)

        for (const position of candidates) {
          searchedStates++

          if (canPlacePiece(grid, piece, position, rotation, level.gridSize)) {
            const newGrid = placePiece(grid, piece, position, rotation)

            const newRemaining = [
              ...remainingPieces.slice(0, i),
              ...remainingPieces.slice(i + 1),
            ]

            // Constraint propagation: prune if disconnected unsolvable region
            if (
              newRemaining.length > 0 &&
              hasDisconnectedUnsolvableRegion(newGrid, level.targetVoxels, newRemaining, level.gridSize)
            ) {
              continue
            }

            const newSolution: SolutionStep[] = [
              ...solution,
              { pieceId: piece.id, position, rotation },
            ]

            const result = solve(newGrid, newRemaining, newSolution)

            if (result !== null) {
              return result
            }
          }

          if (performance.now() - startTime > maxTimeMs) {
            return null
          }
        }
      }
    }

    return null
  }

  const solution = solve(initialGrid, level.pieces, [])
  const timeMs = performance.now() - startTime

  const timedOut = timeMs >= maxTimeMs

  return {
    solvable: solution !== null,
    solution: solution ?? undefined,
    searchedStates,
    timeMs,
    timedOut,
  }
}

export function solvePuzzleEffect(
  level: LevelConfig,
  maxTimeMs: number = 5000,
) {
  return Effect.gen(function* () {
    const result = yield* Effect.sync(() => solvePuzzle(level, maxTimeMs))

    if (result.timedOut) {
      return yield* new SolverTimeoutError({
        searchedStates: result.searchedStates,
        timeMs: result.timeMs,
      })
    }

    return result
  })
}

export function isSolvable(
  level: LevelConfig,
  maxTimeMs: number = 5000,
): boolean {
  const result = solvePuzzle(level, maxTimeMs)
  return result.solvable
}
