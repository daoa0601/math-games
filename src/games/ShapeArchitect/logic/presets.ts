// ========================================
// Shape Architect - Preset Levels with Tetris Pieces
// Increased difficulty: Easy requires 4-5 pieces minimum
// ========================================

import type { LevelConfig, Piece } from './types';
import { validateAllLevels, type LevelValidation } from './engine';

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
        gridSize: [7, 6, 1],
        targetVoxels: [
            // 20 cells = 5 pieces
            // Top bar
            { x: 1, y: 1, z: 0 }, { x: 2, y: 1, z: 0 }, { x: 3, y: 1, z: 0 }, { x: 4, y: 1, z: 0 }, { x: 5, y: 1, z: 0 },
            { x: 1, y: 2, z: 0 }, { x: 2, y: 2, z: 0 }, { x: 3, y: 2, z: 0 }, { x: 4, y: 2, z: 0 }, { x: 5, y: 2, z: 0 },
            // Stem
            { x: 2, y: 3, z: 0 }, { x: 3, y: 3, z: 0 }, { x: 4, y: 3, z: 0 },
            { x: 2, y: 4, z: 0 }, { x: 3, y: 4, z: 0 }, { x: 4, y: 4, z: 0 },
            { x: 2, y: 5, z: 0 }, { x: 3, y: 5, z: 0 }, { x: 4, y: 5, z: 0 },
            { x: 3, y: 6, z: 0 },
        ],
        pieces: [
            TETRIS.I('i1', '#00BCD4'),
            TETRIS.T('t1', '#9C27B0'),
            TETRIS.T('t2', '#E91E63'),
            TETRIS.L('l1', '#FF9800'),
            TETRIS.J('j1', '#2196F3'),
        ],
        difficulty: 'easy',
    },
    {
        id: 'easy_4',
        name: 'Rectangle',
        type: '2D',
        gridSize: [7, 5, 1],
        targetVoxels: [
            // 5x4 = 20 cells = 5 pieces
            { x: 1, y: 1, z: 0 }, { x: 2, y: 1, z: 0 }, { x: 3, y: 1, z: 0 }, { x: 4, y: 1, z: 0 }, { x: 5, y: 1, z: 0 },
            { x: 1, y: 2, z: 0 }, { x: 2, y: 2, z: 0 }, { x: 3, y: 2, z: 0 }, { x: 4, y: 2, z: 0 }, { x: 5, y: 2, z: 0 },
            { x: 1, y: 3, z: 0 }, { x: 2, y: 3, z: 0 }, { x: 3, y: 3, z: 0 }, { x: 4, y: 3, z: 0 }, { x: 5, y: 3, z: 0 },
            { x: 1, y: 4, z: 0 }, { x: 2, y: 4, z: 0 }, { x: 3, y: 4, z: 0 }, { x: 4, y: 4, z: 0 }, { x: 5, y: 4, z: 0 },
        ],
        pieces: [
            TETRIS.I('i1', '#00BCD4'),
            TETRIS.O('o1', '#FFEB3B'),
            TETRIS.T('t1', '#9C27B0'),
            TETRIS.L('l1', '#FF9800'),
            TETRIS.J('j1', '#2196F3'),
        ],
        difficulty: 'easy',
    },

    // ===== MEDIUM LEVELS (5-6 pieces) =====
    {
        id: 'med_1',
        name: 'Plus Sign',
        type: '2D',
        gridSize: [7, 7, 1],
        targetVoxels: [
            // Cross shape = 20 cells
            { x: 3, y: 1, z: 0 },
            { x: 2, y: 2, z: 0 }, { x: 3, y: 2, z: 0 }, { x: 4, y: 2, z: 0 },
            { x: 1, y: 3, z: 0 }, { x: 2, y: 3, z: 0 }, { x: 3, y: 3, z: 0 }, { x: 4, y: 3, z: 0 }, { x: 5, y: 3, z: 0 },
            { x: 1, y: 4, z: 0 }, { x: 2, y: 4, z: 0 }, { x: 3, y: 4, z: 0 }, { x: 4, y: 4, z: 0 }, { x: 5, y: 4, z: 0 },
            { x: 2, y: 5, z: 0 }, { x: 3, y: 5, z: 0 }, { x: 4, y: 5, z: 0 },
            { x: 3, y: 6, z: 0 },
        ],
        pieces: [
            TETRIS.T('t1', '#9C27B0'),
            TETRIS.T('t2', '#E91E63'),
            TETRIS.I('i1', '#00BCD4'),
            TETRIS.L('l1', '#FF9800'),
            TETRIS.J('j1', '#2196F3'),
        ],
        difficulty: 'medium',
    },
    {
        id: 'med_2',
        name: 'Staircase',
        type: '2D',
        gridSize: [8, 6, 1],
        targetVoxels: [
            // Stair pattern = 24 cells = 6 pieces
            { x: 1, y: 1, z: 0 }, { x: 2, y: 1, z: 0 },
            { x: 1, y: 2, z: 0 }, { x: 2, y: 2, z: 0 }, { x: 3, y: 2, z: 0 }, { x: 4, y: 2, z: 0 },
            { x: 3, y: 3, z: 0 }, { x: 4, y: 3, z: 0 }, { x: 5, y: 3, z: 0 }, { x: 6, y: 3, z: 0 },
            { x: 1, y: 4, z: 0 }, { x: 2, y: 4, z: 0 }, { x: 5, y: 4, z: 0 }, { x: 6, y: 4, z: 0 },
            { x: 1, y: 5, z: 0 }, { x: 2, y: 5, z: 0 }, { x: 3, y: 5, z: 0 }, { x: 4, y: 5, z: 0 }, { x: 5, y: 5, z: 0 }, { x: 6, y: 5, z: 0 },
        ],
        pieces: [
            TETRIS.O('o1', '#FFEB3B'),
            TETRIS.O('o2', '#4CAF50'),
            TETRIS.I('i1', '#00BCD4'),
            TETRIS.S('s1', '#4CAF50'),
            TETRIS.Z('z1', '#F44336'),
        ],
        difficulty: 'medium',
    },
    {
        id: 'med_3',
        name: 'H-Shape',
        type: '2D',
        gridSize: [7, 7, 1],
        targetVoxels: [
            // H pattern = 24 cells = 6 pieces
            { x: 1, y: 1, z: 0 }, { x: 2, y: 1, z: 0 }, { x: 5, y: 1, z: 0 }, { x: 6, y: 1, z: 0 },
            { x: 1, y: 2, z: 0 }, { x: 2, y: 2, z: 0 }, { x: 5, y: 2, z: 0 }, { x: 6, y: 2, z: 0 },
            { x: 1, y: 3, z: 0 }, { x: 2, y: 3, z: 0 }, { x: 3, y: 3, z: 0 }, { x: 4, y: 3, z: 0 }, { x: 5, y: 3, z: 0 }, { x: 6, y: 3, z: 0 },
            { x: 1, y: 4, z: 0 }, { x: 2, y: 4, z: 0 }, { x: 3, y: 4, z: 0 }, { x: 4, y: 4, z: 0 }, { x: 5, y: 4, z: 0 }, { x: 6, y: 4, z: 0 },
            { x: 1, y: 5, z: 0 }, { x: 2, y: 5, z: 0 }, { x: 5, y: 5, z: 0 }, { x: 6, y: 5, z: 0 },
        ],
        pieces: [
            TETRIS.O('o1', '#FFEB3B'),
            TETRIS.O('o2', '#4CAF50'),
            TETRIS.O('o3', '#2196F3'),
            TETRIS.I('i1', '#00BCD4'),
            TETRIS.I('i2', '#9C27B0'),
            TETRIS.O('o4', '#E91E63'),
        ],
        difficulty: 'medium',
    },

    // ===== HARD LEVELS (6-7 pieces) =====
    {
        id: 'hard_1',
        name: 'Tetris Master',
        type: '2D',
        gridSize: [8, 7, 1],
        targetVoxels: [
            // 5x5 = 25 cells (need mixed pieces)
            { x: 1, y: 1, z: 0 }, { x: 2, y: 1, z: 0 }, { x: 3, y: 1, z: 0 }, { x: 4, y: 1, z: 0 }, { x: 5, y: 1, z: 0 }, { x: 6, y: 1, z: 0 },
            { x: 1, y: 2, z: 0 }, { x: 2, y: 2, z: 0 }, { x: 3, y: 2, z: 0 }, { x: 4, y: 2, z: 0 }, { x: 5, y: 2, z: 0 }, { x: 6, y: 2, z: 0 },
            { x: 1, y: 3, z: 0 }, { x: 2, y: 3, z: 0 }, { x: 3, y: 3, z: 0 }, { x: 4, y: 3, z: 0 }, { x: 5, y: 3, z: 0 }, { x: 6, y: 3, z: 0 },
            { x: 1, y: 4, z: 0 }, { x: 2, y: 4, z: 0 }, { x: 3, y: 4, z: 0 }, { x: 4, y: 4, z: 0 }, { x: 5, y: 4, z: 0 }, { x: 6, y: 4, z: 0 },
        ],
        pieces: [
            TETRIS.I('i1', '#00BCD4'),
            TETRIS.O('o1', '#FFEB3B'),
            TETRIS.T('t1', '#9C27B0'),
            TETRIS.S('s1', '#4CAF50'),
            TETRIS.L('l1', '#FF9800'),
            TETRIS.J('j1', '#2196F3'),
        ],
        difficulty: 'hard',
    },
    {
        id: 'hard_2',
        name: 'All Seven',
        type: '2D',
        gridSize: [10, 6, 1],
        targetVoxels: [
            // 7x4 = 28 cells = all 7 tetrominoes
            { x: 1, y: 1, z: 0 }, { x: 2, y: 1, z: 0 }, { x: 3, y: 1, z: 0 }, { x: 4, y: 1, z: 0 }, { x: 5, y: 1, z: 0 }, { x: 6, y: 1, z: 0 }, { x: 7, y: 1, z: 0 },
            { x: 1, y: 2, z: 0 }, { x: 2, y: 2, z: 0 }, { x: 3, y: 2, z: 0 }, { x: 4, y: 2, z: 0 }, { x: 5, y: 2, z: 0 }, { x: 6, y: 2, z: 0 }, { x: 7, y: 2, z: 0 },
            { x: 1, y: 3, z: 0 }, { x: 2, y: 3, z: 0 }, { x: 3, y: 3, z: 0 }, { x: 4, y: 3, z: 0 }, { x: 5, y: 3, z: 0 }, { x: 6, y: 3, z: 0 }, { x: 7, y: 3, z: 0 },
            { x: 1, y: 4, z: 0 }, { x: 2, y: 4, z: 0 }, { x: 3, y: 4, z: 0 }, { x: 4, y: 4, z: 0 }, { x: 5, y: 4, z: 0 }, { x: 6, y: 4, z: 0 }, { x: 7, y: 4, z: 0 },
        ],
        pieces: [
            TETRIS.I('i1', '#00BCD4'),
            TETRIS.O('o1', '#FFEB3B'),
            TETRIS.T('t1', '#9C27B0'),
            TETRIS.S('s1', '#4CAF50'),
            TETRIS.Z('z1', '#F44336'),
            TETRIS.J('j1', '#2196F3'),
            TETRIS.L('l1', '#FF9800'),
        ],
        difficulty: 'hard',
    },
    {
        id: 'hard_3',
        name: 'Pentomino Challenge',
        type: '2D',
        gridSize: [9, 6, 1],
        targetVoxels: [
            // 5x5 = 25 cells (5 pentominoes)
            { x: 1, y: 1, z: 0 }, { x: 2, y: 1, z: 0 }, { x: 3, y: 1, z: 0 }, { x: 4, y: 1, z: 0 }, { x: 5, y: 1, z: 0 },
            { x: 1, y: 2, z: 0 }, { x: 2, y: 2, z: 0 }, { x: 3, y: 2, z: 0 }, { x: 4, y: 2, z: 0 }, { x: 5, y: 2, z: 0 },
            { x: 1, y: 3, z: 0 }, { x: 2, y: 3, z: 0 }, { x: 3, y: 3, z: 0 }, { x: 4, y: 3, z: 0 }, { x: 5, y: 3, z: 0 },
            { x: 1, y: 4, z: 0 }, { x: 2, y: 4, z: 0 }, { x: 3, y: 4, z: 0 }, { x: 4, y: 4, z: 0 }, { x: 5, y: 4, z: 0 },
            { x: 1, y: 5, z: 0 }, { x: 2, y: 5, z: 0 }, { x: 3, y: 5, z: 0 }, { x: 4, y: 5, z: 0 }, { x: 5, y: 5, z: 0 },
        ],
        pieces: [
            PENTOMINO.F('f1', '#E91E63'),
            PENTOMINO.P('p1', '#3F51B5'),
            PENTOMINO.U('u1', '#009688'),
            PENTOMINO.W('w1', '#FF5722'),
            TETRIS.I('i1', '#00BCD4'),
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
        name: 'Pentomino 5x6',
        type: '2D',
        gridSize: [8, 8, 1],
        targetVoxels: [
            // 5x6 = 30 cells (6 pentominoes)
            { x: 1, y: 1, z: 0 }, { x: 2, y: 1, z: 0 }, { x: 3, y: 1, z: 0 }, { x: 4, y: 1, z: 0 }, { x: 5, y: 1, z: 0 }, { x: 6, y: 1, z: 0 },
            { x: 1, y: 2, z: 0 }, { x: 2, y: 2, z: 0 }, { x: 3, y: 2, z: 0 }, { x: 4, y: 2, z: 0 }, { x: 5, y: 2, z: 0 }, { x: 6, y: 2, z: 0 },
            { x: 1, y: 3, z: 0 }, { x: 2, y: 3, z: 0 }, { x: 3, y: 3, z: 0 }, { x: 4, y: 3, z: 0 }, { x: 5, y: 3, z: 0 }, { x: 6, y: 3, z: 0 },
            { x: 1, y: 4, z: 0 }, { x: 2, y: 4, z: 0 }, { x: 3, y: 4, z: 0 }, { x: 4, y: 4, z: 0 }, { x: 5, y: 4, z: 0 }, { x: 6, y: 4, z: 0 },
            { x: 1, y: 5, z: 0 }, { x: 2, y: 5, z: 0 }, { x: 3, y: 5, z: 0 }, { x: 4, y: 5, z: 0 }, { x: 5, y: 5, z: 0 }, { x: 6, y: 5, z: 0 },
        ],
        pieces: [
            PENTOMINO.I('pi1', '#E91E63'),
            PENTOMINO.L('pl1', '#3F51B5'),
            PENTOMINO.T('pt1', '#009688'),
            PENTOMINO.V('pv1', '#FF5722'),
            PENTOMINO.N('pn1', '#795548'),
            PENTOMINO.Y('py1', '#607D8B'),
        ],
        difficulty: 'hard',
    },
    {
        id: 'expert_2',
        name: 'Pentomino X-Cross',
        type: '2D',
        gridSize: [9, 9, 1],
        targetVoxels: [
            // Cross shape using 5 pentominoes = 25 cells
            { x: 3, y: 1, z: 0 }, { x: 4, y: 1, z: 0 }, { x: 5, y: 1, z: 0 },
            { x: 3, y: 2, z: 0 }, { x: 4, y: 2, z: 0 }, { x: 5, y: 2, z: 0 },
            { x: 1, y: 3, z: 0 }, { x: 2, y: 3, z: 0 }, { x: 3, y: 3, z: 0 }, { x: 4, y: 3, z: 0 }, { x: 5, y: 3, z: 0 }, { x: 6, y: 3, z: 0 }, { x: 7, y: 3, z: 0 },
            { x: 1, y: 4, z: 0 }, { x: 2, y: 4, z: 0 }, { x: 3, y: 4, z: 0 }, { x: 4, y: 4, z: 0 }, { x: 5, y: 4, z: 0 }, { x: 6, y: 4, z: 0 }, { x: 7, y: 4, z: 0 },
            { x: 3, y: 5, z: 0 }, { x: 4, y: 5, z: 0 }, { x: 5, y: 5, z: 0 },
            { x: 3, y: 6, z: 0 }, { x: 4, y: 6, z: 0 }, { x: 5, y: 6, z: 0 },
        ],
        pieces: [
            PENTOMINO.X('px1', '#E91E63'),
            PENTOMINO.F('pf1', '#3F51B5'),
            PENTOMINO.Z('pz1', '#009688'),
            PENTOMINO.W('pw1', '#FF5722'),
            PENTOMINO.U('pu1', '#795548'),
            TETRIS.I('ti1', '#00BCD4'),
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

    // 3D Medium #1: L-Corner 3D
    {
        id: '3d_med_1',
        name: 'L-Corner 3D',
        type: '3D',
        gridSize: [5, 5, 4],
        targetVoxels: [
            // 3D L-shape = 16 cells
            // Base layer
            { x: 1, y: 1, z: 0 }, { x: 2, y: 1, z: 0 }, { x: 3, y: 1, z: 0 },
            { x: 1, y: 2, z: 0 }, { x: 1, y: 3, z: 0 },
            // Second layer
            { x: 1, y: 1, z: 1 }, { x: 2, y: 1, z: 1 }, { x: 3, y: 1, z: 1 },
            { x: 1, y: 2, z: 1 }, { x: 1, y: 3, z: 1 },
            // Third layer
            { x: 1, y: 1, z: 2 }, { x: 2, y: 1, z: 2 },
            { x: 1, y: 2, z: 2 }, { x: 1, y: 3, z: 2 },
            // Top
            { x: 1, y: 1, z: 3 }, { x: 1, y: 2, z: 3 },
        ],
        pieces: [
            POLYCUBE_3D.Corner3D('c1', '#00BCD4'),
            POLYCUBE_3D.Corner3D('c2', '#9C27B0'),
            POLYCUBE_3D.L3D('l1', '#FF5722'),
            POLYCUBE_3D.T3D('t1', '#4CAF50'),
        ],
        difficulty: 'medium',
    },

    // 3D Medium #2: Cross Platform
    {
        id: '3d_med_2',
        name: 'Cross Platform',
        type: '3D',
        gridSize: [6, 5, 3],
        targetVoxels: [
            // Cross on base layer
            { x: 2, y: 1, z: 0 }, { x: 3, y: 1, z: 0 },
            { x: 1, y: 2, z: 0 }, { x: 2, y: 2, z: 0 }, { x: 3, y: 2, z: 0 }, { x: 4, y: 2, z: 0 },
            { x: 2, y: 3, z: 0 }, { x: 3, y: 3, z: 0 },
            // Cross on second layer
            { x: 2, y: 1, z: 1 }, { x: 3, y: 1, z: 1 },
            { x: 1, y: 2, z: 1 }, { x: 2, y: 2, z: 1 }, { x: 3, y: 2, z: 1 }, { x: 4, y: 2, z: 1 },
            { x: 2, y: 3, z: 1 }, { x: 3, y: 3, z: 1 },
            // Center column on top
            { x: 2, y: 2, z: 2 }, { x: 3, y: 2, z: 2 },
        ],
        pieces: [
            POLYCUBE_3D.T3D('t1', '#E91E63'),
            POLYCUBE_3D.T3D('t2', '#3F51B5'),
            POLYCUBE_3D.Cube2x2('c1', '#FF9800'),
            POLYCUBE_3D.Step3D('s1', '#4CAF50'),
            TETRIS.O('o1', '#00BCD4'),
        ],
        difficulty: 'medium',
    },

    // 3D Medium #3: Stairs 3D
    {
        id: '3d_med_3',
        name: 'Stairs 3D',
        type: '3D',
        gridSize: [6, 6, 5],
        targetVoxels: [
            // Staircase going up: 4 steps, each 2 cells wide
            // Step 1 (z=0)
            { x: 1, y: 1, z: 0 }, { x: 2, y: 1, z: 0 }, { x: 1, y: 2, z: 0 }, { x: 2, y: 2, z: 0 },
            // Step 2 (z=0, z=1)
            { x: 2, y: 2, z: 1 }, { x: 3, y: 2, z: 1 }, { x: 2, y: 3, z: 1 }, { x: 3, y: 3, z: 1 },
            { x: 2, y: 2, z: 0 }, { x: 3, y: 2, z: 0 }, { x: 2, y: 3, z: 0 }, { x: 3, y: 3, z: 0 },
            // Step 3 (z=0-2)
            { x: 3, y: 3, z: 2 }, { x: 4, y: 3, z: 2 }, { x: 3, y: 4, z: 2 }, { x: 4, y: 4, z: 2 },
            // Step 4 (z=3)
            { x: 4, y: 4, z: 3 }, { x: 5, y: 4, z: 3 }, { x: 4, y: 5, z: 3 }, { x: 5, y: 5, z: 3 },
        ],
        pieces: [
            POLYCUBE_3D.Cube2x2('c1', '#FF9800'),
            POLYCUBE_3D.Cube2x2('c2', '#4CAF50'),
            POLYCUBE_3D.Cube2x2('c3', '#2196F3'),
            POLYCUBE_3D.Cube2x2('c4', '#9C27B0'),
            POLYCUBE_3D.Cube2x2('c5', '#E91E63'),
        ],
        difficulty: 'medium',
    },

    // 3D Hard #1: Fortress
    {
        id: '3d_hard_1',
        name: 'Fortress',
        type: '3D',
        gridSize: [6, 6, 4],
        targetVoxels: [
            // Hollow square base with walls going up
            // Base layer (3x3 hollow)
            { x: 1, y: 1, z: 0 }, { x: 2, y: 1, z: 0 }, { x: 3, y: 1, z: 0 }, { x: 4, y: 1, z: 0 },
            { x: 1, y: 2, z: 0 }, { x: 4, y: 2, z: 0 },
            { x: 1, y: 3, z: 0 }, { x: 4, y: 3, z: 0 },
            { x: 1, y: 4, z: 0 }, { x: 2, y: 4, z: 0 }, { x: 3, y: 4, z: 0 }, { x: 4, y: 4, z: 0 },
            // Second layer (walls)
            { x: 1, y: 1, z: 1 }, { x: 4, y: 1, z: 1 },
            { x: 1, y: 4, z: 1 }, { x: 4, y: 4, z: 1 },
            // Corner towers
            { x: 1, y: 1, z: 2 }, { x: 4, y: 1, z: 2 },
            { x: 1, y: 4, z: 2 }, { x: 4, y: 4, z: 2 },
            // Tower tops
            { x: 1, y: 1, z: 3 }, { x: 4, y: 1, z: 3 },
            { x: 1, y: 4, z: 3 }, { x: 4, y: 4, z: 3 },
        ],
        pieces: [
            POLYCUBE_3D.Tower4('t1', '#795548'),
            POLYCUBE_3D.Tower4('t2', '#795548'),
            POLYCUBE_3D.Tower4('t3', '#795548'),
            POLYCUBE_3D.Tower4('t4', '#795548'),
            TETRIS.I('i1', '#9E9E9E'),
            TETRIS.I('i2', '#9E9E9E'),
        ],
        difficulty: 'hard',
    },

    // 3D Hard #2: Spiral Tower
    {
        id: '3d_hard_2',
        name: 'Spiral Tower',
        type: '3D',
        gridSize: [5, 5, 6],
        targetVoxels: [
            // Spiral going up
            // Layer 0
            { x: 1, y: 1, z: 0 }, { x: 2, y: 1, z: 0 }, { x: 3, y: 1, z: 0 },
            { x: 3, y: 2, z: 0 }, { x: 3, y: 3, z: 0 },
            // Layer 1
            { x: 3, y: 3, z: 1 }, { x: 2, y: 3, z: 1 }, { x: 1, y: 3, z: 1 },
            { x: 1, y: 2, z: 1 },
            // Layer 2
            { x: 1, y: 1, z: 2 }, { x: 2, y: 1, z: 2 }, { x: 3, y: 1, z: 2 },
            { x: 3, y: 2, z: 2 },
            // Layer 3
            { x: 3, y: 3, z: 3 }, { x: 2, y: 3, z: 3 }, { x: 1, y: 3, z: 3 },
            // Layer 4
            { x: 1, y: 2, z: 4 }, { x: 1, y: 1, z: 4 }, { x: 2, y: 1, z: 4 },
            // Top
            { x: 2, y: 2, z: 5 },
        ],
        pieces: [
            POLYCUBE_3D.L3D('l1', '#E91E63'),
            POLYCUBE_3D.L3D('l2', '#3F51B5'),
            POLYCUBE_3D.L3D('l3', '#009688'),
            POLYCUBE_3D.L3D('l4', '#FF5722'),
            POLYCUBE_3D.Corner3D('c1', '#FFEB3B'),
        ],
        difficulty: 'hard',
    },

    // 3D Hard #3: Pyramid
    {
        id: '3d_hard_3',
        name: 'Pyramid',
        type: '3D',
        gridSize: [6, 6, 4],
        targetVoxels: [
            // Base layer (4x4)
            { x: 1, y: 1, z: 0 }, { x: 2, y: 1, z: 0 }, { x: 3, y: 1, z: 0 }, { x: 4, y: 1, z: 0 },
            { x: 1, y: 2, z: 0 }, { x: 2, y: 2, z: 0 }, { x: 3, y: 2, z: 0 }, { x: 4, y: 2, z: 0 },
            { x: 1, y: 3, z: 0 }, { x: 2, y: 3, z: 0 }, { x: 3, y: 3, z: 0 }, { x: 4, y: 3, z: 0 },
            { x: 1, y: 4, z: 0 }, { x: 2, y: 4, z: 0 }, { x: 3, y: 4, z: 0 }, { x: 4, y: 4, z: 0 },
            // Second layer (3x3, centered)
            { x: 1, y: 1, z: 1 }, { x: 2, y: 1, z: 1 }, { x: 3, y: 1, z: 1 },
            { x: 1, y: 2, z: 1 }, { x: 2, y: 2, z: 1 }, { x: 3, y: 2, z: 1 },
            { x: 1, y: 3, z: 1 }, { x: 2, y: 3, z: 1 }, { x: 3, y: 3, z: 1 },
            // Third layer (2x2)
            { x: 1, y: 1, z: 2 }, { x: 2, y: 1, z: 2 },
            { x: 1, y: 2, z: 2 }, { x: 2, y: 2, z: 2 },
            // Top (1x1)
            { x: 1, y: 1, z: 3 },
        ],
        pieces: [
            POLYCUBE_3D.Cube2x2x2('c1', '#FF9800'),
            POLYCUBE_3D.Cube2x2x2('c2', '#4CAF50'),
            POLYCUBE_3D.Cube2x2x2('c3', '#2196F3'),
            POLYCUBE_3D.Cube2x2('c4', '#9C27B0'),
            POLYCUBE_3D.Plus3D('p1', '#E91E63'),
            POLYCUBE_3D.Corner3D('cn1', '#FFEB3B'),
        ],
        difficulty: 'hard',
    },
];

/**
 * Fisher-Yates shuffle for unbiased randomization
 */
function shuffleArray<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

/**
 * Generate random level - always 4+ pieces
 */
export function generateRandomLevel(difficulty: 'easy' | 'medium' | 'hard'): LevelConfig {
    const allTetris = [TETRIS.I, TETRIS.O, TETRIS.T, TETRIS.S, TETRIS.Z, TETRIS.J, TETRIS.L];
    const colors = ['#00BCD4', '#FFEB3B', '#9C27B0', '#4CAF50', '#F44336', '#2196F3', '#FF9800', '#E91E63'];

    // Minimum 4 pieces for easy, more for harder
    let pieceCount: number;
    if (difficulty === 'easy') pieceCount = 4 + Math.floor(Math.random() * 2); // 4-5
    else if (difficulty === 'medium') pieceCount = 5 + Math.floor(Math.random() * 2); // 5-6
    else pieceCount = 6 + Math.floor(Math.random() * 2); // 6-7

    const pieces: Piece[] = [];
    const shuffled = shuffleArray(allTetris);
    for (let i = 0; i < pieceCount; i++) {
        const factory = shuffled[i % shuffled.length];
        pieces.push(factory(`p${i}`, colors[i % colors.length]));
    }

    const totalCells = pieces.reduce((sum, p) => sum + p.layout.length, 0);

    // Create rectangular target
    const width = Math.ceil(Math.sqrt(totalCells * 1.3));
    const height = Math.ceil(totalCells / width);

    const targetVoxels: { x: number; y: number; z: number }[] = [];
    let cellsAdded = 0;
    for (let y = 1; y <= height && cellsAdded < totalCells; y++) {
        for (let x = 1; x <= width && cellsAdded < totalCells; x++) {
            targetVoxels.push({ x, y, z: 0 });
            cellsAdded++;
        }
    }

    return {
        id: `random_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: `Random ${pieceCount} Pieces`,
        type: '2D',
        gridSize: [width + 3, height + 3, 1],
        targetVoxels,
        pieces,
        difficulty,
    };
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

    if (import.meta.env.DEV) {
        console.group('🧱 ShapeArchitect Level Validation');

        for (const [id, result] of results) {
            const level = presetLevels.find((l) => l.id === id);
            const icon = result.isValid ? '✅' : '❌';

            console.log(
                `${icon} ${level?.name ?? id}: Target=${result.targetVolume}, Pieces=${result.pieceVolume} | ${result.message}`
            );
        }

        console.groupEnd();
    }

    return results;
}

// Export for external use
export type { LevelValidation };
