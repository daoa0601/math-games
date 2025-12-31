// ========================================
// Shape Architect - Type Definitions
// ========================================

export type CellState = 0 | 1 | 2;
// 0 = Empty
// 1 = Target (ghost shape)
// 2 = Filled (placed block)

export interface Position3D {
    x: number;
    y: number;
    z: number;
}

export interface Piece {
    id: string;
    name: string;
    color: string;
    layout: Position3D[]; // Relative positions of cubes
}

export interface PlacedPiece {
    pieceId: string;
    position: Position3D;
    rotation: number; // 0, 90, 180, 270 degrees
    color: string; // Store the piece color for display
}

export interface LevelConfig {
    id: string;
    name: string;
    type: '2D' | '3D';
    gridSize: [number, number, number]; // [width, height, depth]
    targetVoxels: Position3D[];
    pieces: Piece[];
    difficulty: 'easy' | 'medium' | 'hard';
}

export interface GameState {
    level: LevelConfig;
    grid: CellState[][][];
    placedPieces: PlacedPiece[];
    remainingPieces: Piece[];
    selectedPieceId: string | null;
    rotation: number;
    isSolved: boolean;
}
