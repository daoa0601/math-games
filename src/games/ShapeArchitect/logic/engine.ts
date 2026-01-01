// ========================================
// Shape Architect - Voxel Engine
// ========================================

import type { CellState, Position3D, Piece, LevelConfig, GameState, PlacedPiece, Rotation3D, RotationAxis } from './types';
import { DEFAULT_ROTATION } from './types';

/**
 * Create an empty 3D grid
 */
export function createGrid(size: [number, number, number]): CellState[][][] {
    const [width, height, depth] = size;
    return Array(width)
        .fill(null)
        .map(() =>
            Array(height)
                .fill(null)
                .map(() => Array(depth).fill(0))
        );
}

/**
 * Initialize grid with target voxels
 */
export function initializeGrid(level: LevelConfig): CellState[][][] {
    const grid = createGrid(level.gridSize);

    for (const pos of level.targetVoxels) {
        if (isInBounds(pos, level.gridSize)) {
            grid[pos.x][pos.y][pos.z] = 1; // Target zone
        }
    }

    return grid;
}

/**
 * Check if position is within grid bounds
 */
export function isInBounds(pos: Position3D, size: [number, number, number]): boolean {
    return (
        pos.x >= 0 && pos.x < size[0] &&
        pos.y >= 0 && pos.y < size[1] &&
        pos.z >= 0 && pos.z < size[2]
    );
}

// ========================================
// 3D Rotation System
// ========================================

/**
 * Normalize angle to valid rotation value (0, 90, 180, 270)
 */
export function normalizeAngle(angle: number): number {
    return ((angle % 360) + 360) % 360;
}

/**
 * Create a rotation by adding 90 degrees to a specific axis
 */
export function rotateBy90OnAxis(rotation: Rotation3D, axis: RotationAxis): Rotation3D {
    return {
        x: axis === 'x' ? normalizeAngle(rotation.x + 90) : rotation.x,
        y: axis === 'y' ? normalizeAngle(rotation.y + 90) : rotation.y,
        z: axis === 'z' ? normalizeAngle(rotation.z + 90) : rotation.z,
    };
}

/**
 * Rotate a single position 90 degrees around the X-axis (pitch)
 * Transformation: (x, y, z) -> (x, -z, y)
 */
function rotatePositionAroundX(pos: Position3D): Position3D {
    return { x: pos.x, y: -pos.z, z: pos.y };
}

/**
 * Rotate a single position 90 degrees around the Y-axis (yaw)
 * Transformation: (x, y, z) -> (z, y, -x)
 */
function rotatePositionAroundY(pos: Position3D): Position3D {
    return { x: pos.z, y: pos.y, z: -pos.x };
}

/**
 * Rotate a single position 90 degrees around the Z-axis (roll)
 * Transformation: (x, y, z) -> (-y, x, z)
 */
function rotatePositionAroundZ(pos: Position3D): Position3D {
    return { x: -pos.y, y: pos.x, z: pos.z };
}

/**
 * Normalize layout to have minimum coordinates at origin (0,0,0)
 */
function normalizeLayout(layout: Position3D[]): Position3D[] {
    if (layout.length === 0) return layout;

    const minX = Math.min(...layout.map((p) => p.x));
    const minY = Math.min(...layout.map((p) => p.y));
    const minZ = Math.min(...layout.map((p) => p.z));

    return layout.map((pos) => ({
        x: pos.x - minX,
        y: pos.y - minY,
        z: pos.z - minZ,
    }));
}

/**
 * Rotate piece layout using full 3D rotation (Rotation3D).
 * Applies rotations in order: X -> Y -> Z
 */
export function rotatePieceLayout3D(layout: Position3D[], rotation: Rotation3D): Position3D[] {
    let result = [...layout];

    // X-axis rotation (pitch)
    const xTimes = (normalizeAngle(rotation.x) / 90) % 4;
    for (let i = 0; i < xTimes; i++) {
        result = result.map(rotatePositionAroundX);
    }

    // Y-axis rotation (yaw)
    const yTimes = (normalizeAngle(rotation.y) / 90) % 4;
    for (let i = 0; i < yTimes; i++) {
        result = result.map(rotatePositionAroundY);
    }

    // Z-axis rotation (roll)
    const zTimes = (normalizeAngle(rotation.z) / 90) % 4;
    for (let i = 0; i < zTimes; i++) {
        result = result.map(rotatePositionAroundZ);
    }

    // Normalize to positive coordinates
    return normalizeLayout(result);
}

/**
 * Legacy function: Rotate piece layout by 90 degrees (2D rotation around Z axis)
 * Preserves z-coordinate (only normalizes x and y)
 * @deprecated Use rotatePieceLayout3D with Rotation3D instead
 */
export function rotatePieceLayout(layout: Position3D[], rotation: number): Position3D[] {
    const times = (rotation / 90) % 4;
    let result = [...layout];

    for (let i = 0; i < times; i++) {
        result = result.map(rotatePositionAroundZ);
    }

    // Normalize only x and y to positive coordinates (preserve z)
    const minX = Math.min(...result.map((p) => p.x));
    const minY = Math.min(...result.map((p) => p.y));

    return result.map((pos) => ({
        x: pos.x - minX,
        y: pos.y - minY,
        z: pos.z, // Preserve original z coordinate for 2D rotation
    }));
}

/**
 * Get world positions of piece cubes
 */
export function getPieceWorldPositions(
    piece: Piece,
    position: Position3D,
    rotation: Rotation3D
): Position3D[] {
    const rotatedLayout = rotatePieceLayout3D(piece.layout, rotation);
    return rotatedLayout.map((local) => ({
        x: position.x + local.x,
        y: position.y + local.y,
        z: position.z + local.z,
    }));
}

/**
 * Check if piece can be placed at position
 * Flexible placement: pieces can extend into empty cells (0) as long as
 * at least one voxel is on a target cell (1)
 */
export function canPlacePiece(
    grid: CellState[][][],
    piece: Piece,
    position: Position3D,
    rotation: Rotation3D,
    gridSize: [number, number, number]
): boolean {
    const worldPositions = getPieceWorldPositions(piece, position, rotation);
    let hasTargetCell = false;

    for (const pos of worldPositions) {
        // Check bounds
        if (!isInBounds(pos, gridSize)) {
            return false;
        }

        const cell = grid[pos.x][pos.y][pos.z];

        // Cannot place on already filled cells (overlap not allowed)
        if (cell === 2) {
            return false;
        }

        // Track if at least one voxel is on a target cell
        if (cell === 1) {
            hasTargetCell = true;
        }
    }

    // Require at least one voxel on target to ensure progress toward solution
    return hasTargetCell;
}

/**
 * Find nearest valid position for piece within search radius.
 * Returns null if no valid position found.
 * Used for snap-to-nearest functionality.
 */
export function findNearestValidPosition(
    grid: CellState[][][],
    piece: Piece,
    attemptedPosition: Position3D,
    rotation: Rotation3D,
    gridSize: [number, number, number],
    maxSearchRadius: number = 2
): Position3D | null {
    // If current position is valid, return it immediately
    if (canPlacePiece(grid, piece, attemptedPosition, rotation, gridSize)) {
        return attemptedPosition;
    }

    // Search in expanding circles around attempted position
    for (let radius = 1; radius <= maxSearchRadius; radius++) {
        // Search in 2D (x, y) as all current levels are 2D (z=0)
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                // Skip inner positions (already checked at smaller radius)
                if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) {
                    continue;
                }

                const candidatePos: Position3D = {
                    x: attemptedPosition.x + dx,
                    y: attemptedPosition.y + dy,
                    z: attemptedPosition.z,
                };

                if (canPlacePiece(grid, piece, candidatePos, rotation, gridSize)) {
                    return candidatePos;
                }
            }
        }
    }

    return null; // No valid position found
}

/**
 * Place piece on grid
 */
export function placePiece(
    grid: CellState[][][],
    piece: Piece,
    position: Position3D,
    rotation: Rotation3D
): CellState[][][] {
    const newGrid = grid.map((plane) => plane.map((row) => [...row]));
    const worldPositions = getPieceWorldPositions(piece, position, rotation);

    for (const pos of worldPositions) {
        newGrid[pos.x][pos.y][pos.z] = 2; // Filled
    }

    return newGrid;
}

/**
 * Remove piece from grid by reverting its cells to their original state
 * Used for undo functionality
 * With flexible placement, cells may be restored to target (1) or empty (0)
 */
export function removePieceFromGrid(
    grid: CellState[][][],
    piece: Piece,
    placedPiece: PlacedPiece,
    targetVoxels?: Position3D[]
): CellState[][][] {
    // Create a deep copy of the grid
    const newGrid = grid.map((plane) => plane.map((row) => [...row]));

    // Calculate the world positions of the piece based on where it was placed
    const worldPositions = getPieceWorldPositions(piece, placedPiece.position, placedPiece.rotation);

    // Create a set for fast lookup of target positions
    const targetSet = targetVoxels
        ? new Set(targetVoxels.map(p => `${p.x},${p.y},${p.z}`))
        : null;

    // Revert each cell to its original state
    for (const pos of worldPositions) {
        if (isInBounds(pos, [grid.length, grid[0].length, grid[0][0].length])) {
            const key = `${pos.x},${pos.y},${pos.z}`;
            // Restore to target (1) if it was a target cell, otherwise empty (0)
            newGrid[pos.x][pos.y][pos.z] = targetSet?.has(key) ? 1 : 0;
        }
    }

    return newGrid;
}

/**
 * Check if puzzle is solved (all target cells are filled)
 */
export function checkSolved(grid: CellState[][][], targetVoxels: Position3D[]): boolean {
    return targetVoxels.every((pos) => grid[pos.x][pos.y][pos.z] === 2);
}

/**
 * Create initial game state from level config
 */
export function createGameState(level: LevelConfig): GameState {
    return {
        level,
        grid: initializeGrid(level),
        placedPieces: [],
        remainingPieces: [...level.pieces],
        selectedPieceId: null,
        rotation: { ...DEFAULT_ROTATION },
        isSolved: false,
    };
}

/**
 * Try to place selected piece at position
 * Uses snap-to-nearest if direct placement fails
 */
export function tryPlacePiece(
    state: GameState,
    position: Position3D
): GameState | null {
    if (!state.selectedPieceId) return null;

    const piece = state.remainingPieces.find((p) => p.id === state.selectedPieceId);
    if (!piece) return null;

    // Try snap-to-nearest if direct placement fails
    const finalPosition = findNearestValidPosition(
        state.grid,
        piece,
        position,
        state.rotation,
        state.level.gridSize,
        2 // Search within 2 cells
    );

    if (!finalPosition) {
        return null;
    }

    const newGrid = placePiece(state.grid, piece, finalPosition, state.rotation);
    const newRemaining = state.remainingPieces.filter((p) => p.id !== piece.id);
    const newPlaced: PlacedPiece = {
        pieceId: piece.id,
        position: finalPosition,
        rotation: { ...state.rotation },
        color: piece.color,
    };

    const isSolved = checkSolved(newGrid, state.level.targetVoxels);

    return {
        ...state,
        grid: newGrid,
        placedPieces: [...state.placedPieces, newPlaced],
        remainingPieces: newRemaining,
        selectedPieceId: null,
        rotation: { ...DEFAULT_ROTATION },
        isSolved,
    };
}

// ========================================
// Level Validation: Volume Conservation
// ========================================

export interface LevelValidation {
    isValid: boolean;
    targetVolume: number;
    pieceVolume: number;
    volumeDifference: number;
    message: string;
}

/**
 * Calculate total volume of all pieces in a level
 */
export function calculatePieceVolume(pieces: Piece[]): number {
    return pieces.reduce((sum, piece) => sum + piece.layout.length, 0);
}

/**
 * Validate that a level's piece volume equals target volume
 * This is a necessary condition for solvability
 */
export function validateLevelVolume(level: LevelConfig): LevelValidation {
    const targetVolume = level.targetVoxels.length;
    const pieceVolume = calculatePieceVolume(level.pieces);
    const volumeDifference = pieceVolume - targetVolume;

    let message: string;
    let isValid: boolean;

    if (volumeDifference === 0) {
        isValid = true;
        message = 'Volume matches - level may be solvable';
    } else if (volumeDifference > 0) {
        isValid = false;
        message = `Pieces have ${volumeDifference} extra cells - cannot fit in target`;
    } else {
        isValid = false;
        message = `Target has ${Math.abs(volumeDifference)} unfillable cells - need more pieces`;
    }

    return {
        isValid,
        targetVolume,
        pieceVolume,
        volumeDifference,
        message,
    };
}

/**
 * Validate all preset levels and return report
 * Used in dev mode to ensure level design integrity
 */
export function validateAllLevels(levels: LevelConfig[]): Map<string, LevelValidation> {
    const results = new Map<string, LevelValidation>();

    for (const level of levels) {
        results.set(level.id, validateLevelVolume(level));
    }

    return results;
}
