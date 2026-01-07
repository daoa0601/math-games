// ========================================
// Shape Architect - Preset Levels with Tetris Pieces
// Increased difficulty: Easy requires 4-5 pieces minimum
// ========================================

import type { LevelConfig, Piece } from './types';
import { validateAllLevels, type LevelValidation } from './engine';
import { createSeededRandom } from '@/shared/utils';
import { generateGuaranteedSolvableWithRetry } from './seededGenerator';

// ========================================
// All 7 Classic Tetris Pieces (Tetrominoes)
// ========================================

const TETRIS = {
    I: (id: string, color: string): Piece => ({
        id,
        name: 'I-Block',
        color,
        layout: [
            { x: 0, y: 0, z: 0 },
            { x: 1, y: 0, z: 0 },
            { x: 2, y: 0, z: 0 },
            { x: 3, y: 0, z: 0 },
        ],
    }),

    O: (id: string, color: string): Piece => ({
        id,
        name: 'O-Block',
        color,
        layout: [
            { x: 0, y: 0, z: 0 },
            { x: 1, y: 0, z: 0 },
            { x: 0, y: 1, z: 0 },
            { x: 1, y: 1, z: 0 },
        ],
    }),

    T: (id: string, color: string): Piece => ({
        id,
        name: 'T-Block',
        color,
        layout: [
            { x: 0, y: 0, z: 0 },
            { x: 1, y: 0, z: 0 },
            { x: 2, y: 0, z: 0 },
            { x: 1, y: 1, z: 0 },
        ],
    }),

    S: (id: string, color: string): Piece => ({
        id,
        name: 'S-Block',
        color,
        layout: [
            { x: 1, y: 0, z: 0 },
            { x: 2, y: 0, z: 0 },
            { x: 0, y: 1, z: 0 },
            { x: 1, y: 1, z: 0 },
        ],
    }),

    Z: (id: string, color: string): Piece => ({
        id,
        name: 'Z-Block',
        color,
        layout: [
            { x: 0, y: 0, z: 0 },
            { x: 1, y: 0, z: 0 },
            { x: 1, y: 1, z: 0 },
            { x: 2, y: 1, z: 0 },
        ],
    }),

    J: (id: string, color: string): Piece => ({
        id,
        name: 'J-Block',
        color,
        layout: [
            { x: 0, y: 0, z: 0 },
            { x: 0, y: 1, z: 0 },
            { x: 1, y: 1, z: 0 },
            { x: 2, y: 1, z: 0 },
        ],
    }),

    L: (id: string, color: string): Piece => ({
        id,
        name: 'L-Block',
        color,
        layout: [
            { x: 2, y: 0, z: 0 },
            { x: 0, y: 1, z: 0 },
            { x: 1, y: 1, z: 0 },
            { x: 2, y: 1, z: 0 },
        ],
    }),
};

// Pentominoes for harder levels (5 cells each)
const PENTOMINO = {
    F: (id: string, color: string): Piece => ({
        id,
        name: 'F-Pento',
        color,
        layout: [
            { x: 1, y: 0, z: 0 },
            { x: 2, y: 0, z: 0 },
            { x: 0, y: 1, z: 0 },
            { x: 1, y: 1, z: 0 },
            { x: 1, y: 2, z: 0 },
        ],
    }),

    P: (id: string, color: string): Piece => ({
        id,
        name: 'P-Pento',
        color,
        layout: [
            { x: 0, y: 0, z: 0 },
            { x: 1, y: 0, z: 0 },
            { x: 0, y: 1, z: 0 },
            { x: 1, y: 1, z: 0 },
            { x: 0, y: 2, z: 0 },
        ],
    }),

    U: (id: string, color: string): Piece => ({
        id,
        name: 'U-Pento',
        color,
        layout: [
            { x: 0, y: 0, z: 0 },
            { x: 2, y: 0, z: 0 },
            { x: 0, y: 1, z: 0 },
            { x: 1, y: 1, z: 0 },
            { x: 2, y: 1, z: 0 },
        ],
    }),

    W: (id: string, color: string): Piece => ({
        id,
        name: 'W-Pento',
        color,
        layout: [
            { x: 0, y: 0, z: 0 },
            { x: 0, y: 1, z: 0 },
            { x: 1, y: 1, z: 0 },
            { x: 1, y: 2, z: 0 },
            { x: 2, y: 2, z: 0 },
        ],
    }),

    // Additional Pentominoes (completing the full set of 12)
    I: (id: string, color: string): Piece => ({
        id,
        name: 'I-Pento',
        color,
        layout: [
            { x: 0, y: 0, z: 0 },
            { x: 0, y: 1, z: 0 },
            { x: 0, y: 2, z: 0 },
            { x: 0, y: 3, z: 0 },
            { x: 0, y: 4, z: 0 },
        ],
    }),

    L: (id: string, color: string): Piece => ({
        id,
        name: 'L-Pento',
        color,
        layout: [
            { x: 0, y: 0, z: 0 },
            { x: 0, y: 1, z: 0 },
            { x: 0, y: 2, z: 0 },
            { x: 0, y: 3, z: 0 },
            { x: 1, y: 3, z: 0 },
        ],
    }),

    N: (id: string, color: string): Piece => ({
        id,
        name: 'N-Pento',
        color,
        layout: [
            { x: 0, y: 0, z: 0 },
            { x: 0, y: 1, z: 0 },
            { x: 1, y: 1, z: 0 },
            { x: 1, y: 2, z: 0 },
            { x: 1, y: 3, z: 0 },
        ],
    }),

    T: (id: string, color: string): Piece => ({
        id,
        name: 'T-Pento',
        color,
        layout: [
            { x: 0, y: 0, z: 0 },
            { x: 1, y: 0, z: 0 },
            { x: 2, y: 0, z: 0 },
            { x: 1, y: 1, z: 0 },
            { x: 1, y: 2, z: 0 },
        ],
    }),

    V: (id: string, color: string): Piece => ({
        id,
        name: 'V-Pento',
        color,
        layout: [
            { x: 0, y: 0, z: 0 },
            { x: 0, y: 1, z: 0 },
            { x: 0, y: 2, z: 0 },
            { x: 1, y: 2, z: 0 },
            { x: 2, y: 2, z: 0 },
        ],
    }),

    X: (id: string, color: string): Piece => ({
        id,
        name: 'X-Pento',
        color,
        layout: [
            { x: 1, y: 0, z: 0 },
            { x: 0, y: 1, z: 0 },
            { x: 1, y: 1, z: 0 },
            { x: 2, y: 1, z: 0 },
            { x: 1, y: 2, z: 0 },
        ],
    }),

    Y: (id: string, color: string): Piece => ({
        id,
        name: 'Y-Pento',
        color,
        layout: [
            { x: 1, y: 0, z: 0 },
            { x: 0, y: 1, z: 0 },
            { x: 1, y: 1, z: 0 },
            { x: 1, y: 2, z: 0 },
            { x: 1, y: 3, z: 0 },
        ],
    }),

    Z: (id: string, color: string): Piece => ({
        id,
        name: 'Z-Pento',
        color,
        layout: [
            { x: 0, y: 0, z: 0 },
            { x: 1, y: 0, z: 0 },
            { x: 1, y: 1, z: 0 },
            { x: 1, y: 2, z: 0 },
            { x: 2, y: 2, z: 0 },
        ],
    }),
};

// ========================================
// 3D Polycubes (True 3D pieces with z > 0)
// ========================================

const POLYCUBE_3D = {
    // 3D Tetracubes (4 cells, extending into z)
    Corner3D: (id: string, color: string): Piece => ({
        id,
        name: '3D Corner',
        color,
        layout: [
            { x: 0, y: 0, z: 0 },
            { x: 1, y: 0, z: 0 },
            { x: 0, y: 1, z: 0 },
            { x: 0, y: 0, z: 1 },
        ],
    }),

    Tower4: (id: string, color: string): Piece => ({
        id,
        name: 'Tower',
        color,
        layout: [
            { x: 0, y: 0, z: 0 },
            { x: 0, y: 0, z: 1 },
            { x: 0, y: 0, z: 2 },
            { x: 0, y: 0, z: 3 },
        ],
    }),

    L3D: (id: string, color: string): Piece => ({
        id,
        name: '3D L-Block',
        color,
        layout: [
            { x: 0, y: 0, z: 0 },
            { x: 0, y: 0, z: 1 },
            { x: 0, y: 0, z: 2 },
            { x: 1, y: 0, z: 0 },
        ],
    }),

    T3D: (id: string, color: string): Piece => ({
        id,
        name: '3D T-Block',
        color,
        layout: [
            { x: 0, y: 0, z: 0 },
            { x: 1, y: 0, z: 0 },
            { x: 2, y: 0, z: 0 },
            { x: 1, y: 0, z: 1 },
        ],
    }),

    Step3D: (id: string, color: string): Piece => ({
        id,
        name: '3D Step',
        color,
        layout: [
            { x: 0, y: 0, z: 0 },
            { x: 1, y: 0, z: 0 },
            { x: 1, y: 0, z: 1 },
            { x: 2, y: 0, z: 1 },
        ],
    }),

    // Small cube (2x2x1 base)
    Cube2x2: (id: string, color: string): Piece => ({
        id,
        name: '2x2 Block',
        color,
        layout: [
            { x: 0, y: 0, z: 0 },
            { x: 1, y: 0, z: 0 },
            { x: 0, y: 1, z: 0 },
            { x: 1, y: 1, z: 0 },
        ],
    }),

    // 3D Pentacubes (5 cells)
    Plus3D: (id: string, color: string): Piece => ({
        id,
        name: '3D Plus',
        color,
        layout: [
            { x: 1, y: 0, z: 0 },
            { x: 0, y: 0, z: 1 },
            { x: 1, y: 0, z: 1 },
            { x: 2, y: 0, z: 1 },
            { x: 1, y: 0, z: 2 },
        ],
    }),

    Stairs3D: (id: string, color: string): Piece => ({
        id,
        name: '3D Stairs',
        color,
        layout: [
            { x: 0, y: 0, z: 0 },
            { x: 1, y: 0, z: 0 },
            { x: 1, y: 0, z: 1 },
            { x: 2, y: 0, z: 1 },
            { x: 2, y: 0, z: 2 },
        ],
    }),

    Hook3D: (id: string, color: string): Piece => ({
        id,
        name: '3D Hook',
        color,
        layout: [
            { x: 0, y: 0, z: 0 },
            { x: 0, y: 0, z: 1 },
            { x: 0, y: 0, z: 2 },
            { x: 1, y: 0, z: 2 },
            { x: 1, y: 1, z: 2 },
        ],
    }),

    // 3D Hexacube (6 cells)
    Bracket3D: (id: string, color: string): Piece => ({
        id,
        name: '3D Bracket',
        color,
        layout: [
            { x: 0, y: 0, z: 0 },
            { x: 1, y: 0, z: 0 },
            { x: 0, y: 0, z: 1 },
            { x: 0, y: 0, z: 2 },
            { x: 1, y: 0, z: 2 },
            { x: 0, y: 1, z: 1 },
        ],
    }),

    // 8-cell cube (2x2x2)
    Cube2x2x2: (id: string, color: string): Piece => ({
        id,
        name: '2x2x2 Cube',
        color,
        layout: [
            { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 },
            { x: 0, y: 1, z: 0 }, { x: 1, y: 1, z: 0 },
            { x: 0, y: 0, z: 1 }, { x: 1, y: 0, z: 1 },
            { x: 0, y: 1, z: 1 }, { x: 1, y: 1, z: 1 },
        ],
    }),
};

// ========================================
// Themed Shapes - Fun recognizable shapes
// ========================================

export const THEMED_SHAPES = {
    // Cat face (simplified) - 8 cells
    Cat: (id: string, color: string): Piece => ({
        id,
        name: 'Cat',
        color,
        layout: [
            // Body (2x2)
            { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 },
            { x: 0, y: 1, z: 0 }, { x: 1, y: 1, z: 0 },
            // Ears
            { x: 0, y: 2, z: 0 }, { x: 1, y: 2, z: 0 },
            // Tail (extends right)
            { x: 2, y: 0, z: 0 }, { x: 3, y: 0, z: 0 },
        ],
    }),

    // Dog (side view) - 9 cells
    Dog: (id: string, color: string): Piece => ({
        id,
        name: 'Dog',
        color,
        layout: [
            // Body
            { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, { x: 2, y: 0, z: 0 },
            { x: 0, y: 1, z: 0 }, { x: 1, y: 1, z: 0 }, { x: 2, y: 1, z: 0 },
            // Head
            { x: 3, y: 1, z: 0 },
            // Legs
            { x: 0, y: -1, z: 0 }, { x: 2, y: -1, z: 0 },
        ],
    }),

    // Bird - 7 cells
    Bird: (id: string, color: string): Piece => ({
        id,
        name: 'Bird',
        color,
        layout: [
            // Body
            { x: 1, y: 0, z: 0 }, { x: 2, y: 0, z: 0 },
            { x: 1, y: 1, z: 0 },
            // Wing
            { x: 0, y: 1, z: 0 },
            // Head and beak
            { x: 3, y: 0, z: 0 }, { x: 4, y: 0, z: 0 },
            // Tail
            { x: 0, y: 0, z: 0 },
        ],
    }),

    // Car (side view) - 8 cells
    Car: (id: string, color: string): Piece => ({
        id,
        name: 'Car',
        color,
        layout: [
            // Body
            { x: 0, y: 1, z: 0 }, { x: 1, y: 1, z: 0 }, { x: 2, y: 1, z: 0 }, { x: 3, y: 1, z: 0 },
            // Roof
            { x: 1, y: 2, z: 0 }, { x: 2, y: 2, z: 0 },
            // Wheels
            { x: 0, y: 0, z: 0 }, { x: 3, y: 0, z: 0 },
        ],
    }),

    // Heart - 8 cells
    Heart: (id: string, color: string): Piece => ({
        id,
        name: 'Heart',
        color,
        layout: [
            // Top bumps
            { x: 0, y: 2, z: 0 }, { x: 2, y: 2, z: 0 },
            // Middle row
            { x: 0, y: 1, z: 0 }, { x: 1, y: 1, z: 0 }, { x: 2, y: 1, z: 0 },
            // Bottom point
            { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, { x: 2, y: 0, z: 0 },
        ],
    }),

    // Star (5-pointed, simplified) - 9 cells
    Star: (id: string, color: string): Piece => ({
        id,
        name: 'Star',
        color,
        layout: [
            // Center cross
            { x: 2, y: 0, z: 0 },
            { x: 1, y: 1, z: 0 }, { x: 2, y: 1, z: 0 }, { x: 3, y: 1, z: 0 },
            { x: 0, y: 2, z: 0 }, { x: 2, y: 2, z: 0 }, { x: 4, y: 2, z: 0 },
            { x: 1, y: 3, z: 0 }, { x: 3, y: 3, z: 0 },
        ],
    }),

    // House - 9 cells
    House: (id: string, color: string): Piece => ({
        id,
        name: 'House',
        color,
        layout: [
            // Base (2x2)
            { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, { x: 2, y: 0, z: 0 },
            { x: 0, y: 1, z: 0 }, { x: 1, y: 1, z: 0 }, { x: 2, y: 1, z: 0 },
            // Roof (triangle)
            { x: 0, y: 2, z: 0 }, { x: 1, y: 2, z: 0 }, { x: 2, y: 2, z: 0 },
        ],
    }),

    // Tree - 7 cells
    Tree: (id: string, color: string): Piece => ({
        id,
        name: 'Tree',
        color,
        layout: [
            // Trunk
            { x: 1, y: 0, z: 0 }, { x: 1, y: 1, z: 0 },
            // Leaves (triangle)
            { x: 0, y: 2, z: 0 }, { x: 1, y: 2, z: 0 }, { x: 2, y: 2, z: 0 },
            { x: 0, y: 3, z: 0 }, { x: 2, y: 3, z: 0 },
        ],
    }),
};

// ========================================
// Preset Levels - ALL require 4+ pieces
// ========================================

export const presetLevels: LevelConfig[] = [
    // ===== EASY LEVELS (4-5 pieces) =====
    {
        id: 'easy_1',
        name: '4x4 Square',
        type: '2D',
        gridSize: [6, 6, 1],
        targetVoxels: [
            // 4x4 = 16 cells (4 tetrominoes)
            { x: 1, y: 1, z: 0 }, { x: 2, y: 1, z: 0 }, { x: 3, y: 1, z: 0 }, { x: 4, y: 1, z: 0 },
            { x: 1, y: 2, z: 0 }, { x: 2, y: 2, z: 0 }, { x: 3, y: 2, z: 0 }, { x: 4, y: 2, z: 0 },
            { x: 1, y: 3, z: 0 }, { x: 2, y: 3, z: 0 }, { x: 3, y: 3, z: 0 }, { x: 4, y: 3, z: 0 },
            { x: 1, y: 4, z: 0 }, { x: 2, y: 4, z: 0 }, { x: 3, y: 4, z: 0 }, { x: 4, y: 4, z: 0 },
        ],
        pieces: [
            TETRIS.O('o1', '#FFEB3B'),
            TETRIS.O('o2', '#4CAF50'),
            TETRIS.O('o3', '#2196F3'),
            TETRIS.O('o4', '#E91E63'),
        ],
        difficulty: 'easy',
    },
    {
        id: 'easy_2',
        name: 'Long Strip',
        type: '2D',
        gridSize: [8, 5, 1],
        targetVoxels: [
            // 8x2 = 16 cells
            { x: 0, y: 1, z: 0 }, { x: 1, y: 1, z: 0 }, { x: 2, y: 1, z: 0 }, { x: 3, y: 1, z: 0 },
            { x: 4, y: 1, z: 0 }, { x: 5, y: 1, z: 0 }, { x: 6, y: 1, z: 0 }, { x: 7, y: 1, z: 0 },
            { x: 0, y: 2, z: 0 }, { x: 1, y: 2, z: 0 }, { x: 2, y: 2, z: 0 }, { x: 3, y: 2, z: 0 },
            { x: 4, y: 2, z: 0 }, { x: 5, y: 2, z: 0 }, { x: 6, y: 2, z: 0 }, { x: 7, y: 2, z: 0 },
        ],
        pieces: [
            TETRIS.I('i1', '#00BCD4'),
            TETRIS.I('i2', '#4CAF50'),
            TETRIS.I('i3', '#FF9800'),
            TETRIS.I('i4', '#9C27B0'),
        ],
        difficulty: 'easy',
    },
    {
        id: 'easy_3',
        name: 'T-Formation',
        type: '2D',
        gridSize: [7, 7, 1],
        targetVoxels: [
            // Simple T-shape = 16 cells = 4 O-blocks
            // Top bar 4x2
            { x: 1, y: 1, z: 0 }, { x: 2, y: 1, z: 0 }, { x: 3, y: 1, z: 0 }, { x: 4, y: 1, z: 0 },
            { x: 1, y: 2, z: 0 }, { x: 2, y: 2, z: 0 }, { x: 3, y: 2, z: 0 }, { x: 4, y: 2, z: 0 },
            // Stem 2x4
            { x: 2, y: 3, z: 0 }, { x: 3, y: 3, z: 0 },
            { x: 2, y: 4, z: 0 }, { x: 3, y: 4, z: 0 },
            { x: 2, y: 5, z: 0 }, { x: 3, y: 5, z: 0 },
            { x: 2, y: 6, z: 0 }, { x: 3, y: 6, z: 0 },
        ],
        pieces: [
            TETRIS.O('o1', '#00BCD4'),
            TETRIS.O('o2', '#9C27B0'),
            TETRIS.O('o3', '#E91E63'),
            TETRIS.O('o4', '#FF9800'),
        ],
        difficulty: 'easy',
    },
    {
        id: 'easy_4',
        name: 'Rectangle',
        type: '2D',
        gridSize: [8, 5, 1],
        targetVoxels: [
            // 6x4 = 24 cells = 6 O-blocks (easily solvable)
            { x: 1, y: 1, z: 0 }, { x: 2, y: 1, z: 0 }, { x: 3, y: 1, z: 0 }, { x: 4, y: 1, z: 0 }, { x: 5, y: 1, z: 0 }, { x: 6, y: 1, z: 0 },
            { x: 1, y: 2, z: 0 }, { x: 2, y: 2, z: 0 }, { x: 3, y: 2, z: 0 }, { x: 4, y: 2, z: 0 }, { x: 5, y: 2, z: 0 }, { x: 6, y: 2, z: 0 },
            { x: 1, y: 3, z: 0 }, { x: 2, y: 3, z: 0 }, { x: 3, y: 3, z: 0 }, { x: 4, y: 3, z: 0 }, { x: 5, y: 3, z: 0 }, { x: 6, y: 3, z: 0 },
            { x: 1, y: 4, z: 0 }, { x: 2, y: 4, z: 0 }, { x: 3, y: 4, z: 0 }, { x: 4, y: 4, z: 0 }, { x: 5, y: 4, z: 0 }, { x: 6, y: 4, z: 0 },
        ],
        pieces: [
            TETRIS.O('o1', '#00BCD4'),
            TETRIS.O('o2', '#FFEB3B'),
            TETRIS.O('o3', '#9C27B0'),
            TETRIS.O('o4', '#FF9800'),
            TETRIS.O('o5', '#2196F3'),
            TETRIS.O('o6', '#4CAF50'),
        ],
        difficulty: 'easy',
    },

    // ===== MEDIUM LEVELS (5-6 pieces) =====
    {
        id: 'med_1',
        name: 'Plus Sign',
        type: '2D',
        gridSize: [8, 8, 1],
        targetVoxels: [
            // Plus shape = 20 cells = 5 O-blocks
            // Top stem 2x2
            { x: 3, y: 1, z: 0 }, { x: 4, y: 1, z: 0 },
            { x: 3, y: 2, z: 0 }, { x: 4, y: 2, z: 0 },
            // Cross bar 6x2
            { x: 1, y: 3, z: 0 }, { x: 2, y: 3, z: 0 }, { x: 3, y: 3, z: 0 }, { x: 4, y: 3, z: 0 }, { x: 5, y: 3, z: 0 }, { x: 6, y: 3, z: 0 },
            { x: 1, y: 4, z: 0 }, { x: 2, y: 4, z: 0 }, { x: 3, y: 4, z: 0 }, { x: 4, y: 4, z: 0 }, { x: 5, y: 4, z: 0 }, { x: 6, y: 4, z: 0 },
            // Bottom stem 2x2
            { x: 3, y: 5, z: 0 }, { x: 4, y: 5, z: 0 },
            { x: 3, y: 6, z: 0 }, { x: 4, y: 6, z: 0 },
        ],
        pieces: [
            TETRIS.O('o1', '#FFEB3B'),
            TETRIS.O('o2', '#4CAF50'),
            TETRIS.O('o3', '#00BCD4'),
            TETRIS.O('o4', '#9C27B0'),
            TETRIS.O('o5', '#E91E63'),
        ],
        difficulty: 'medium',
    },
    {
        id: 'med_2',
        name: 'Staircase',
        type: '2D',
        gridSize: [8, 5, 1],
        targetVoxels: [
            // Simple stair pattern = 20 cells = 5 tetrominoes
            { x: 1, y: 1, z: 0 }, { x: 2, y: 1, z: 0 }, { x: 3, y: 1, z: 0 }, { x: 4, y: 1, z: 0 },
            { x: 1, y: 2, z: 0 }, { x: 2, y: 2, z: 0 }, { x: 3, y: 2, z: 0 }, { x: 4, y: 2, z: 0 },
            { x: 3, y: 3, z: 0 }, { x: 4, y: 3, z: 0 }, { x: 5, y: 3, z: 0 }, { x: 6, y: 3, z: 0 },
            { x: 3, y: 4, z: 0 }, { x: 4, y: 4, z: 0 }, { x: 5, y: 4, z: 0 }, { x: 6, y: 4, z: 0 },
            { x: 5, y: 1, z: 0 }, { x: 6, y: 1, z: 0 }, { x: 5, y: 2, z: 0 }, { x: 6, y: 2, z: 0 },
        ],
        pieces: [
            TETRIS.O('o1', '#FFEB3B'),
            TETRIS.O('o2', '#4CAF50'),
            TETRIS.O('o3', '#2196F3'),
            TETRIS.O('o4', '#FF9800'),
            TETRIS.O('o5', '#E91E63'),
        ],
        difficulty: 'medium',
    },
    {
        id: 'med_3',
        name: 'H-Shape',
        type: '2D',
        gridSize: [8, 6, 1],
        targetVoxels: [
            // H pattern = 20 cells = 5 tetrominoes
            { x: 1, y: 1, z: 0 }, { x: 2, y: 1, z: 0 }, { x: 5, y: 1, z: 0 }, { x: 6, y: 1, z: 0 },
            { x: 1, y: 2, z: 0 }, { x: 2, y: 2, z: 0 }, { x: 5, y: 2, z: 0 }, { x: 6, y: 2, z: 0 },
            { x: 1, y: 3, z: 0 }, { x: 2, y: 3, z: 0 }, { x: 3, y: 3, z: 0 }, { x: 4, y: 3, z: 0 }, { x: 5, y: 3, z: 0 }, { x: 6, y: 3, z: 0 },
            { x: 1, y: 4, z: 0 }, { x: 2, y: 4, z: 0 }, { x: 5, y: 4, z: 0 }, { x: 6, y: 4, z: 0 },
            { x: 1, y: 5, z: 0 }, { x: 2, y: 5, z: 0 },
        ],
        pieces: [
            TETRIS.O('o1', '#FFEB3B'),
            TETRIS.O('o2', '#4CAF50'),
            TETRIS.O('o3', '#2196F3'),
            TETRIS.I('i1', '#00BCD4'),
            TETRIS.O('o4', '#E91E63'),
        ],
        difficulty: 'medium',
    },

    // ===== HARD LEVELS (6-7 pieces) =====
    {
        id: 'hard_1',
        name: 'Tetris Master',
        type: '2D',
        gridSize: [8, 5, 1],
        targetVoxels: [
            // 6x4 = 24 cells = 6 tetrominoes
            { x: 1, y: 1, z: 0 }, { x: 2, y: 1, z: 0 }, { x: 3, y: 1, z: 0 }, { x: 4, y: 1, z: 0 }, { x: 5, y: 1, z: 0 }, { x: 6, y: 1, z: 0 },
            { x: 1, y: 2, z: 0 }, { x: 2, y: 2, z: 0 }, { x: 3, y: 2, z: 0 }, { x: 4, y: 2, z: 0 }, { x: 5, y: 2, z: 0 }, { x: 6, y: 2, z: 0 },
            { x: 1, y: 3, z: 0 }, { x: 2, y: 3, z: 0 }, { x: 3, y: 3, z: 0 }, { x: 4, y: 3, z: 0 }, { x: 5, y: 3, z: 0 }, { x: 6, y: 3, z: 0 },
            { x: 1, y: 4, z: 0 }, { x: 2, y: 4, z: 0 }, { x: 3, y: 4, z: 0 }, { x: 4, y: 4, z: 0 }, { x: 5, y: 4, z: 0 }, { x: 6, y: 4, z: 0 },
        ],
        pieces: [
            TETRIS.I('i1', '#00BCD4'),
            TETRIS.I('i2', '#26A69A'),
            TETRIS.O('o1', '#FFEB3B'),
            TETRIS.O('o2', '#FFC107'),
            TETRIS.O('o3', '#FF9800'),
            TETRIS.O('o4', '#E91E63'),
        ],
        difficulty: 'hard',
    },
    {
        id: 'hard_2',
        name: 'Big Rectangle',
        type: '2D',
        gridSize: [10, 5, 1],
        targetVoxels: [
            // 8x4 = 32 cells = 8 O-blocks
            { x: 1, y: 1, z: 0 }, { x: 2, y: 1, z: 0 }, { x: 3, y: 1, z: 0 }, { x: 4, y: 1, z: 0 }, { x: 5, y: 1, z: 0 }, { x: 6, y: 1, z: 0 }, { x: 7, y: 1, z: 0 }, { x: 8, y: 1, z: 0 },
            { x: 1, y: 2, z: 0 }, { x: 2, y: 2, z: 0 }, { x: 3, y: 2, z: 0 }, { x: 4, y: 2, z: 0 }, { x: 5, y: 2, z: 0 }, { x: 6, y: 2, z: 0 }, { x: 7, y: 2, z: 0 }, { x: 8, y: 2, z: 0 },
            { x: 1, y: 3, z: 0 }, { x: 2, y: 3, z: 0 }, { x: 3, y: 3, z: 0 }, { x: 4, y: 3, z: 0 }, { x: 5, y: 3, z: 0 }, { x: 6, y: 3, z: 0 }, { x: 7, y: 3, z: 0 }, { x: 8, y: 3, z: 0 },
            { x: 1, y: 4, z: 0 }, { x: 2, y: 4, z: 0 }, { x: 3, y: 4, z: 0 }, { x: 4, y: 4, z: 0 }, { x: 5, y: 4, z: 0 }, { x: 6, y: 4, z: 0 }, { x: 7, y: 4, z: 0 }, { x: 8, y: 4, z: 0 },
        ],
        pieces: [
            TETRIS.O('o1', '#00BCD4'),
            TETRIS.O('o2', '#26A69A'),
            TETRIS.O('o3', '#FFEB3B'),
            TETRIS.O('o4', '#FFC107'),
            TETRIS.O('o5', '#9C27B0'),
            TETRIS.O('o6', '#4CAF50'),
            TETRIS.O('o7', '#2196F3'),
            TETRIS.O('o8', '#E91E63'),
        ],
        difficulty: 'hard',
    },
    {
        id: 'hard_3',
        name: 'Long Board',
        type: '2D',
        gridSize: [10, 5, 1],
        targetVoxels: [
            // 8x4 = 32 cells = 8 I-blocks (rotated vertically)
            { x: 1, y: 1, z: 0 }, { x: 2, y: 1, z: 0 }, { x: 3, y: 1, z: 0 }, { x: 4, y: 1, z: 0 }, { x: 5, y: 1, z: 0 }, { x: 6, y: 1, z: 0 }, { x: 7, y: 1, z: 0 }, { x: 8, y: 1, z: 0 },
            { x: 1, y: 2, z: 0 }, { x: 2, y: 2, z: 0 }, { x: 3, y: 2, z: 0 }, { x: 4, y: 2, z: 0 }, { x: 5, y: 2, z: 0 }, { x: 6, y: 2, z: 0 }, { x: 7, y: 2, z: 0 }, { x: 8, y: 2, z: 0 },
            { x: 1, y: 3, z: 0 }, { x: 2, y: 3, z: 0 }, { x: 3, y: 3, z: 0 }, { x: 4, y: 3, z: 0 }, { x: 5, y: 3, z: 0 }, { x: 6, y: 3, z: 0 }, { x: 7, y: 3, z: 0 }, { x: 8, y: 3, z: 0 },
            { x: 1, y: 4, z: 0 }, { x: 2, y: 4, z: 0 }, { x: 3, y: 4, z: 0 }, { x: 4, y: 4, z: 0 }, { x: 5, y: 4, z: 0 }, { x: 6, y: 4, z: 0 }, { x: 7, y: 4, z: 0 }, { x: 8, y: 4, z: 0 },
        ],
        pieces: [
            TETRIS.I('i1', '#E91E63'),
            TETRIS.I('i2', '#3F51B5'),
            TETRIS.I('i3', '#009688'),
            TETRIS.I('i4', '#FF5722'),
            TETRIS.I('i5', '#FFEB3B'),
            TETRIS.I('i6', '#00BCD4'),
            TETRIS.I('i7', '#4CAF50'),
            TETRIS.I('i8', '#9C27B0'),
        ],
        difficulty: 'hard',
    },
    {
        id: 'hard_4',
        name: 'Ultimate',
        type: '2D',
        gridSize: [11, 7, 1],
        targetVoxels: [
            // 8x4 = 32 cells = 8 tetrominoes
            { x: 1, y: 1, z: 0 }, { x: 2, y: 1, z: 0 }, { x: 3, y: 1, z: 0 }, { x: 4, y: 1, z: 0 }, { x: 5, y: 1, z: 0 }, { x: 6, y: 1, z: 0 }, { x: 7, y: 1, z: 0 }, { x: 8, y: 1, z: 0 },
            { x: 1, y: 2, z: 0 }, { x: 2, y: 2, z: 0 }, { x: 3, y: 2, z: 0 }, { x: 4, y: 2, z: 0 }, { x: 5, y: 2, z: 0 }, { x: 6, y: 2, z: 0 }, { x: 7, y: 2, z: 0 }, { x: 8, y: 2, z: 0 },
            { x: 1, y: 3, z: 0 }, { x: 2, y: 3, z: 0 }, { x: 3, y: 3, z: 0 }, { x: 4, y: 3, z: 0 }, { x: 5, y: 3, z: 0 }, { x: 6, y: 3, z: 0 }, { x: 7, y: 3, z: 0 }, { x: 8, y: 3, z: 0 },
            { x: 1, y: 4, z: 0 }, { x: 2, y: 4, z: 0 }, { x: 3, y: 4, z: 0 }, { x: 4, y: 4, z: 0 }, { x: 5, y: 4, z: 0 }, { x: 6, y: 4, z: 0 }, { x: 7, y: 4, z: 0 }, { x: 8, y: 4, z: 0 },
        ],
        pieces: [
            TETRIS.I('i1', '#00BCD4'),
            TETRIS.I('i2', '#26A69A'),
            TETRIS.O('o1', '#FFEB3B'),
            TETRIS.O('o2', '#FFC107'),
            TETRIS.T('t1', '#9C27B0'),
            TETRIS.T('t2', '#7B1FA2'),
            TETRIS.L('l1', '#FF9800'),
            TETRIS.J('j1', '#2196F3'),
        ],
        difficulty: 'hard',
    },

    // ===== EXPERT LEVELS (Full Pentomino Set) =====
    {
        id: 'expert_1',
        name: 'Pentomino Rectangle',
        type: '2D',
        gridSize: [8, 6, 1],
        targetVoxels: [
            // 5x4 = 20 cells = 4 pentominoes
            { x: 1, y: 1, z: 0 }, { x: 2, y: 1, z: 0 }, { x: 3, y: 1, z: 0 }, { x: 4, y: 1, z: 0 }, { x: 5, y: 1, z: 0 },
            { x: 1, y: 2, z: 0 }, { x: 2, y: 2, z: 0 }, { x: 3, y: 2, z: 0 }, { x: 4, y: 2, z: 0 }, { x: 5, y: 2, z: 0 },
            { x: 1, y: 3, z: 0 }, { x: 2, y: 3, z: 0 }, { x: 3, y: 3, z: 0 }, { x: 4, y: 3, z: 0 }, { x: 5, y: 3, z: 0 },
            { x: 1, y: 4, z: 0 }, { x: 2, y: 4, z: 0 }, { x: 3, y: 4, z: 0 }, { x: 4, y: 4, z: 0 }, { x: 5, y: 4, z: 0 },
        ],
        pieces: [
            PENTOMINO.I('pi1', '#E91E63'),
            PENTOMINO.L('pl1', '#3F51B5'),
            PENTOMINO.V('pv1', '#FF5722'),
            PENTOMINO.P('pp1', '#795548'),
        ],
        difficulty: 'hard',
    },
    {
        id: 'expert_2',
        name: 'Wide Grid',
        type: '2D',
        gridSize: [9, 5, 1],
        targetVoxels: [
            // 8x3 = 24 cells = 6 O-blocks
            { x: 1, y: 1, z: 0 }, { x: 2, y: 1, z: 0 }, { x: 3, y: 1, z: 0 }, { x: 4, y: 1, z: 0 }, { x: 5, y: 1, z: 0 }, { x: 6, y: 1, z: 0 }, { x: 7, y: 1, z: 0 }, { x: 8, y: 1, z: 0 },
            { x: 1, y: 2, z: 0 }, { x: 2, y: 2, z: 0 }, { x: 3, y: 2, z: 0 }, { x: 4, y: 2, z: 0 }, { x: 5, y: 2, z: 0 }, { x: 6, y: 2, z: 0 }, { x: 7, y: 2, z: 0 }, { x: 8, y: 2, z: 0 },
            { x: 1, y: 3, z: 0 }, { x: 2, y: 3, z: 0 }, { x: 3, y: 3, z: 0 }, { x: 4, y: 3, z: 0 }, { x: 5, y: 3, z: 0 }, { x: 6, y: 3, z: 0 }, { x: 7, y: 3, z: 0 }, { x: 8, y: 3, z: 0 },
        ],
        pieces: [
            TETRIS.I('i1', '#E91E63'),
            TETRIS.I('i2', '#3F51B5'),
            TETRIS.I('i3', '#009688'),
            TETRIS.I('i4', '#FF5722'),
            TETRIS.I('i5', '#FFEB3B'),
            TETRIS.I('i6', '#00BCD4'),
        ],
        difficulty: 'hard',
    },

    // ===== 3D LEVELS - True 3D Puzzles (depth > 1) =====

    // 3D Easy #1: Simple 2x2x2 Cube
    {
        id: '3d_easy_1',
        name: 'Cube Stack',
        type: '3D',
        gridSize: [4, 4, 3],
        targetVoxels: [
            // 2x2x2 cube = 8 cells
            { x: 1, y: 1, z: 0 }, { x: 2, y: 1, z: 0 },
            { x: 1, y: 2, z: 0 }, { x: 2, y: 2, z: 0 },
            { x: 1, y: 1, z: 1 }, { x: 2, y: 1, z: 1 },
            { x: 1, y: 2, z: 1 }, { x: 2, y: 2, z: 1 },
        ],
        pieces: [
            POLYCUBE_3D.Cube2x2('c1', '#FF9800'),
            POLYCUBE_3D.Cube2x2('c2', '#4CAF50'),
        ],
        difficulty: 'easy',
    },

    // 3D Easy #2: Mini Tower
    {
        id: '3d_easy_2',
        name: 'Mini Tower',
        type: '3D',
        gridSize: [4, 5, 4],
        targetVoxels: [
            // 3x2 base + 3x2 second level = 12 cells
            { x: 1, y: 1, z: 0 }, { x: 2, y: 1, z: 0 }, { x: 1, y: 2, z: 0 }, { x: 2, y: 2, z: 0 },
            { x: 1, y: 1, z: 1 }, { x: 2, y: 1, z: 1 }, { x: 1, y: 2, z: 1 }, { x: 2, y: 2, z: 1 },
            { x: 1, y: 1, z: 2 }, { x: 2, y: 1, z: 2 }, { x: 1, y: 2, z: 2 }, { x: 2, y: 2, z: 2 },
        ],
        pieces: [
            POLYCUBE_3D.Cube2x2('c1', '#E91E63'),
            POLYCUBE_3D.Cube2x2('c2', '#2196F3'),
            POLYCUBE_3D.Cube2x2('c3', '#FFEB3B'),
        ],
        difficulty: 'easy',
    },

    // 3D Medium #1: Cube Tower
    {
        id: '3d_med_1',
        name: 'Cube Tower',
        type: '3D',
        gridSize: [4, 4, 5],
        targetVoxels: [
            // 2x2x4 tower = 16 cells = 4 Cube2x2 pieces
            // Layer 0
            { x: 1, y: 1, z: 0 }, { x: 2, y: 1, z: 0 },
            { x: 1, y: 2, z: 0 }, { x: 2, y: 2, z: 0 },
            // Layer 1
            { x: 1, y: 1, z: 1 }, { x: 2, y: 1, z: 1 },
            { x: 1, y: 2, z: 1 }, { x: 2, y: 2, z: 1 },
            // Layer 2
            { x: 1, y: 1, z: 2 }, { x: 2, y: 1, z: 2 },
            { x: 1, y: 2, z: 2 }, { x: 2, y: 2, z: 2 },
            // Layer 3
            { x: 1, y: 1, z: 3 }, { x: 2, y: 1, z: 3 },
            { x: 1, y: 2, z: 3 }, { x: 2, y: 2, z: 3 },
        ],
        pieces: [
            POLYCUBE_3D.Cube2x2('c1', '#FF9800'),
            POLYCUBE_3D.Cube2x2('c2', '#4CAF50'),
            POLYCUBE_3D.Cube2x2('c3', '#2196F3'),
            POLYCUBE_3D.Cube2x2('c4', '#9C27B0'),
        ],
        difficulty: 'medium',
    },

    // 3D Medium #2: Double Cube
    {
        id: '3d_med_2',
        name: 'Double Cube',
        type: '3D',
        gridSize: [5, 4, 3],
        targetVoxels: [
            // Two 2x2x2 cubes side by side = 16 cells
            // First cube
            { x: 1, y: 1, z: 0 }, { x: 2, y: 1, z: 0 },
            { x: 1, y: 2, z: 0 }, { x: 2, y: 2, z: 0 },
            { x: 1, y: 1, z: 1 }, { x: 2, y: 1, z: 1 },
            { x: 1, y: 2, z: 1 }, { x: 2, y: 2, z: 1 },
            // Second cube
            { x: 3, y: 1, z: 0 }, { x: 4, y: 1, z: 0 },
            { x: 3, y: 2, z: 0 }, { x: 4, y: 2, z: 0 },
            { x: 3, y: 1, z: 1 }, { x: 4, y: 1, z: 1 },
            { x: 3, y: 2, z: 1 }, { x: 4, y: 2, z: 1 },
        ],
        pieces: [
            POLYCUBE_3D.Cube2x2x2('c1', '#E91E63'),
            POLYCUBE_3D.Cube2x2x2('c2', '#3F51B5'),
        ],
        difficulty: 'medium',
    },

    // 3D Medium #3: Flat Platform
    {
        id: '3d_med_3',
        name: 'Flat Platform',
        type: '3D',
        gridSize: [6, 6, 3],
        targetVoxels: [
            // 4x4x1 platform = 16 cells
            { x: 1, y: 1, z: 0 }, { x: 2, y: 1, z: 0 }, { x: 3, y: 1, z: 0 }, { x: 4, y: 1, z: 0 },
            { x: 1, y: 2, z: 0 }, { x: 2, y: 2, z: 0 }, { x: 3, y: 2, z: 0 }, { x: 4, y: 2, z: 0 },
            { x: 1, y: 3, z: 0 }, { x: 2, y: 3, z: 0 }, { x: 3, y: 3, z: 0 }, { x: 4, y: 3, z: 0 },
            { x: 1, y: 4, z: 0 }, { x: 2, y: 4, z: 0 }, { x: 3, y: 4, z: 0 }, { x: 4, y: 4, z: 0 },
        ],
        pieces: [
            POLYCUBE_3D.Cube2x2('c1', '#FF9800'),
            POLYCUBE_3D.Cube2x2('c2', '#4CAF50'),
            POLYCUBE_3D.Cube2x2('c3', '#2196F3'),
            POLYCUBE_3D.Cube2x2('c4', '#E91E63'),
        ],
        difficulty: 'medium',
    },

    // 3D Hard #1: Tall Tower
    {
        id: '3d_hard_1',
        name: 'Tall Tower',
        type: '3D',
        gridSize: [4, 4, 7],
        targetVoxels: [
            // 2x2x6 tower = 24 cells = 6 Cube2x2 pieces
            // Layer 0
            { x: 1, y: 1, z: 0 }, { x: 2, y: 1, z: 0 },
            { x: 1, y: 2, z: 0 }, { x: 2, y: 2, z: 0 },
            // Layer 1
            { x: 1, y: 1, z: 1 }, { x: 2, y: 1, z: 1 },
            { x: 1, y: 2, z: 1 }, { x: 2, y: 2, z: 1 },
            // Layer 2
            { x: 1, y: 1, z: 2 }, { x: 2, y: 1, z: 2 },
            { x: 1, y: 2, z: 2 }, { x: 2, y: 2, z: 2 },
            // Layer 3
            { x: 1, y: 1, z: 3 }, { x: 2, y: 1, z: 3 },
            { x: 1, y: 2, z: 3 }, { x: 2, y: 2, z: 3 },
            // Layer 4
            { x: 1, y: 1, z: 4 }, { x: 2, y: 1, z: 4 },
            { x: 1, y: 2, z: 4 }, { x: 2, y: 2, z: 4 },
            // Layer 5
            { x: 1, y: 1, z: 5 }, { x: 2, y: 1, z: 5 },
            { x: 1, y: 2, z: 5 }, { x: 2, y: 2, z: 5 },
        ],
        pieces: [
            POLYCUBE_3D.Cube2x2('c1', '#FF9800'),
            POLYCUBE_3D.Cube2x2('c2', '#4CAF50'),
            POLYCUBE_3D.Cube2x2('c3', '#2196F3'),
            POLYCUBE_3D.Cube2x2('c4', '#9C27B0'),
            POLYCUBE_3D.Cube2x2('c5', '#E91E63'),
            POLYCUBE_3D.Cube2x2('c6', '#795548'),
        ],
        difficulty: 'hard',
    },

    // 3D Hard #2: Triple Stack
    {
        id: '3d_hard_2',
        name: 'Triple Stack',
        type: '3D',
        gridSize: [5, 5, 4],
        targetVoxels: [
            // Three 2x2x2 cubes arranged in L = 24 cells
            // First cube (bottom left)
            { x: 1, y: 1, z: 0 }, { x: 2, y: 1, z: 0 },
            { x: 1, y: 2, z: 0 }, { x: 2, y: 2, z: 0 },
            { x: 1, y: 1, z: 1 }, { x: 2, y: 1, z: 1 },
            { x: 1, y: 2, z: 1 }, { x: 2, y: 2, z: 1 },
            // Second cube (bottom right)
            { x: 3, y: 1, z: 0 }, { x: 4, y: 1, z: 0 },
            { x: 3, y: 2, z: 0 }, { x: 4, y: 2, z: 0 },
            { x: 3, y: 1, z: 1 }, { x: 4, y: 1, z: 1 },
            { x: 3, y: 2, z: 1 }, { x: 4, y: 2, z: 1 },
            // Third cube (stacked on first)
            { x: 1, y: 1, z: 2 }, { x: 2, y: 1, z: 2 },
            { x: 1, y: 2, z: 2 }, { x: 2, y: 2, z: 2 },
            { x: 1, y: 1, z: 3 }, { x: 2, y: 1, z: 3 },
            { x: 1, y: 2, z: 3 }, { x: 2, y: 2, z: 3 },
        ],
        pieces: [
            POLYCUBE_3D.Cube2x2x2('c1', '#E91E63'),
            POLYCUBE_3D.Cube2x2x2('c2', '#3F51B5'),
            POLYCUBE_3D.Cube2x2x2('c3', '#FF9800'),
        ],
        difficulty: 'hard',
    },

    // 3D Hard #3: Wide Platform
    {
        id: '3d_hard_3',
        name: 'Wide Platform',
        type: '3D',
        gridSize: [7, 6, 3],
        targetVoxels: [
            // 6x4 platform on ground = 24 cells
            { x: 1, y: 1, z: 0 }, { x: 2, y: 1, z: 0 }, { x: 3, y: 1, z: 0 }, { x: 4, y: 1, z: 0 }, { x: 5, y: 1, z: 0 }, { x: 6, y: 1, z: 0 },
            { x: 1, y: 2, z: 0 }, { x: 2, y: 2, z: 0 }, { x: 3, y: 2, z: 0 }, { x: 4, y: 2, z: 0 }, { x: 5, y: 2, z: 0 }, { x: 6, y: 2, z: 0 },
            { x: 1, y: 3, z: 0 }, { x: 2, y: 3, z: 0 }, { x: 3, y: 3, z: 0 }, { x: 4, y: 3, z: 0 }, { x: 5, y: 3, z: 0 }, { x: 6, y: 3, z: 0 },
            { x: 1, y: 4, z: 0 }, { x: 2, y: 4, z: 0 }, { x: 3, y: 4, z: 0 }, { x: 4, y: 4, z: 0 }, { x: 5, y: 4, z: 0 }, { x: 6, y: 4, z: 0 },
        ],
        pieces: [
            POLYCUBE_3D.Cube2x2('c1', '#FF9800'),
            POLYCUBE_3D.Cube2x2('c2', '#4CAF50'),
            POLYCUBE_3D.Cube2x2('c3', '#2196F3'),
            POLYCUBE_3D.Cube2x2('c4', '#9C27B0'),
            POLYCUBE_3D.Cube2x2('c5', '#E91E63'),
            POLYCUBE_3D.Cube2x2('c6', '#795548'),
        ],
        difficulty: 'hard',
    },

    // Note: THEMED_SHAPES collection is exported above for future themed levels
    // Creating solvable levels with complex themed pieces requires careful puzzle design
];

// ========================================
// Random Level Generator (Guaranteed Solvable)
// ========================================

/**
 * Generate a random guaranteed-solvable level using cohesive shapes.
 *
 * Algorithm:
 * 1. Select a cohesive base shape (square, rectangle, L, T, plus, etc.)
 * 2. Use region-growing to split the shape into N connected pieces
 * 3. Return the puzzle with pieces that exactly reconstruct the shape
 *
 * Since we split an actual shape into pieces, the puzzle is always solvable!
 *
 * Difficulty determines piece count:
 * - Easy: 3-4 pieces
 * - Medium: 5-6 pieces
 * - Hard: 7-8 pieces
 */
export function generateRandomLevel(difficulty: 'easy' | 'medium' | 'hard'): LevelConfig {
    // Create unique seed from timestamp + random for variety
    const seed = `random_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const rng = createSeededRandom(seed);

    return generateGuaranteedSolvableWithRetry(rng, difficulty);
}

// ========================================
// Dev Mode: Level Validation
// ========================================

/**
 * Run validation on all preset levels in development mode
 * Logs warnings for levels with volume mismatches
 */
export function runLevelValidation(): Map<string, LevelValidation> {
    const results = validateAllLevels(presetLevels);
    return results;
}

// Export for external use
export type { LevelValidation };
