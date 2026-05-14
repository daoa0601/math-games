import { describe, it, expect } from 'vitest'
import {
  createGrid,
  initializeGrid,
  isInBounds,
  normalizeAngle,
  rotateBy90OnAxis,
  rotatePieceLayout,
  rotatePieceLayout3D,
  findNearestValidPosition,
  getPieceWorldPositions,
  canPlacePiece,
  placePiece,
  removePieceFromGrid,
  checkSolved,
  createGameState,
  tryPlacePiece,
  canMovePlacedPiece,
  movePlacedPiece,
  selectPlacedPieceForMove,
  clearMovementSelection,
  calculatePieceVolume,
  validateLevelVolume,
  validateAllLevels,
} from '../engine'
import type {
  Position3D,
  Piece,
  LevelConfig,
  PlacedPiece,
  Rotation3D,
} from '../types'
import { DEFAULT_ROTATION } from '../types'

const rot = (z: number): Rotation3D => ({ x: 0, y: 0, z })

// ========================================
// Test Fixtures
// ========================================

const createTestPiece = (overrides: Partial<Piece> = {}): Piece => ({
  id: 'test-piece',
  name: 'Test Piece',
  color: '#ff0000',
  layout: [
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
  ],
  ...overrides,
})

const createLPiece = (): Piece => ({
  id: 'l-piece',
  name: 'L-Shape',
  color: '#00ff00',
  layout: [
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 },
  ],
})

const createTestLevel = (
  overrides: Partial<LevelConfig> = {},
): LevelConfig => ({
  id: 'test-level',
  name: 'Test Level',
  type: '2D',
  gridSize: [3, 3, 1],
  targetVoxels: [
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
  ],
  pieces: [createTestPiece()],
  difficulty: 'easy',
  ...overrides,
})

// ========================================
// createGrid Tests
// ========================================

describe('createGrid', () => {
  it('creates grid with correct dimensions', () => {
    const grid = createGrid([3, 4, 2])

    expect(grid.width).toBe(3)
    expect(grid.height).toBe(4)
    expect(grid.depth).toBe(2)
  })

  it('initializes all cells to 0 (empty)', () => {
    const grid = createGrid([2, 2, 2])

    for (let x = 0; x < 2; x++) {
      for (let y = 0; y < 2; y++) {
        for (let z = 0; z < 2; z++) {
          expect(grid.get(x, y, z)).toBe(0)
        }
      }
    }
  })

  it('handles 1x1x1 grid', () => {
    const grid = createGrid([1, 1, 1])

    expect(grid.width).toBe(1)
    expect(grid.height).toBe(1)
    expect(grid.depth).toBe(1)
    expect(grid.get(0, 0, 0)).toBe(0)
  })

  it('creates independent cells (no shared references)', () => {
    const grid = createGrid([2, 2, 2])

    grid.set(0, 0, 0, 1)

    expect(grid.get(1, 0, 0)).toBe(0)
    expect(grid.get(0, 1, 0)).toBe(0)
  })
})

// ========================================
// initializeGrid Tests
// ========================================

describe('initializeGrid', () => {
  it('sets target voxels to 1', () => {
    const level = createTestLevel()
    const grid = initializeGrid(level)

    expect(grid.get(0, 0, 0)).toBe(1)
    expect(grid.get(1, 0, 0)).toBe(1)
  })

  it('leaves non-target cells as 0', () => {
    const level = createTestLevel()
    const grid = initializeGrid(level)

    expect(grid.get(2, 0, 0)).toBe(0)
    expect(grid.get(0, 1, 0)).toBe(0)
  })

  it('ignores out-of-bounds target voxels', () => {
    const level = createTestLevel({
      targetVoxels: [
        { x: 0, y: 0, z: 0 },
        { x: 99, y: 0, z: 0 },
      ],
    })

    const grid = initializeGrid(level)

    expect(grid.get(0, 0, 0)).toBe(1)
  })
})

// ========================================
// isInBounds Tests
// ========================================

describe('isInBounds', () => {
  const size: [number, number, number] = [5, 4, 3]

  it('returns true for valid positions', () => {
    expect(isInBounds({ x: 0, y: 0, z: 0 }, size)).toBe(true)
    expect(isInBounds({ x: 4, y: 3, z: 2 }, size)).toBe(true)
    expect(isInBounds({ x: 2, y: 2, z: 1 }, size)).toBe(true)
  })

  it('returns false for negative coordinates', () => {
    expect(isInBounds({ x: -1, y: 0, z: 0 }, size)).toBe(false)
    expect(isInBounds({ x: 0, y: -1, z: 0 }, size)).toBe(false)
    expect(isInBounds({ x: 0, y: 0, z: -1 }, size)).toBe(false)
  })

  it('returns false for coordinates at or beyond size', () => {
    expect(isInBounds({ x: 5, y: 0, z: 0 }, size)).toBe(false)
    expect(isInBounds({ x: 0, y: 4, z: 0 }, size)).toBe(false)
    expect(isInBounds({ x: 0, y: 0, z: 3 }, size)).toBe(false)
  })
})

// ========================================
// rotatePieceLayout Tests
// ========================================

describe('rotatePieceLayout', () => {
  it('returns same layout for 0 degree rotation', () => {
    const layout: Position3D[] = [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
    ]

    const rotated = rotatePieceLayout(layout, 0)

    expect(rotated).toEqual([
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
    ])
  })

  it('rotates 90 degrees correctly', () => {
    const layout: Position3D[] = [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
    ]

    const rotated = rotatePieceLayout(layout, 90)

    expect(rotated).toContainEqual({ x: 0, y: 0, z: 0 })
    expect(rotated).toContainEqual({ x: 0, y: 1, z: 0 })
  })

  it('rotates 180 degrees correctly', () => {
    const layout: Position3D[] = [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 },
    ]

    const rotated = rotatePieceLayout(layout, 180)

    expect(rotated.length).toBe(3)
    expect(rotated.every((p) => p.y === 0 && p.z === 0)).toBe(true)
  })

  it('rotates 270 degrees correctly', () => {
    const layout: Position3D[] = [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
    ]

    const rotated = rotatePieceLayout(layout, 270)

    expect(rotated).toContainEqual({ x: 0, y: 0, z: 0 })
    expect(rotated).toContainEqual({ x: 0, y: 1, z: 0 })
  })

  it('rotates 360 degrees back to original', () => {
    const layout: Position3D[] = [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
    ]

    const rotated = rotatePieceLayout(layout, 360)

    expect(rotated).toEqual(layout)
  })

  it('preserves z coordinate', () => {
    const layout: Position3D[] = [
      { x: 0, y: 0, z: 2 },
      { x: 1, y: 0, z: 2 },
    ]

    const rotated = rotatePieceLayout(layout, 90)

    expect(rotated.every((p) => p.z === 2)).toBe(true)
  })

  it('normalizes to positive coordinates', () => {
    const layout: Position3D[] = [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
    ]

    const rotated = rotatePieceLayout(layout, 90)

    expect(rotated.every((p) => p.x >= 0 && p.y >= 0 && p.z >= 0)).toBe(true)
  })
})

// ========================================
// getPieceWorldPositions Tests
// ========================================

describe('getPieceWorldPositions', () => {
  it('applies position offset correctly', () => {
    const piece = createTestPiece()
    const position: Position3D = { x: 2, y: 3, z: 1 }

    const worldPositions = getPieceWorldPositions(piece, position, rot(0))

    expect(worldPositions).toContainEqual({ x: 2, y: 3, z: 1 })
    expect(worldPositions).toContainEqual({ x: 3, y: 3, z: 1 })
  })

  it('combines rotation and position', () => {
    const piece = createTestPiece()
    const position: Position3D = { x: 1, y: 1, z: 0 }

    const worldPositions = getPieceWorldPositions(piece, position, rot(90))

    expect(worldPositions.length).toBe(2)
    expect(worldPositions.every((p) => p.x >= 1 && p.y >= 1)).toBe(true)
  })

  it('returns correct count of positions', () => {
    const piece = createLPiece()
    const position: Position3D = { x: 0, y: 0, z: 0 }

    const worldPositions = getPieceWorldPositions(piece, position, rot(0))

    expect(worldPositions.length).toBe(3)
  })
})

// ========================================
// canPlacePiece Tests
// ========================================

describe('canPlacePiece', () => {
  it('returns true when placing on valid target cells', () => {
    const level = createTestLevel()
    const grid = initializeGrid(level)
    const piece = createTestPiece()

    const canPlace = canPlacePiece(
      grid,
      piece,
      { x: 0, y: 0, z: 0 },
      rot(0),
      level.gridSize,
    )

    expect(canPlace).toBe(true)
  })

  it('returns false when out of bounds', () => {
    const level = createTestLevel()
    const grid = initializeGrid(level)
    const piece = createTestPiece()

    const canPlace = canPlacePiece(
      grid,
      piece,
      { x: 2, y: 0, z: 0 },
      rot(0),
      level.gridSize,
    )

    expect(canPlace).toBe(false)
  })

  it('rejects placement when extending into empty cells', () => {
    const level = createTestLevel({
      targetVoxels: [{ x: 0, y: 0, z: 0 }],
    })
    const grid = initializeGrid(level)
    const piece = createTestPiece()

    const canPlace = canPlacePiece(
      grid,
      piece,
      { x: 0, y: 0, z: 0 },
      rot(0),
      level.gridSize,
    )

    expect(canPlace).toBe(false)
  })

  it('returns false when no voxels on target cells', () => {
    const level = createTestLevel({
      gridSize: [4, 3, 1],
      targetVoxels: [{ x: 0, y: 0, z: 0 }],
    })
    const grid = initializeGrid(level)
    const piece = createTestPiece()

    const canPlace = canPlacePiece(
      grid,
      piece,
      { x: 2, y: 0, z: 0 },
      rot(0),
      level.gridSize,
    )

    expect(canPlace).toBe(false)
  })

  it('returns false when placing on filled cells', () => {
    const level = createTestLevel()
    let grid = initializeGrid(level)
    const piece1 = createTestPiece({ id: 'piece1' })
    const piece2 = createTestPiece({ id: 'piece2' })

    grid = placePiece(grid, piece1, { x: 0, y: 0, z: 0 }, rot(0))

    const canPlace = canPlacePiece(
      grid,
      piece2,
      { x: 0, y: 0, z: 0 },
      rot(0),
      level.gridSize,
    )

    expect(canPlace).toBe(false)
  })

  it('respects rotation when checking placement', () => {
    const level = createTestLevel({
      gridSize: [3, 3, 1],
      targetVoxels: [
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
      ],
    })
    const grid = initializeGrid(level)
    const piece = createTestPiece()

    expect(
      canPlacePiece(grid, piece, { x: 0, y: 0, z: 0 }, rot(0), level.gridSize),
    ).toBe(false)

    expect(
      canPlacePiece(grid, piece, { x: 0, y: 0, z: 0 }, rot(90), level.gridSize),
    ).toBe(true)
  })

  it('requires at least one voxel on target for valid placement', () => {
    const level = createTestLevel({
      gridSize: [4, 4, 1],
      targetVoxels: [
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
      ],
    })
    const grid = initializeGrid(level)
    const piece = createTestPiece()

    expect(
      canPlacePiece(grid, piece, { x: 2, y: 0, z: 0 }, rot(0), level.gridSize),
    ).toBe(false)
  })
})

// ========================================
// placePiece Tests
// ========================================

describe('placePiece', () => {
  it('sets cells to filled (2)', () => {
    const level = createTestLevel()
    const grid = initializeGrid(level)
    const piece = createTestPiece()

    const newGrid = placePiece(grid, piece, { x: 0, y: 0, z: 0 }, rot(0))

    expect(newGrid.get(0, 0, 0)).toBe(2)
    expect(newGrid.get(1, 0, 0)).toBe(2)
  })

  it('returns new grid (immutable)', () => {
    const level = createTestLevel()
    const grid = initializeGrid(level)
    const piece = createTestPiece()

    const newGrid = placePiece(grid, piece, { x: 0, y: 0, z: 0 }, rot(0))

    expect(newGrid).not.toBe(grid)
    expect(grid.get(0, 0, 0)).toBe(1)
  })

  it('handles rotation correctly', () => {
    const level = createTestLevel({
      gridSize: [2, 2, 1],
      targetVoxels: [
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
      ],
    })
    const grid = initializeGrid(level)
    const piece = createTestPiece()

    const newGrid = placePiece(grid, piece, { x: 0, y: 0, z: 0 }, rot(90))

    expect(newGrid.get(0, 0, 0)).toBe(2)
    expect(newGrid.get(0, 1, 0)).toBe(2)
  })
})

// ========================================
// removePieceFromGrid Tests
// ========================================

describe('removePieceFromGrid', () => {
  it('reverts cells back to target (1) when targetVoxels provided', () => {
    const level = createTestLevel()
    let grid = initializeGrid(level)
    const piece = createTestPiece()

    grid = placePiece(grid, piece, { x: 0, y: 0, z: 0 }, rot(0))
    expect(grid.get(0, 0, 0)).toBe(2)

    const placedPiece: PlacedPiece = {
      pieceId: piece.id,
      position: { x: 0, y: 0, z: 0 },
      rotation: rot(0),
      color: piece.color,
    }
    const newGrid = removePieceFromGrid(
      grid,
      piece,
      placedPiece,
      level.targetVoxels,
    )

    expect(newGrid.get(0, 0, 0)).toBe(1)
    expect(newGrid.get(1, 0, 0)).toBe(1)
  })

  it('reverts to empty (0) when not in targetVoxels', () => {
    const level = createTestLevel({
      gridSize: [3, 3, 1],
      targetVoxels: [{ x: 0, y: 0, z: 0 }],
    })
    let grid = initializeGrid(level)
    const piece = createTestPiece()

    grid = placePiece(grid, piece, { x: 0, y: 0, z: 0 }, rot(0))

    const placedPiece: PlacedPiece = {
      pieceId: piece.id,
      position: { x: 0, y: 0, z: 0 },
      rotation: rot(0),
      color: piece.color,
    }
    const newGrid = removePieceFromGrid(
      grid,
      piece,
      placedPiece,
      level.targetVoxels,
    )

    expect(newGrid.get(0, 0, 0)).toBe(1)
    expect(newGrid.get(1, 0, 0)).toBe(0)
  })

  it('returns new grid (immutable)', () => {
    const level = createTestLevel()
    let grid = initializeGrid(level)
    const piece = createTestPiece()

    grid = placePiece(grid, piece, { x: 0, y: 0, z: 0 }, rot(0))

    const placedPiece: PlacedPiece = {
      pieceId: piece.id,
      position: { x: 0, y: 0, z: 0 },
      rotation: rot(0),
      color: piece.color,
    }
    const newGrid = removePieceFromGrid(
      grid,
      piece,
      placedPiece,
      level.targetVoxels,
    )

    expect(newGrid).not.toBe(grid)
    expect(grid.get(0, 0, 0)).toBe(2)
  })

  it('handles rotation correctly', () => {
    const level = createTestLevel({
      gridSize: [2, 2, 1],
      targetVoxels: [
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
      ],
    })
    let grid = initializeGrid(level)
    const piece = createTestPiece()

    grid = placePiece(grid, piece, { x: 0, y: 0, z: 0 }, rot(90))

    const placedPiece: PlacedPiece = {
      pieceId: piece.id,
      position: { x: 0, y: 0, z: 0 },
      rotation: rot(90),
      color: piece.color,
    }
    const newGrid = removePieceFromGrid(
      grid,
      piece,
      placedPiece,
      level.targetVoxels,
    )

    expect(newGrid.get(0, 0, 0)).toBe(1)
    expect(newGrid.get(0, 1, 0)).toBe(1)
  })
})

// ========================================
// checkSolved Tests
// ========================================

describe('checkSolved', () => {
  it('returns true when all target voxels are filled', () => {
    const level = createTestLevel()
    let grid = initializeGrid(level)
    const piece = createTestPiece()

    grid = placePiece(grid, piece, { x: 0, y: 0, z: 0 }, rot(0))

    expect(checkSolved(grid, level.targetVoxels)).toBe(true)
  })

  it('returns false when some target voxels remain unfilled', () => {
    const level = createTestLevel({
      targetVoxels: [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
        { x: 2, y: 0, z: 0 },
      ],
    })
    let grid = initializeGrid(level)
    const piece = createTestPiece()

    grid = placePiece(grid, piece, { x: 0, y: 0, z: 0 }, rot(0))

    expect(checkSolved(grid, level.targetVoxels)).toBe(false)
  })

  it('returns true for empty target list', () => {
    const grid = createGrid([2, 2, 2])

    expect(checkSolved(grid, [])).toBe(true)
  })

  it('correctly identifies partial completion', () => {
    const level = createTestLevel({
      gridSize: [4, 4, 1],
      targetVoxels: [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
        { x: 2, y: 0, z: 0 },
        { x: 3, y: 0, z: 0 },
      ],
    })
    let grid = initializeGrid(level)
    const piece = createTestPiece()

    grid = placePiece(grid, piece, { x: 0, y: 0, z: 0 }, rot(0))

    expect(checkSolved(grid, level.targetVoxels)).toBe(false)
  })
})

// ========================================
// createGameState Tests
// ========================================

describe('createGameState', () => {
  it('initializes with level config', () => {
    const level = createTestLevel()
    const state = createGameState(level)

    expect(state.level).toBe(level)
  })

  it('initializes grid with targets', () => {
    const level = createTestLevel()
    const state = createGameState(level)

    expect(state.grid.get(0, 0, 0)).toBe(1)
    expect(state.grid.get(1, 0, 0)).toBe(1)
  })

  it('starts with empty placedPieces', () => {
    const level = createTestLevel()
    const state = createGameState(level)

    expect(state.placedPieces).toEqual([])
  })

  it('copies pieces to remainingPieces', () => {
    const level = createTestLevel()
    const state = createGameState(level)

    expect(state.remainingPieces).toEqual(level.pieces)
    expect(state.remainingPieces).not.toBe(level.pieces)
  })

  it('initializes selection state correctly', () => {
    const level = createTestLevel()
    const state = createGameState(level)

    expect(state.selectedPieceId).toBeNull()
    expect(state.rotation).toEqual(DEFAULT_ROTATION)
    expect(state.isSolved).toBe(false)
  })
})

// ========================================
// tryPlacePiece Tests
// ========================================

describe('tryPlacePiece', () => {
  it('returns null when no piece selected', () => {
    const level = createTestLevel()
    const state = createGameState(level)

    const result = tryPlacePiece(state, { x: 0, y: 0, z: 0 })

    expect(result).toBeNull()
  })

  it('returns null when selected piece not found', () => {
    const level = createTestLevel()
    const state = createGameState(level)
    state.selectedPieceId = 'nonexistent'

    const result = tryPlacePiece(state, { x: 0, y: 0, z: 0 })

    expect(result).toBeNull()
  })

  it('returns null when placement invalid', () => {
    const level = createTestLevel()
    const state = createGameState(level)
    state.selectedPieceId = level.pieces[0].id

    const result = tryPlacePiece(state, { x: 99, y: 0, z: 0 })

    expect(result).toBeNull()
  })

  it('places piece and updates state on valid placement', () => {
    const level = createTestLevel()
    const state = createGameState(level)
    state.selectedPieceId = level.pieces[0].id

    const result = tryPlacePiece(state, { x: 0, y: 0, z: 0 })

    expect(result).not.toBeNull()
    expect(result!.grid.get(0, 0, 0)).toBe(2)
    expect(result!.placedPieces).toHaveLength(1)
    expect(result!.remainingPieces).toHaveLength(0)
    expect(result!.selectedPieceId).toBeNull()
    expect(result!.rotation).toEqual(DEFAULT_ROTATION)
  })

  it('sets isSolved when puzzle completed', () => {
    const level = createTestLevel()
    const state = createGameState(level)
    state.selectedPieceId = level.pieces[0].id

    const result = tryPlacePiece(state, { x: 0, y: 0, z: 0 })

    expect(result!.isSolved).toBe(true)
  })

  it('does not set isSolved when puzzle incomplete', () => {
    const level = createTestLevel({
      targetVoxels: [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
        { x: 2, y: 0, z: 0 },
      ],
      pieces: [createTestPiece()],
    })
    const state = createGameState(level)
    state.selectedPieceId = level.pieces[0].id

    const result = tryPlacePiece(state, { x: 0, y: 0, z: 0 })

    expect(result!.isSolved).toBe(false)
  })

  it('records correct placedPiece info', () => {
    const level = createTestLevel({
      gridSize: [3, 3, 1],
      targetVoxels: [
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
      ],
    })
    const state = createGameState(level)
    state.selectedPieceId = level.pieces[0].id
    state.rotation = rot(90)

    const result = tryPlacePiece(state, { x: 0, y: 0, z: 0 })

    expect(result).not.toBeNull()
    const placed = result!.placedPieces[0]
    expect(placed.pieceId).toBe(level.pieces[0].id)
    expect(placed.position).toEqual({ x: 0, y: 0, z: 0 })
    expect(placed.rotation).toEqual(rot(90))
    expect(placed.color).toBe(level.pieces[0].color)
  })
})

// ========================================
// calculatePieceVolume Tests
// ========================================

describe('calculatePieceVolume', () => {
  it('calculates volume for single piece', () => {
    const pieces = [createTestPiece()]

    expect(calculatePieceVolume(pieces)).toBe(2)
  })

  it('calculates total volume for multiple pieces', () => {
    const pieces = [createTestPiece(), createLPiece()]

    expect(calculatePieceVolume(pieces)).toBe(5)
  })

  it('returns 0 for empty array', () => {
    expect(calculatePieceVolume([])).toBe(0)
  })

  it('handles single-block pieces', () => {
    const piece: Piece = {
      id: 'single',
      name: 'Single',
      color: '#000',
      layout: [{ x: 0, y: 0, z: 0 }],
    }

    expect(calculatePieceVolume([piece])).toBe(1)
  })
})

// ========================================
// validateLevelVolume Tests
// ========================================

describe('validateLevelVolume', () => {
  it('returns valid when volumes match', () => {
    const level = createTestLevel()

    const result = validateLevelVolume(level)

    expect(result.isValid).toBe(true)
    expect(result.targetVolume).toBe(2)
    expect(result.pieceVolume).toBe(2)
    expect(result.volumeDifference).toBe(0)
  })

  it('returns invalid when pieces have extra volume', () => {
    const level = createTestLevel({
      targetVoxels: [{ x: 0, y: 0, z: 0 }],
      pieces: [createTestPiece()],
    })

    const result = validateLevelVolume(level)

    expect(result.isValid).toBe(false)
    expect(result.volumeDifference).toBe(1)
    expect(result.message).toContain('extra')
  })

  it('returns invalid when target has unfillable cells', () => {
    const level = createTestLevel({
      targetVoxels: [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
        { x: 2, y: 0, z: 0 },
      ],
      pieces: [createTestPiece()],
    })

    const result = validateLevelVolume(level)

    expect(result.isValid).toBe(false)
    expect(result.volumeDifference).toBe(-1)
    expect(result.message).toContain('unfillable')
  })
})

// ========================================
// validateAllLevels Tests
// ========================================

describe('validateAllLevels', () => {
  it('validates multiple levels', () => {
    const levels = [
      createTestLevel({ id: 'level1' }),
      createTestLevel({ id: 'level2' }),
    ]

    const results = validateAllLevels(levels)

    expect(results.size).toBe(2)
    expect(results.has('level1')).toBe(true)
    expect(results.has('level2')).toBe(true)
  })

  it('returns correct validation for each level', () => {
    const validLevel = createTestLevel({ id: 'valid' })
    const invalidLevel = createTestLevel({
      id: 'invalid',
      targetVoxels: [{ x: 0, y: 0, z: 0 }],
    })

    const results = validateAllLevels([validLevel, invalidLevel])

    expect(results.get('valid')!.isValid).toBe(true)
    expect(results.get('invalid')!.isValid).toBe(false)
  })

  it('returns empty map for empty input', () => {
    const results = validateAllLevels([])

    expect(results.size).toBe(0)
  })
})

// ========================================
// Piece Movement Tests
// ========================================

describe('selectPlacedPieceForMove', () => {
  function stateWithPlacedPiece() {
    const level = createTestLevel()
    const state = createGameState(level)
    state.selectedPieceId = level.pieces[0].id
    return tryPlacePiece(state, { x: 0, y: 0, z: 0 })!
  }

  it('selects an existing placed piece', () => {
    const state = stateWithPlacedPiece()
    const result = selectPlacedPieceForMove(state, 'test-piece')

    expect(result).not.toBeNull()
    expect(result!.interactionMode).toBe('move')
    expect(result!.selectedPlacedPieceId).toBe('test-piece')
    expect(result!.selectedPieceId).toBeNull()
  })

  it('returns null for non-existent piece', () => {
    const state = stateWithPlacedPiece()
    const result = selectPlacedPieceForMove(state, 'nonexistent')

    expect(result).toBeNull()
  })
})

describe('clearMovementSelection', () => {
  it('resets interaction mode and selection', () => {
    const level = createTestLevel()
    const state = createGameState(level)
    state.interactionMode = 'move'
    state.selectedPlacedPieceId = 'some-piece'

    const result = clearMovementSelection(state)

    expect(result.interactionMode).toBe('idle')
    expect(result.selectedPlacedPieceId).toBeNull()
  })
})

describe('canMovePlacedPiece', () => {
  function stateWithTwoPieces() {
    const piece1 = createTestPiece({ id: 'p1', color: '#f00' })
    const piece2 = createTestPiece({ id: 'p2', color: '#0f0' })
    const level = createTestLevel({
      gridSize: [4, 3, 1],
      targetVoxels: [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
        { x: 2, y: 0, z: 0 },
        { x: 3, y: 0, z: 0 },
      ],
      pieces: [piece1, piece2],
    })
    let state = createGameState(level)
    state.selectedPieceId = 'p1'
    state = tryPlacePiece(state, { x: 0, y: 0, z: 0 })!
    state.selectedPieceId = 'p2'
    state = tryPlacePiece(state, { x: 2, y: 0, z: 0 })!
    return state
  }

  it('allows moving to a valid unoccupied position', () => {
    const piece = createTestPiece()
    const level = createTestLevel({
      gridSize: [4, 3, 1],
      targetVoxels: [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
        { x: 2, y: 0, z: 0 },
        { x: 3, y: 0, z: 0 },
      ],
      pieces: [piece],
    })
    let state = createGameState(level)
    state.selectedPieceId = piece.id
    state = tryPlacePiece(state, { x: 0, y: 0, z: 0 })!

    expect(
      canMovePlacedPiece(
        state,
        piece.id,
        { x: 2, y: 0, z: 0 },
        DEFAULT_ROTATION,
      ),
    ).toBe(true)
  })

  it('rejects move to position occupied by another piece', () => {
    const state = stateWithTwoPieces()
    expect(
      canMovePlacedPiece(state, 'p1', { x: 2, y: 0, z: 0 }, DEFAULT_ROTATION),
    ).toBe(false)
  })

  it('rejects move for non-existent piece id', () => {
    const state = stateWithTwoPieces()
    expect(
      canMovePlacedPiece(state, 'nope', { x: 0, y: 0, z: 0 }, DEFAULT_ROTATION),
    ).toBe(false)
  })

  it('rejects move out of bounds', () => {
    const state = stateWithTwoPieces()
    expect(
      canMovePlacedPiece(state, 'p1', { x: 99, y: 0, z: 0 }, DEFAULT_ROTATION),
    ).toBe(false)
  })
})

describe('movePlacedPiece', () => {
  function stateWithPiece() {
    const piece = createTestPiece()
    const level = createTestLevel({
      gridSize: [4, 3, 1],
      targetVoxels: [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
        { x: 2, y: 0, z: 0 },
        { x: 3, y: 0, z: 0 },
      ],
      pieces: [piece],
    })
    const state = createGameState(level)
    state.selectedPieceId = piece.id
    return tryPlacePiece(state, { x: 0, y: 0, z: 0 })!
  }

  it('moves piece to a new valid position', () => {
    const state = stateWithPiece()
    const result = movePlacedPiece(
      state,
      'test-piece',
      { x: 2, y: 0, z: 0 },
      DEFAULT_ROTATION,
    )

    expect(result).not.toBeNull()
    expect(result!.grid.get(0, 0, 0)).toBe(1) // old position restored to target
    expect(result!.grid.get(2, 0, 0)).toBe(2) // new position filled
    expect(result!.grid.get(3, 0, 0)).toBe(2)
    expect(result!.placedPieces[0].position).toEqual({ x: 2, y: 0, z: 0 })
    expect(result!.interactionMode).toBe('idle')
    expect(result!.selectedPlacedPieceId).toBeNull()
  })

  it('returns null when moving to same position and rotation', () => {
    const state = stateWithPiece()
    const result = movePlacedPiece(
      state,
      'test-piece',
      { x: 0, y: 0, z: 0 },
      DEFAULT_ROTATION,
    )

    expect(result).toBeNull()
  })

  it('returns null for invalid target position', () => {
    const state = stateWithPiece()
    const result = movePlacedPiece(
      state,
      'test-piece',
      { x: 99, y: 0, z: 0 },
      DEFAULT_ROTATION,
    )

    expect(result).toBeNull()
  })

  it('returns null for non-existent piece', () => {
    const state = stateWithPiece()
    const result = movePlacedPiece(
      state,
      'nonexistent',
      { x: 2, y: 0, z: 0 },
      DEFAULT_ROTATION,
    )

    expect(result).toBeNull()
  })

  it('checks solved state after move', () => {
    const piece = createTestPiece()
    const level = createTestLevel({
      gridSize: [3, 1, 1],
      targetVoxels: [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
      ],
      pieces: [piece],
    })
    let state = createGameState(level)
    state.selectedPieceId = piece.id
    state = tryPlacePiece(state, { x: 0, y: 0, z: 0 })!

    expect(state.isSolved).toBe(true)
  })
})

// ========================================
// 3D Rotation Tests
// ========================================

describe('normalizeAngle', () => {
  it('normalizes positive angles', () => {
    expect(normalizeAngle(0)).toBe(0)
    expect(normalizeAngle(90)).toBe(90)
    expect(normalizeAngle(360)).toBe(0)
    expect(normalizeAngle(450)).toBe(90)
  })

  it('normalizes negative angles', () => {
    expect(normalizeAngle(-90)).toBe(270)
    expect(normalizeAngle(-180)).toBe(180)
    expect(normalizeAngle(-360)).toBe(0)
  })
})

describe('rotateBy90OnAxis', () => {
  it('rotates on z-axis only', () => {
    const result = rotateBy90OnAxis(DEFAULT_ROTATION, 'z')
    expect(result).toEqual({ x: 0, y: 0, z: 90 })
  })

  it('rotates on x-axis only', () => {
    const result = rotateBy90OnAxis(DEFAULT_ROTATION, 'x')
    expect(result).toEqual({ x: 90, y: 0, z: 0 })
  })

  it('rotates on y-axis only', () => {
    const result = rotateBy90OnAxis(DEFAULT_ROTATION, 'y')
    expect(result).toEqual({ x: 0, y: 90, z: 0 })
  })

  it('accumulates rotations', () => {
    let r = DEFAULT_ROTATION
    r = rotateBy90OnAxis(r, 'z')
    r = rotateBy90OnAxis(r, 'z')
    expect(r).toEqual({ x: 0, y: 0, z: 180 })
  })

  it('wraps around after 4 rotations', () => {
    let r = DEFAULT_ROTATION
    for (let i = 0; i < 4; i++) r = rotateBy90OnAxis(r, 'x')
    expect(r).toEqual(DEFAULT_ROTATION)
  })
})

describe('rotatePieceLayout3D', () => {
  const iBlock: Position3D[] = [
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
    { x: 2, y: 0, z: 0 },
  ]

  it('no rotation returns normalized layout', () => {
    const result = rotatePieceLayout3D(iBlock, DEFAULT_ROTATION)
    expect(result).toEqual(iBlock)
  })

  it('preserves piece volume through rotation', () => {
    const rotations: Rotation3D[] = [
      { x: 90, y: 0, z: 0 },
      { x: 0, y: 90, z: 0 },
      { x: 0, y: 0, z: 90 },
      { x: 90, y: 90, z: 0 },
      { x: 90, y: 0, z: 90 },
    ]

    for (const rotation of rotations) {
      const result = rotatePieceLayout3D(iBlock, rotation)
      expect(result.length).toBe(iBlock.length)
    }
  })

  it('4 rotations on same axis return to original', () => {
    const result = rotatePieceLayout3D(iBlock, { x: 0, y: 0, z: 360 })
    expect(result).toEqual(iBlock)
  })

  it('z-axis rotation changes x/y but not z', () => {
    const result = rotatePieceLayout3D(iBlock, { x: 0, y: 0, z: 90 })
    expect(result.every((p) => p.z === 0)).toBe(true)
    // After 90° z-rotation, horizontal I-block becomes vertical
    expect(result.some((p) => p.y > 0)).toBe(true)
  })

  it('x-axis rotation changes y/z but not x for single-column piece', () => {
    const column: Position3D[] = [
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 0, y: 2, z: 0 },
    ]
    const result = rotatePieceLayout3D(column, { x: 90, y: 0, z: 0 })
    expect(result.every((p) => p.x === 0)).toBe(true)
    expect(result.some((p) => p.z > 0)).toBe(true)
  })
})

// ========================================
// findNearestValidPosition Tests
// ========================================

describe('findNearestValidPosition', () => {
  it('returns the position itself if valid', () => {
    const level = createTestLevel({ gridSize: [4, 3, 1] })
    const grid = initializeGrid(level)
    const piece = level.pieces[0]

    const pos = findNearestValidPosition(
      grid,
      piece,
      { x: 0, y: 0, z: 0 },
      DEFAULT_ROTATION,
      level.gridSize,
    )

    expect(pos).toEqual({ x: 0, y: 0, z: 0 })
  })

  it('finds nearby valid position when exact position is invalid', () => {
    const level = createTestLevel({
      gridSize: [4, 4, 1],
      targetVoxels: [
        { x: 2, y: 0, z: 0 },
        { x: 3, y: 0, z: 0 },
      ],
    })
    const grid = initializeGrid(level)
    const piece = level.pieces[0]

    // Attempt at (0,0) is invalid (no target cells), but (2,0) should work
    const pos = findNearestValidPosition(
      grid,
      piece,
      { x: 0, y: 0, z: 0 },
      DEFAULT_ROTATION,
      level.gridSize,
    )

    expect(pos).not.toBeNull()
    expect(pos!.x).toBeGreaterThanOrEqual(1)
  })

  it('returns null when no valid position within search radius', () => {
    const level = createTestLevel({
      gridSize: [10, 10, 1],
      targetVoxels: [
        { x: 8, y: 8, z: 0 },
        { x: 9, y: 8, z: 0 },
      ],
    })
    const grid = initializeGrid(level)
    const piece = level.pieces[0]

    const pos = findNearestValidPosition(
      grid,
      piece,
      { x: 0, y: 0, z: 0 },
      DEFAULT_ROTATION,
      level.gridSize,
      2,
    )

    expect(pos).toBeNull()
  })
})
