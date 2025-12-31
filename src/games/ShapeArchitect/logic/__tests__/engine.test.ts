import { describe, it, expect } from 'vitest';
import {
    createGrid,
    initializeGrid,
    isInBounds,
    rotatePieceLayout,
    getPieceWorldPositions,
    canPlacePiece,
    placePiece,
    removePieceFromGrid,
    checkSolved,
    createGameState,
    tryPlacePiece,
    calculatePieceVolume,
    validateLevelVolume,
    validateAllLevels,
} from '../engine';
import type { Position3D, Piece, LevelConfig, PlacedPiece } from '../types';

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
});

const createLPiece = (): Piece => ({
    id: 'l-piece',
    name: 'L-Shape',
    color: '#00ff00',
    layout: [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
        { x: 0, y: 1, z: 0 },
    ],
});

const createTestLevel = (overrides: Partial<LevelConfig> = {}): LevelConfig => ({
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
});

// ========================================
// createGrid Tests
// ========================================

describe('createGrid', () => {
    it('creates grid with correct dimensions', () => {
        const grid = createGrid([3, 4, 2]);

        expect(grid.length).toBe(3);
        expect(grid[0].length).toBe(4);
        expect(grid[0][0].length).toBe(2);
    });

    it('initializes all cells to 0 (empty)', () => {
        const grid = createGrid([2, 2, 2]);

        for (let x = 0; x < 2; x++) {
            for (let y = 0; y < 2; y++) {
                for (let z = 0; z < 2; z++) {
                    expect(grid[x][y][z]).toBe(0);
                }
            }
        }
    });

    it('handles 1x1x1 grid', () => {
        const grid = createGrid([1, 1, 1]);

        expect(grid).toHaveLength(1);
        expect(grid[0]).toHaveLength(1);
        expect(grid[0][0]).toHaveLength(1);
        expect(grid[0][0][0]).toBe(0);
    });

    it('creates independent rows (no shared references)', () => {
        const grid = createGrid([2, 2, 2]);

        grid[0][0][0] = 1;

        expect(grid[1][0][0]).toBe(0); // Should not affect other cells
        expect(grid[0][1][0]).toBe(0);
    });
});

// ========================================
// initializeGrid Tests
// ========================================

describe('initializeGrid', () => {
    it('sets target voxels to 1', () => {
        const level = createTestLevel();
        const grid = initializeGrid(level);

        expect(grid[0][0][0]).toBe(1);
        expect(grid[1][0][0]).toBe(1);
    });

    it('leaves non-target cells as 0', () => {
        const level = createTestLevel();
        const grid = initializeGrid(level);

        expect(grid[2][0][0]).toBe(0);
        expect(grid[0][1][0]).toBe(0);
    });

    it('ignores out-of-bounds target voxels', () => {
        const level = createTestLevel({
            targetVoxels: [
                { x: 0, y: 0, z: 0 },
                { x: 99, y: 0, z: 0 }, // Out of bounds
            ],
        });

        // Should not throw
        const grid = initializeGrid(level);

        expect(grid[0][0][0]).toBe(1);
    });
});

// ========================================
// isInBounds Tests
// ========================================

describe('isInBounds', () => {
    const size: [number, number, number] = [5, 4, 3];

    it('returns true for valid positions', () => {
        expect(isInBounds({ x: 0, y: 0, z: 0 }, size)).toBe(true);
        expect(isInBounds({ x: 4, y: 3, z: 2 }, size)).toBe(true);
        expect(isInBounds({ x: 2, y: 2, z: 1 }, size)).toBe(true);
    });

    it('returns false for negative coordinates', () => {
        expect(isInBounds({ x: -1, y: 0, z: 0 }, size)).toBe(false);
        expect(isInBounds({ x: 0, y: -1, z: 0 }, size)).toBe(false);
        expect(isInBounds({ x: 0, y: 0, z: -1 }, size)).toBe(false);
    });

    it('returns false for coordinates at or beyond size', () => {
        expect(isInBounds({ x: 5, y: 0, z: 0 }, size)).toBe(false);
        expect(isInBounds({ x: 0, y: 4, z: 0 }, size)).toBe(false);
        expect(isInBounds({ x: 0, y: 0, z: 3 }, size)).toBe(false);
    });
});

// ========================================
// rotatePieceLayout Tests
// ========================================

describe('rotatePieceLayout', () => {
    it('returns same layout for 0 degree rotation', () => {
        const layout: Position3D[] = [
            { x: 0, y: 0, z: 0 },
            { x: 1, y: 0, z: 0 },
        ];

        const rotated = rotatePieceLayout(layout, 0);

        expect(rotated).toEqual([
            { x: 0, y: 0, z: 0 },
            { x: 1, y: 0, z: 0 },
        ]);
    });

    it('rotates 90 degrees correctly', () => {
        // Horizontal line becomes vertical
        const layout: Position3D[] = [
            { x: 0, y: 0, z: 0 },
            { x: 1, y: 0, z: 0 },
        ];

        const rotated = rotatePieceLayout(layout, 90);

        // After rotation and normalization:
        // (0,0) -> (0,0) -> normalized stays at (0,0)
        // (1,0) -> (0,1) -> normalized stays at (0,1)
        expect(rotated).toContainEqual({ x: 0, y: 0, z: 0 });
        expect(rotated).toContainEqual({ x: 0, y: 1, z: 0 });
    });

    it('rotates 180 degrees correctly', () => {
        const layout: Position3D[] = [
            { x: 0, y: 0, z: 0 },
            { x: 1, y: 0, z: 0 },
            { x: 2, y: 0, z: 0 },
        ];

        const rotated = rotatePieceLayout(layout, 180);

        // 180 rotation of horizontal line is still horizontal (after normalization)
        expect(rotated.length).toBe(3);
        // All should be at same y and z
        expect(rotated.every(p => p.y === 0 && p.z === 0)).toBe(true);
    });

    it('rotates 270 degrees correctly', () => {
        const layout: Position3D[] = [
            { x: 0, y: 0, z: 0 },
            { x: 1, y: 0, z: 0 },
        ];

        const rotated = rotatePieceLayout(layout, 270);

        // Should be vertical after 270
        expect(rotated).toContainEqual({ x: 0, y: 0, z: 0 });
        expect(rotated).toContainEqual({ x: 0, y: 1, z: 0 });
    });

    it('rotates 360 degrees back to original', () => {
        const layout: Position3D[] = [
            { x: 0, y: 0, z: 0 },
            { x: 1, y: 0, z: 0 },
            { x: 0, y: 1, z: 0 },
        ];

        const rotated = rotatePieceLayout(layout, 360);

        expect(rotated).toEqual(layout);
    });

    it('preserves z coordinate', () => {
        const layout: Position3D[] = [
            { x: 0, y: 0, z: 2 },
            { x: 1, y: 0, z: 2 },
        ];

        const rotated = rotatePieceLayout(layout, 90);

        expect(rotated.every(p => p.z === 2)).toBe(true);
    });

    it('normalizes to positive coordinates', () => {
        // L-shape piece rotation
        const layout: Position3D[] = [
            { x: 0, y: 0, z: 0 },
            { x: 1, y: 0, z: 0 },
            { x: 0, y: 1, z: 0 },
        ];

        const rotated = rotatePieceLayout(layout, 90);

        // All coordinates should be non-negative
        expect(rotated.every(p => p.x >= 0 && p.y >= 0 && p.z >= 0)).toBe(true);
    });
});

// ========================================
// getPieceWorldPositions Tests
// ========================================

describe('getPieceWorldPositions', () => {
    it('applies position offset correctly', () => {
        const piece = createTestPiece();
        const position: Position3D = { x: 2, y: 3, z: 1 };

        const worldPositions = getPieceWorldPositions(piece, position, 0);

        expect(worldPositions).toContainEqual({ x: 2, y: 3, z: 1 });
        expect(worldPositions).toContainEqual({ x: 3, y: 3, z: 1 });
    });

    it('combines rotation and position', () => {
        const piece = createTestPiece();
        const position: Position3D = { x: 1, y: 1, z: 0 };

        const worldPositions = getPieceWorldPositions(piece, position, 90);

        // After 90 rotation: horizontal becomes vertical
        expect(worldPositions.length).toBe(2);
        // Both should be offset by position
        expect(worldPositions.every(p => p.x >= 1 && p.y >= 1)).toBe(true);
    });

    it('returns correct count of positions', () => {
        const piece = createLPiece();
        const position: Position3D = { x: 0, y: 0, z: 0 };

        const worldPositions = getPieceWorldPositions(piece, position, 0);

        expect(worldPositions.length).toBe(3);
    });
});

// ========================================
// canPlacePiece Tests
// ========================================

describe('canPlacePiece', () => {
    it('returns true when placing on valid target cells', () => {
        const level = createTestLevel();
        const grid = initializeGrid(level);
        const piece = createTestPiece();

        const canPlace = canPlacePiece(grid, piece, { x: 0, y: 0, z: 0 }, 0, level.gridSize);

        expect(canPlace).toBe(true);
    });

    it('returns false when out of bounds', () => {
        const level = createTestLevel();
        const grid = initializeGrid(level);
        const piece = createTestPiece();

        // Placing at edge would put second block out of bounds
        const canPlace = canPlacePiece(grid, piece, { x: 2, y: 0, z: 0 }, 0, level.gridSize);

        expect(canPlace).toBe(false);
    });

    it('allows placement when extending into empty cells (flexible placement)', () => {
        const level = createTestLevel({
            targetVoxels: [{ x: 0, y: 0, z: 0 }], // Only one target
        });
        const grid = initializeGrid(level);
        const piece = createTestPiece(); // Two-block piece

        // Second block extends into empty cell - allowed with flexible placement
        const canPlace = canPlacePiece(grid, piece, { x: 0, y: 0, z: 0 }, 0, level.gridSize);

        expect(canPlace).toBe(true); // At least one voxel on target
    });

    it('returns false when no voxels on target cells', () => {
        const level = createTestLevel({
            gridSize: [4, 3, 1],
            targetVoxels: [{ x: 0, y: 0, z: 0 }], // Target at origin
        });
        const grid = initializeGrid(level);
        const piece = createTestPiece(); // Two-block piece at [0,0], [1,0]

        // Placing at x=2 means both blocks are on empty cells
        const canPlace = canPlacePiece(grid, piece, { x: 2, y: 0, z: 0 }, 0, level.gridSize);

        expect(canPlace).toBe(false); // No voxels on target
    });

    it('returns false when placing on filled cells', () => {
        const level = createTestLevel();
        let grid = initializeGrid(level);
        const piece1 = createTestPiece({ id: 'piece1' });
        const piece2 = createTestPiece({ id: 'piece2' });

        // Place first piece
        grid = placePiece(grid, piece1, { x: 0, y: 0, z: 0 }, 0);

        // Try to place second piece on same position
        const canPlace = canPlacePiece(grid, piece2, { x: 0, y: 0, z: 0 }, 0, level.gridSize);

        expect(canPlace).toBe(false);
    });

    it('respects rotation when checking placement', () => {
        const level = createTestLevel({
            gridSize: [3, 3, 1],
            targetVoxels: [
                { x: 0, y: 0, z: 0 },
                { x: 0, y: 1, z: 0 }, // Vertical target
            ],
        });
        const grid = initializeGrid(level);
        const piece = createTestPiece(); // Horizontal piece

        // Horizontal piece extends into empty cell - allowed with flexible placement
        // (at least one voxel on target)
        expect(canPlacePiece(grid, piece, { x: 0, y: 0, z: 0 }, 0, level.gridSize)).toBe(true);

        // Vertical rotation fits perfectly on both targets
        expect(canPlacePiece(grid, piece, { x: 0, y: 0, z: 0 }, 90, level.gridSize)).toBe(true);
    });

    it('requires at least one voxel on target for valid placement', () => {
        const level = createTestLevel({
            gridSize: [4, 4, 1],
            targetVoxels: [
                { x: 0, y: 0, z: 0 },
                { x: 0, y: 1, z: 0 },
            ],
        });
        const grid = initializeGrid(level);
        const piece = createTestPiece(); // Horizontal piece at [0,0], [1,0]

        // Placing at x=2 means no voxels touch target
        expect(canPlacePiece(grid, piece, { x: 2, y: 0, z: 0 }, 0, level.gridSize)).toBe(false);
    });
});

// ========================================
// placePiece Tests
// ========================================

describe('placePiece', () => {
    it('sets cells to filled (2)', () => {
        const level = createTestLevel();
        const grid = initializeGrid(level);
        const piece = createTestPiece();

        const newGrid = placePiece(grid, piece, { x: 0, y: 0, z: 0 }, 0);

        expect(newGrid[0][0][0]).toBe(2);
        expect(newGrid[1][0][0]).toBe(2);
    });

    it('returns new grid (immutable)', () => {
        const level = createTestLevel();
        const grid = initializeGrid(level);
        const piece = createTestPiece();

        const newGrid = placePiece(grid, piece, { x: 0, y: 0, z: 0 }, 0);

        expect(newGrid).not.toBe(grid);
        expect(grid[0][0][0]).toBe(1); // Original unchanged
    });

    it('handles rotation correctly', () => {
        const level = createTestLevel({
            gridSize: [2, 2, 1],
            targetVoxels: [
                { x: 0, y: 0, z: 0 },
                { x: 0, y: 1, z: 0 },
            ],
        });
        const grid = initializeGrid(level);
        const piece = createTestPiece();

        const newGrid = placePiece(grid, piece, { x: 0, y: 0, z: 0 }, 90);

        expect(newGrid[0][0][0]).toBe(2);
        expect(newGrid[0][1][0]).toBe(2);
    });
});

// ========================================
// removePieceFromGrid Tests
// ========================================

describe('removePieceFromGrid', () => {
    it('reverts cells back to target (1) when targetVoxels provided', () => {
        const level = createTestLevel();
        let grid = initializeGrid(level);
        const piece = createTestPiece();

        // Place piece
        grid = placePiece(grid, piece, { x: 0, y: 0, z: 0 }, 0);
        expect(grid[0][0][0]).toBe(2);

        // Remove piece with targetVoxels
        const placedPiece: PlacedPiece = {
            pieceId: piece.id,
            position: { x: 0, y: 0, z: 0 },
            rotation: 0,
            color: piece.color,
        };
        const newGrid = removePieceFromGrid(grid, piece, placedPiece, level.targetVoxels);

        expect(newGrid[0][0][0]).toBe(1);
        expect(newGrid[1][0][0]).toBe(1);
    });

    it('reverts to empty (0) when not in targetVoxels', () => {
        const level = createTestLevel({
            gridSize: [3, 3, 1],
            targetVoxels: [{ x: 0, y: 0, z: 0 }], // Only one target
        });
        let grid = initializeGrid(level);
        const piece = createTestPiece(); // Two-block piece

        // Place piece (extends into empty cell with flexible placement)
        grid = placePiece(grid, piece, { x: 0, y: 0, z: 0 }, 0);

        const placedPiece: PlacedPiece = {
            pieceId: piece.id,
            position: { x: 0, y: 0, z: 0 },
            rotation: 0,
            color: piece.color,
        };
        const newGrid = removePieceFromGrid(grid, piece, placedPiece, level.targetVoxels);

        expect(newGrid[0][0][0]).toBe(1); // Was target, restored to target
        expect(newGrid[1][0][0]).toBe(0); // Was empty, restored to empty
    });

    it('returns new grid (immutable)', () => {
        const level = createTestLevel();
        let grid = initializeGrid(level);
        const piece = createTestPiece();

        grid = placePiece(grid, piece, { x: 0, y: 0, z: 0 }, 0);

        const placedPiece: PlacedPiece = {
            pieceId: piece.id,
            position: { x: 0, y: 0, z: 0 },
            rotation: 0,
            color: piece.color,
        };
        const newGrid = removePieceFromGrid(grid, piece, placedPiece, level.targetVoxels);

        expect(newGrid).not.toBe(grid);
        expect(grid[0][0][0]).toBe(2); // Original unchanged
    });

    it('handles rotation correctly', () => {
        const level = createTestLevel({
            gridSize: [2, 2, 1],
            targetVoxels: [
                { x: 0, y: 0, z: 0 },
                { x: 0, y: 1, z: 0 },
            ],
        });
        let grid = initializeGrid(level);
        const piece = createTestPiece();

        // Place with rotation
        grid = placePiece(grid, piece, { x: 0, y: 0, z: 0 }, 90);

        // Remove with same rotation
        const placedPiece: PlacedPiece = {
            pieceId: piece.id,
            position: { x: 0, y: 0, z: 0 },
            rotation: 90,
            color: piece.color,
        };
        const newGrid = removePieceFromGrid(grid, piece, placedPiece, level.targetVoxels);

        expect(newGrid[0][0][0]).toBe(1);
        expect(newGrid[0][1][0]).toBe(1);
    });
});

// ========================================
// checkSolved Tests
// ========================================

describe('checkSolved', () => {
    it('returns true when all target voxels are filled', () => {
        const level = createTestLevel();
        let grid = initializeGrid(level);
        const piece = createTestPiece();

        grid = placePiece(grid, piece, { x: 0, y: 0, z: 0 }, 0);

        expect(checkSolved(grid, level.targetVoxels)).toBe(true);
    });

    it('returns false when some target voxels remain unfilled', () => {
        const level = createTestLevel({
            targetVoxels: [
                { x: 0, y: 0, z: 0 },
                { x: 1, y: 0, z: 0 },
                { x: 2, y: 0, z: 0 }, // Three targets
            ],
        });
        let grid = initializeGrid(level);
        const piece = createTestPiece(); // Only 2 blocks

        grid = placePiece(grid, piece, { x: 0, y: 0, z: 0 }, 0);

        expect(checkSolved(grid, level.targetVoxels)).toBe(false);
    });

    it('returns true for empty target list', () => {
        const grid = createGrid([2, 2, 2]);

        expect(checkSolved(grid, [])).toBe(true);
    });

    it('correctly identifies partial completion', () => {
        const level = createTestLevel({
            gridSize: [4, 4, 1],
            targetVoxels: [
                { x: 0, y: 0, z: 0 },
                { x: 1, y: 0, z: 0 },
                { x: 2, y: 0, z: 0 },
                { x: 3, y: 0, z: 0 },
            ],
        });
        let grid = initializeGrid(level);
        const piece = createTestPiece();

        // Fill only first two
        grid = placePiece(grid, piece, { x: 0, y: 0, z: 0 }, 0);

        expect(checkSolved(grid, level.targetVoxels)).toBe(false);
    });
});

// ========================================
// createGameState Tests
// ========================================

describe('createGameState', () => {
    it('initializes with level config', () => {
        const level = createTestLevel();
        const state = createGameState(level);

        expect(state.level).toBe(level);
    });

    it('initializes grid with targets', () => {
        const level = createTestLevel();
        const state = createGameState(level);

        expect(state.grid[0][0][0]).toBe(1);
        expect(state.grid[1][0][0]).toBe(1);
    });

    it('starts with empty placedPieces', () => {
        const level = createTestLevel();
        const state = createGameState(level);

        expect(state.placedPieces).toEqual([]);
    });

    it('copies pieces to remainingPieces', () => {
        const level = createTestLevel();
        const state = createGameState(level);

        expect(state.remainingPieces).toEqual(level.pieces);
        expect(state.remainingPieces).not.toBe(level.pieces); // Different reference
    });

    it('initializes selection state correctly', () => {
        const level = createTestLevel();
        const state = createGameState(level);

        expect(state.selectedPieceId).toBeNull();
        expect(state.rotation).toBe(0);
        expect(state.isSolved).toBe(false);
    });
});

// ========================================
// tryPlacePiece Tests
// ========================================

describe('tryPlacePiece', () => {
    it('returns null when no piece selected', () => {
        const level = createTestLevel();
        const state = createGameState(level);

        const result = tryPlacePiece(state, { x: 0, y: 0, z: 0 });

        expect(result).toBeNull();
    });

    it('returns null when selected piece not found', () => {
        const level = createTestLevel();
        const state = createGameState(level);
        state.selectedPieceId = 'nonexistent';

        const result = tryPlacePiece(state, { x: 0, y: 0, z: 0 });

        expect(result).toBeNull();
    });

    it('returns null when placement invalid', () => {
        const level = createTestLevel();
        const state = createGameState(level);
        state.selectedPieceId = level.pieces[0].id;

        // Out of bounds
        const result = tryPlacePiece(state, { x: 99, y: 0, z: 0 });

        expect(result).toBeNull();
    });

    it('places piece and updates state on valid placement', () => {
        const level = createTestLevel();
        const state = createGameState(level);
        state.selectedPieceId = level.pieces[0].id;

        const result = tryPlacePiece(state, { x: 0, y: 0, z: 0 });

        expect(result).not.toBeNull();
        expect(result!.grid[0][0][0]).toBe(2);
        expect(result!.placedPieces).toHaveLength(1);
        expect(result!.remainingPieces).toHaveLength(0);
        expect(result!.selectedPieceId).toBeNull();
        expect(result!.rotation).toBe(0);
    });

    it('sets isSolved when puzzle completed', () => {
        const level = createTestLevel();
        const state = createGameState(level);
        state.selectedPieceId = level.pieces[0].id;

        const result = tryPlacePiece(state, { x: 0, y: 0, z: 0 });

        expect(result!.isSolved).toBe(true);
    });

    it('does not set isSolved when puzzle incomplete', () => {
        const level = createTestLevel({
            targetVoxels: [
                { x: 0, y: 0, z: 0 },
                { x: 1, y: 0, z: 0 },
                { x: 2, y: 0, z: 0 },
            ],
            pieces: [createTestPiece()], // Only covers 2 of 3
        });
        const state = createGameState(level);
        state.selectedPieceId = level.pieces[0].id;

        const result = tryPlacePiece(state, { x: 0, y: 0, z: 0 });

        expect(result!.isSolved).toBe(false);
    });

    it('records correct placedPiece info', () => {
        // Create level with vertical target to match 90-degree rotated piece
        const level = createTestLevel({
            gridSize: [3, 3, 1],
            targetVoxels: [
                { x: 0, y: 0, z: 0 },
                { x: 0, y: 1, z: 0 }, // Vertical target
            ],
        });
        const state = createGameState(level);
        state.selectedPieceId = level.pieces[0].id;
        state.rotation = 90; // Rotated piece fits vertical target

        const result = tryPlacePiece(state, { x: 0, y: 0, z: 0 });

        expect(result).not.toBeNull();
        const placed = result!.placedPieces[0];
        expect(placed.pieceId).toBe(level.pieces[0].id);
        expect(placed.position).toEqual({ x: 0, y: 0, z: 0 });
        expect(placed.rotation).toBe(90);
        expect(placed.color).toBe(level.pieces[0].color);
    });
});

// ========================================
// calculatePieceVolume Tests
// ========================================

describe('calculatePieceVolume', () => {
    it('calculates volume for single piece', () => {
        const pieces = [createTestPiece()]; // 2 blocks

        expect(calculatePieceVolume(pieces)).toBe(2);
    });

    it('calculates total volume for multiple pieces', () => {
        const pieces = [
            createTestPiece(), // 2 blocks
            createLPiece(), // 3 blocks
        ];

        expect(calculatePieceVolume(pieces)).toBe(5);
    });

    it('returns 0 for empty array', () => {
        expect(calculatePieceVolume([])).toBe(0);
    });

    it('handles single-block pieces', () => {
        const piece: Piece = {
            id: 'single',
            name: 'Single',
            color: '#000',
            layout: [{ x: 0, y: 0, z: 0 }],
        };

        expect(calculatePieceVolume([piece])).toBe(1);
    });
});

// ========================================
// validateLevelVolume Tests
// ========================================

describe('validateLevelVolume', () => {
    it('returns valid when volumes match', () => {
        const level = createTestLevel(); // 2 target voxels, 2-block piece

        const result = validateLevelVolume(level);

        expect(result.isValid).toBe(true);
        expect(result.targetVolume).toBe(2);
        expect(result.pieceVolume).toBe(2);
        expect(result.volumeDifference).toBe(0);
    });

    it('returns invalid when pieces have extra volume', () => {
        const level = createTestLevel({
            targetVoxels: [{ x: 0, y: 0, z: 0 }], // 1 target
            pieces: [createTestPiece()], // 2 blocks
        });

        const result = validateLevelVolume(level);

        expect(result.isValid).toBe(false);
        expect(result.volumeDifference).toBe(1);
        expect(result.message).toContain('extra');
    });

    it('returns invalid when target has unfillable cells', () => {
        const level = createTestLevel({
            targetVoxels: [
                { x: 0, y: 0, z: 0 },
                { x: 1, y: 0, z: 0 },
                { x: 2, y: 0, z: 0 }, // 3 targets
            ],
            pieces: [createTestPiece()], // 2 blocks
        });

        const result = validateLevelVolume(level);

        expect(result.isValid).toBe(false);
        expect(result.volumeDifference).toBe(-1);
        expect(result.message).toContain('unfillable');
    });
});

// ========================================
// validateAllLevels Tests
// ========================================

describe('validateAllLevels', () => {
    it('validates multiple levels', () => {
        const levels = [
            createTestLevel({ id: 'level1' }),
            createTestLevel({ id: 'level2' }),
        ];

        const results = validateAllLevels(levels);

        expect(results.size).toBe(2);
        expect(results.has('level1')).toBe(true);
        expect(results.has('level2')).toBe(true);
    });

    it('returns correct validation for each level', () => {
        const validLevel = createTestLevel({ id: 'valid' });
        const invalidLevel = createTestLevel({
            id: 'invalid',
            targetVoxels: [{ x: 0, y: 0, z: 0 }], // Only 1 target for 2-block piece
        });

        const results = validateAllLevels([validLevel, invalidLevel]);

        expect(results.get('valid')!.isValid).toBe(true);
        expect(results.get('invalid')!.isValid).toBe(false);
    });

    it('returns empty map for empty input', () => {
        const results = validateAllLevels([]);

        expect(results.size).toBe(0);
    });
});
