// ========================================
// Shape Architect - Preset Levels with Tetris Pieces
// Increased difficulty: Easy requires 4-5 pieces minimum
// ========================================

import type { LevelConfig, Piece, Difficulty, Position3D } from "./types";
import type { LevelValidation } from "./engine";
import { validateAllLevels } from "./engine";
import { createSeededRandom } from "@math-games/core";
import { generateGuaranteedSolvableWithRetry } from "./seededGenerator";
import { TETRACUBE } from "./polycubes";
import {
  HEXOMINO,
  HEPTOMINO,
  HEXOMINO_KEYS,
  HEPTOMINO_KEYS,
} from "./polyominoes";

// Re-export polyominoes for external use
export { HEXOMINO, HEPTOMINO, HEXOMINO_KEYS, HEPTOMINO_KEYS };
export { TETRACUBE, PENTACUBE } from "./polycubes";

// ========================================
// All 7 Classic Tetris Pieces (Tetrominoes)
// ========================================

const TETRIS = {
  I: (id: string, color: string): Piece => ({
    id,
    name: "I-Block",
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
    name: "O-Block",
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
    name: "T-Block",
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
    name: "S-Block",
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
    name: "Z-Block",
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
    name: "J-Block",
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
    name: "L-Block",
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
    name: "F-Pento",
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
    name: "P-Pento",
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
    name: "U-Pento",
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
    name: "W-Pento",
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
    name: "I-Pento",
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
    name: "L-Pento",
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
    name: "N-Pento",
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
    name: "T-Pento",
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
    name: "V-Pento",
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
    name: "X-Pento",
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
    name: "Y-Pento",
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
    name: "Z-Pento",
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

// POLYCUBE_3D removed - 3D mode archived

// ========================================
// Themed Shapes - Fun recognizable shapes
// ========================================

export const THEMED_SHAPES = {
  // Cat face (simplified) - 8 cells
  Cat: (id: string, color: string): Piece => ({
    id,
    name: "Cat",
    color,
    layout: [
      // Body (2x2)
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 1, z: 0 },
      // Ears
      { x: 0, y: 2, z: 0 },
      { x: 1, y: 2, z: 0 },
      // Tail (extends right)
      { x: 2, y: 0, z: 0 },
      { x: 3, y: 0, z: 0 },
    ],
  }),

  // Dog (side view) - 9 cells
  Dog: (id: string, color: string): Piece => ({
    id,
    name: "Dog",
    color,
    layout: [
      // Body
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 2, y: 1, z: 0 },
      // Head
      { x: 3, y: 1, z: 0 },
      // Legs
      { x: 0, y: -1, z: 0 },
      { x: 2, y: -1, z: 0 },
    ],
  }),

  // Bird - 7 cells
  Bird: (id: string, color: string): Piece => ({
    id,
    name: "Bird",
    color,
    layout: [
      // Body
      { x: 1, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 },
      { x: 1, y: 1, z: 0 },
      // Wing
      { x: 0, y: 1, z: 0 },
      // Head and beak
      { x: 3, y: 0, z: 0 },
      { x: 4, y: 0, z: 0 },
      // Tail
      { x: 0, y: 0, z: 0 },
    ],
  }),

  // Car (side view) - 8 cells
  Car: (id: string, color: string): Piece => ({
    id,
    name: "Car",
    color,
    layout: [
      // Body
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 2, y: 1, z: 0 },
      { x: 3, y: 1, z: 0 },
      // Roof
      { x: 1, y: 2, z: 0 },
      { x: 2, y: 2, z: 0 },
      // Wheels
      { x: 0, y: 0, z: 0 },
      { x: 3, y: 0, z: 0 },
    ],
  }),

  // Heart - 8 cells
  Heart: (id: string, color: string): Piece => ({
    id,
    name: "Heart",
    color,
    layout: [
      // Top bumps
      { x: 0, y: 2, z: 0 },
      { x: 2, y: 2, z: 0 },
      // Middle row
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 2, y: 1, z: 0 },
      // Bottom point
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 },
    ],
  }),

  // Star (5-pointed, simplified) - 9 cells
  Star: (id: string, color: string): Piece => ({
    id,
    name: "Star",
    color,
    layout: [
      // Center cross
      { x: 2, y: 0, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 2, y: 1, z: 0 },
      { x: 3, y: 1, z: 0 },
      { x: 0, y: 2, z: 0 },
      { x: 2, y: 2, z: 0 },
      { x: 4, y: 2, z: 0 },
      { x: 1, y: 3, z: 0 },
      { x: 3, y: 3, z: 0 },
    ],
  }),

  // House - 9 cells
  House: (id: string, color: string): Piece => ({
    id,
    name: "House",
    color,
    layout: [
      // Base (2x2)
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 2, y: 1, z: 0 },
      // Roof (triangle)
      { x: 0, y: 2, z: 0 },
      { x: 1, y: 2, z: 0 },
      { x: 2, y: 2, z: 0 },
    ],
  }),

  // Tree - 7 cells
  Tree: (id: string, color: string): Piece => ({
    id,
    name: "Tree",
    color,
    layout: [
      // Trunk
      { x: 1, y: 0, z: 0 },
      { x: 1, y: 1, z: 0 },
      // Leaves (triangle)
      { x: 0, y: 2, z: 0 },
      { x: 1, y: 2, z: 0 },
      { x: 2, y: 2, z: 0 },
      { x: 0, y: 3, z: 0 },
      { x: 2, y: 3, z: 0 },
    ],
  }),
};

// ========================================
// Preset Levels - ALL require 4+ pieces
// ========================================

function cuboidVoxels(
  width: number,
  height: number,
  depth: number,
): Position3D[] {
  const voxels: Position3D[] = [];

  for (let z = 0; z < depth; z++) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        voxels.push({ x, y, z });
      }
    }
  }

  return voxels;
}

export const presetLevels: LevelConfig[] = [
  {
    id: "cube_2x2x2",
    name: "Two-Layer Cube",
    type: "3D",
    gridSize: [2, 2, 2],
    targetVoxels: cuboidVoxels(2, 2, 2),
    pieces: [
      TETRACUBE.O("cube_layer_1", "#00BCD4"),
      TETRACUBE.O("cube_layer_2", "#E91E63"),
    ],
    difficulty: "easy",
  },
  {
    id: "tower_2x2x3",
    name: "Layer Tower",
    type: "3D",
    gridSize: [2, 2, 3],
    targetVoxels: cuboidVoxels(2, 2, 3),
    pieces: [
      TETRACUBE.O("tower_layer_1", "#00BCD4"),
      TETRACUBE.O("tower_layer_2", "#FF9800"),
      TETRACUBE.O("tower_layer_3", "#9C27B0"),
    ],
    difficulty: "medium",
  },
  // ===== EASY LEVELS (4-5 pieces) =====
  {
    id: "easy_1",
    name: "4x4 Square",
    type: "2D",
    gridSize: [6, 6, 1],
    targetVoxels: [
      // 4x4 = 16 cells (4 tetrominoes)
      { x: 1, y: 1, z: 0 },
      { x: 2, y: 1, z: 0 },
      { x: 3, y: 1, z: 0 },
      { x: 4, y: 1, z: 0 },
      { x: 1, y: 2, z: 0 },
      { x: 2, y: 2, z: 0 },
      { x: 3, y: 2, z: 0 },
      { x: 4, y: 2, z: 0 },
      { x: 1, y: 3, z: 0 },
      { x: 2, y: 3, z: 0 },
      { x: 3, y: 3, z: 0 },
      { x: 4, y: 3, z: 0 },
      { x: 1, y: 4, z: 0 },
      { x: 2, y: 4, z: 0 },
      { x: 3, y: 4, z: 0 },
      { x: 4, y: 4, z: 0 },
    ],
    pieces: [
      TETRIS.O("o1", "#FFEB3B"),
      TETRIS.O("o2", "#4CAF50"),
      TETRIS.O("o3", "#2196F3"),
      TETRIS.O("o4", "#E91E63"),
    ],
    difficulty: "easy",
  },
  {
    id: "easy_2",
    name: "Long Strip",
    type: "2D",
    gridSize: [8, 5, 1],
    targetVoxels: [
      // 8x2 = 16 cells
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 2, y: 1, z: 0 },
      { x: 3, y: 1, z: 0 },
      { x: 4, y: 1, z: 0 },
      { x: 5, y: 1, z: 0 },
      { x: 6, y: 1, z: 0 },
      { x: 7, y: 1, z: 0 },
      { x: 0, y: 2, z: 0 },
      { x: 1, y: 2, z: 0 },
      { x: 2, y: 2, z: 0 },
      { x: 3, y: 2, z: 0 },
      { x: 4, y: 2, z: 0 },
      { x: 5, y: 2, z: 0 },
      { x: 6, y: 2, z: 0 },
      { x: 7, y: 2, z: 0 },
    ],
    pieces: [
      TETRIS.I("i1", "#00BCD4"),
      TETRIS.I("i2", "#4CAF50"),
      TETRIS.I("i3", "#FF9800"),
      TETRIS.I("i4", "#9C27B0"),
    ],
    difficulty: "easy",
  },
  {
    id: "easy_3",
    name: "T-Formation",
    type: "2D",
    gridSize: [7, 7, 1],
    targetVoxels: [
      // Simple T-shape = 16 cells = 4 O-blocks
      // Top bar 4x2
      { x: 1, y: 1, z: 0 },
      { x: 2, y: 1, z: 0 },
      { x: 3, y: 1, z: 0 },
      { x: 4, y: 1, z: 0 },
      { x: 1, y: 2, z: 0 },
      { x: 2, y: 2, z: 0 },
      { x: 3, y: 2, z: 0 },
      { x: 4, y: 2, z: 0 },
      // Stem 2x4
      { x: 2, y: 3, z: 0 },
      { x: 3, y: 3, z: 0 },
      { x: 2, y: 4, z: 0 },
      { x: 3, y: 4, z: 0 },
      { x: 2, y: 5, z: 0 },
      { x: 3, y: 5, z: 0 },
      { x: 2, y: 6, z: 0 },
      { x: 3, y: 6, z: 0 },
    ],
    pieces: [
      TETRIS.O("o1", "#00BCD4"),
      TETRIS.O("o2", "#9C27B0"),
      TETRIS.O("o3", "#E91E63"),
      TETRIS.O("o4", "#FF9800"),
    ],
    difficulty: "easy",
  },
  {
    id: "easy_4",
    name: "Rectangle",
    type: "2D",
    gridSize: [8, 5, 1],
    targetVoxels: [
      // 6x4 = 24 cells = 6 O-blocks (easily solvable)
      { x: 1, y: 1, z: 0 },
      { x: 2, y: 1, z: 0 },
      { x: 3, y: 1, z: 0 },
      { x: 4, y: 1, z: 0 },
      { x: 5, y: 1, z: 0 },
      { x: 6, y: 1, z: 0 },
      { x: 1, y: 2, z: 0 },
      { x: 2, y: 2, z: 0 },
      { x: 3, y: 2, z: 0 },
      { x: 4, y: 2, z: 0 },
      { x: 5, y: 2, z: 0 },
      { x: 6, y: 2, z: 0 },
      { x: 1, y: 3, z: 0 },
      { x: 2, y: 3, z: 0 },
      { x: 3, y: 3, z: 0 },
      { x: 4, y: 3, z: 0 },
      { x: 5, y: 3, z: 0 },
      { x: 6, y: 3, z: 0 },
      { x: 1, y: 4, z: 0 },
      { x: 2, y: 4, z: 0 },
      { x: 3, y: 4, z: 0 },
      { x: 4, y: 4, z: 0 },
      { x: 5, y: 4, z: 0 },
      { x: 6, y: 4, z: 0 },
    ],
    pieces: [
      TETRIS.O("o1", "#00BCD4"),
      TETRIS.O("o2", "#FFEB3B"),
      TETRIS.O("o3", "#9C27B0"),
      TETRIS.O("o4", "#FF9800"),
      TETRIS.O("o5", "#2196F3"),
      TETRIS.O("o6", "#4CAF50"),
    ],
    difficulty: "easy",
  },

  // ===== MEDIUM LEVELS (5-6 pieces) =====
  {
    id: "med_1",
    name: "Plus Sign",
    type: "2D",
    gridSize: [8, 8, 1],
    targetVoxels: [
      // Plus shape = 20 cells = 5 O-blocks
      // Top stem 2x2
      { x: 3, y: 1, z: 0 },
      { x: 4, y: 1, z: 0 },
      { x: 3, y: 2, z: 0 },
      { x: 4, y: 2, z: 0 },
      // Cross bar 6x2
      { x: 1, y: 3, z: 0 },
      { x: 2, y: 3, z: 0 },
      { x: 3, y: 3, z: 0 },
      { x: 4, y: 3, z: 0 },
      { x: 5, y: 3, z: 0 },
      { x: 6, y: 3, z: 0 },
      { x: 1, y: 4, z: 0 },
      { x: 2, y: 4, z: 0 },
      { x: 3, y: 4, z: 0 },
      { x: 4, y: 4, z: 0 },
      { x: 5, y: 4, z: 0 },
      { x: 6, y: 4, z: 0 },
      // Bottom stem 2x2
      { x: 3, y: 5, z: 0 },
      { x: 4, y: 5, z: 0 },
      { x: 3, y: 6, z: 0 },
      { x: 4, y: 6, z: 0 },
    ],
    pieces: [
      TETRIS.O("o1", "#FFEB3B"),
      TETRIS.O("o2", "#4CAF50"),
      TETRIS.O("o3", "#00BCD4"),
      TETRIS.O("o4", "#9C27B0"),
      TETRIS.O("o5", "#E91E63"),
    ],
    difficulty: "medium",
  },
  {
    id: "med_2",
    name: "Staircase",
    type: "2D",
    gridSize: [8, 5, 1],
    targetVoxels: [
      // Simple stair pattern = 20 cells = 5 tetrominoes
      { x: 1, y: 1, z: 0 },
      { x: 2, y: 1, z: 0 },
      { x: 3, y: 1, z: 0 },
      { x: 4, y: 1, z: 0 },
      { x: 1, y: 2, z: 0 },
      { x: 2, y: 2, z: 0 },
      { x: 3, y: 2, z: 0 },
      { x: 4, y: 2, z: 0 },
      { x: 3, y: 3, z: 0 },
      { x: 4, y: 3, z: 0 },
      { x: 5, y: 3, z: 0 },
      { x: 6, y: 3, z: 0 },
      { x: 3, y: 4, z: 0 },
      { x: 4, y: 4, z: 0 },
      { x: 5, y: 4, z: 0 },
      { x: 6, y: 4, z: 0 },
      { x: 5, y: 1, z: 0 },
      { x: 6, y: 1, z: 0 },
      { x: 5, y: 2, z: 0 },
      { x: 6, y: 2, z: 0 },
    ],
    pieces: [
      TETRIS.O("o1", "#FFEB3B"),
      TETRIS.O("o2", "#4CAF50"),
      TETRIS.O("o3", "#2196F3"),
      TETRIS.O("o4", "#FF9800"),
      TETRIS.O("o5", "#E91E63"),
    ],
    difficulty: "medium",
  },
  {
    id: "med_3",
    name: "H-Shape",
    type: "2D",
    gridSize: [8, 6, 1],
    targetVoxels: [
      // H pattern = 20 cells = 5 tetrominoes
      { x: 1, y: 1, z: 0 },
      { x: 2, y: 1, z: 0 },
      { x: 5, y: 1, z: 0 },
      { x: 6, y: 1, z: 0 },
      { x: 1, y: 2, z: 0 },
      { x: 2, y: 2, z: 0 },
      { x: 5, y: 2, z: 0 },
      { x: 6, y: 2, z: 0 },
      { x: 1, y: 3, z: 0 },
      { x: 2, y: 3, z: 0 },
      { x: 3, y: 3, z: 0 },
      { x: 4, y: 3, z: 0 },
      { x: 5, y: 3, z: 0 },
      { x: 6, y: 3, z: 0 },
      { x: 1, y: 4, z: 0 },
      { x: 2, y: 4, z: 0 },
      { x: 5, y: 4, z: 0 },
      { x: 6, y: 4, z: 0 },
      { x: 1, y: 5, z: 0 },
      { x: 2, y: 5, z: 0 },
    ],
    pieces: [
      TETRIS.O("o1", "#FFEB3B"),
      TETRIS.O("o2", "#4CAF50"),
      TETRIS.O("o3", "#2196F3"),
      TETRIS.I("i1", "#00BCD4"),
      TETRIS.O("o4", "#E91E63"),
    ],
    difficulty: "medium",
  },

  // ===== HARD LEVELS (6-7 pieces) =====
  {
    id: "hard_1",
    name: "Tetris Master",
    type: "2D",
    gridSize: [8, 5, 1],
    targetVoxels: [
      // 6x4 = 24 cells = 6 tetrominoes
      { x: 1, y: 1, z: 0 },
      { x: 2, y: 1, z: 0 },
      { x: 3, y: 1, z: 0 },
      { x: 4, y: 1, z: 0 },
      { x: 5, y: 1, z: 0 },
      { x: 6, y: 1, z: 0 },
      { x: 1, y: 2, z: 0 },
      { x: 2, y: 2, z: 0 },
      { x: 3, y: 2, z: 0 },
      { x: 4, y: 2, z: 0 },
      { x: 5, y: 2, z: 0 },
      { x: 6, y: 2, z: 0 },
      { x: 1, y: 3, z: 0 },
      { x: 2, y: 3, z: 0 },
      { x: 3, y: 3, z: 0 },
      { x: 4, y: 3, z: 0 },
      { x: 5, y: 3, z: 0 },
      { x: 6, y: 3, z: 0 },
      { x: 1, y: 4, z: 0 },
      { x: 2, y: 4, z: 0 },
      { x: 3, y: 4, z: 0 },
      { x: 4, y: 4, z: 0 },
      { x: 5, y: 4, z: 0 },
      { x: 6, y: 4, z: 0 },
    ],
    pieces: [
      TETRIS.I("i1", "#00BCD4"),
      TETRIS.I("i2", "#26A69A"),
      TETRIS.O("o1", "#FFEB3B"),
      TETRIS.O("o2", "#FFC107"),
      TETRIS.O("o3", "#FF9800"),
      TETRIS.O("o4", "#E91E63"),
    ],
    difficulty: "hard",
  },

  // Auto-generated hard preset levels. Replace hard_2 / hard_3 /
  // hard_4 and add one more. Each is verified solvable by the DLX
  // solver with non-trivial search effort.

  {
    id: "hard_v2_1",
    name: "Crucible",
    type: "2D",
    gridSize: [11, 9, 1],
    targetVoxels: [
      { x: 4, y: 1, z: 0 },
      { x: 5, y: 1, z: 0 },
      { x: 3, y: 2, z: 0 },
      { x: 4, y: 2, z: 0 },
      { x: 5, y: 2, z: 0 },
      { x: 6, y: 2, z: 0 },
      { x: 7, y: 2, z: 0 },
      { x: 8, y: 2, z: 0 },
      { x: 1, y: 3, z: 0 },
      { x: 2, y: 3, z: 0 },
      { x: 3, y: 3, z: 0 },
      { x: 5, y: 3, z: 0 },
      { x: 6, y: 3, z: 0 },
      { x: 7, y: 3, z: 0 },
      { x: 8, y: 3, z: 0 },
      { x: 3, y: 4, z: 0 },
      { x: 4, y: 4, z: 0 },
      { x: 5, y: 4, z: 0 },
      { x: 6, y: 4, z: 0 },
      { x: 7, y: 4, z: 0 },
      { x: 8, y: 4, z: 0 },
      { x: 9, y: 4, z: 0 },
      { x: 2, y: 5, z: 0 },
      { x: 3, y: 5, z: 0 },
      { x: 5, y: 5, z: 0 },
      { x: 6, y: 5, z: 0 },
      { x: 8, y: 5, z: 0 },
      { x: 1, y: 6, z: 0 },
      { x: 2, y: 6, z: 0 },
      { x: 3, y: 6, z: 0 },
      { x: 6, y: 6, z: 0 },
      { x: 7, y: 6, z: 0 },
      { x: 1, y: 7, z: 0 },
      { x: 2, y: 7, z: 0 },
      { x: 3, y: 7, z: 0 },
      { x: 4, y: 7, z: 0 },
      { x: 7, y: 7, z: 0 },
    ],
    pieces: [
      {
        id: "piece_0",
        name: "Hook-Hex",
        color: "#9C27B0",
        layout: [
          { x: 0, y: 0, z: 0 },
          { x: 1, y: 0, z: 0 },
          { x: 1, y: 1, z: 0 },
          { x: 1, y: 2, z: 0 },
          { x: 1, y: 3, z: 0 },
          { x: 2, y: 3, z: 0 },
        ],
      },
      {
        id: "piece_6",
        name: "Y-Pento",
        color: "#26A69A",
        layout: [
          { x: 1, y: 0, z: 0 },
          { x: 0, y: 1, z: 0 },
          { x: 1, y: 1, z: 0 },
          { x: 1, y: 2, z: 0 },
          { x: 1, y: 3, z: 0 },
        ],
      },
      {
        id: "piece_3",
        name: "W-Pento",
        color: "#2196F3",
        layout: [
          { x: 0, y: 0, z: 0 },
          { x: 0, y: 1, z: 0 },
          { x: 1, y: 1, z: 0 },
          { x: 1, y: 2, z: 0 },
          { x: 2, y: 2, z: 0 },
        ],
      },
      {
        id: "piece_4",
        name: "F-Pento",
        color: "#E91E63",
        layout: [
          { x: 1, y: 0, z: 0 },
          { x: 2, y: 0, z: 0 },
          { x: 0, y: 1, z: 0 },
          { x: 1, y: 1, z: 0 },
          { x: 1, y: 2, z: 0 },
        ],
      },
      {
        id: "piece_2",
        name: "U-Pento",
        color: "#4CAF50",
        layout: [
          { x: 0, y: 0, z: 0 },
          { x: 2, y: 0, z: 0 },
          { x: 0, y: 1, z: 0 },
          { x: 1, y: 1, z: 0 },
          { x: 2, y: 1, z: 0 },
        ],
      },
      {
        id: "piece_1",
        name: "N-Pento",
        color: "#795548",
        layout: [
          { x: 0, y: 0, z: 0 },
          { x: 0, y: 1, z: 0 },
          { x: 1, y: 1, z: 0 },
          { x: 1, y: 2, z: 0 },
          { x: 1, y: 3, z: 0 },
        ],
      },
      {
        id: "piece_5",
        name: "Stair-Hex",
        color: "#FF9800",
        layout: [
          { x: 0, y: 0, z: 0 },
          { x: 0, y: 1, z: 0 },
          { x: 1, y: 1, z: 0 },
          { x: 1, y: 2, z: 0 },
          { x: 2, y: 2, z: 0 },
          { x: 2, y: 3, z: 0 },
        ],
      },
    ],
    difficulty: "hard",
  },
  {
    id: "hard_v2_2",
    name: "Outpost",
    type: "2D",
    gridSize: [11, 10, 1],
    targetVoxels: [
      { x: 4, y: 1, z: 0 },
      { x: 5, y: 1, z: 0 },
      { x: 6, y: 1, z: 0 },
      { x: 7, y: 1, z: 0 },
      { x: 4, y: 2, z: 0 },
      { x: 5, y: 2, z: 0 },
      { x: 6, y: 2, z: 0 },
      { x: 7, y: 2, z: 0 },
      { x: 2, y: 3, z: 0 },
      { x: 3, y: 3, z: 0 },
      { x: 4, y: 3, z: 0 },
      { x: 5, y: 3, z: 0 },
      { x: 6, y: 3, z: 0 },
      { x: 1, y: 4, z: 0 },
      { x: 2, y: 4, z: 0 },
      { x: 3, y: 4, z: 0 },
      { x: 4, y: 4, z: 0 },
      { x: 5, y: 4, z: 0 },
      { x: 6, y: 4, z: 0 },
      { x: 3, y: 5, z: 0 },
      { x: 4, y: 5, z: 0 },
      { x: 5, y: 5, z: 0 },
      { x: 6, y: 5, z: 0 },
      { x: 7, y: 5, z: 0 },
      { x: 8, y: 5, z: 0 },
      { x: 2, y: 6, z: 0 },
      { x: 3, y: 6, z: 0 },
      { x: 4, y: 6, z: 0 },
      { x: 5, y: 6, z: 0 },
      { x: 6, y: 6, z: 0 },
      { x: 8, y: 6, z: 0 },
      { x: 2, y: 7, z: 0 },
      { x: 3, y: 7, z: 0 },
      { x: 4, y: 7, z: 0 },
      { x: 5, y: 7, z: 0 },
      { x: 6, y: 7, z: 0 },
      { x: 8, y: 7, z: 0 },
      { x: 2, y: 8, z: 0 },
      { x: 3, y: 8, z: 0 },
      { x: 4, y: 8, z: 0 },
      { x: 5, y: 8, z: 0 },
      { x: 8, y: 8, z: 0 },
      { x: 9, y: 8, z: 0 },
    ],
    pieces: [
      {
        id: "piece_3",
        name: "U-Pento",
        color: "#4CAF50",
        layout: [
          { x: 0, y: 0, z: 0 },
          { x: 2, y: 0, z: 0 },
          { x: 0, y: 1, z: 0 },
          { x: 1, y: 1, z: 0 },
          { x: 2, y: 1, z: 0 },
        ],
      },
      {
        id: "piece_6",
        name: "V-Pento",
        color: "#3F51B5",
        layout: [
          { x: 0, y: 0, z: 0 },
          { x: 0, y: 1, z: 0 },
          { x: 0, y: 2, z: 0 },
          { x: 1, y: 2, z: 0 },
          { x: 2, y: 2, z: 0 },
        ],
      },
      {
        id: "piece_4",
        name: "Hook-Hex",
        color: "#F44336",
        layout: [
          { x: 0, y: 0, z: 0 },
          { x: 1, y: 0, z: 0 },
          { x: 1, y: 1, z: 0 },
          { x: 1, y: 2, z: 0 },
          { x: 1, y: 3, z: 0 },
          { x: 2, y: 3, z: 0 },
        ],
      },
      {
        id: "piece_7",
        name: "N-Pento",
        color: "#795548",
        layout: [
          { x: 0, y: 0, z: 0 },
          { x: 0, y: 1, z: 0 },
          { x: 1, y: 1, z: 0 },
          { x: 1, y: 2, z: 0 },
          { x: 1, y: 3, z: 0 },
        ],
      },
      {
        id: "piece_2",
        name: "Cross-Hex",
        color: "#2196F3",
        layout: [
          { x: 1, y: 0, z: 0 },
          { x: 0, y: 1, z: 0 },
          { x: 1, y: 1, z: 0 },
          { x: 2, y: 1, z: 0 },
          { x: 1, y: 2, z: 0 },
          { x: 1, y: 3, z: 0 },
        ],
      },
      {
        id: "piece_0",
        name: "Stair-Hex",
        color: "#E91E63",
        layout: [
          { x: 0, y: 0, z: 0 },
          { x: 0, y: 1, z: 0 },
          { x: 1, y: 1, z: 0 },
          { x: 1, y: 2, z: 0 },
          { x: 2, y: 2, z: 0 },
          { x: 2, y: 3, z: 0 },
        ],
      },
      {
        id: "piece_1",
        name: "F-Pento",
        color: "#26A69A",
        layout: [
          { x: 1, y: 0, z: 0 },
          { x: 2, y: 0, z: 0 },
          { x: 0, y: 1, z: 0 },
          { x: 1, y: 1, z: 0 },
          { x: 1, y: 2, z: 0 },
        ],
      },
      {
        id: "piece_5",
        name: "P-Pento",
        color: "#FF9800",
        layout: [
          { x: 0, y: 0, z: 0 },
          { x: 1, y: 0, z: 0 },
          { x: 0, y: 1, z: 0 },
          { x: 1, y: 1, z: 0 },
          { x: 0, y: 2, z: 0 },
        ],
      },
    ],
    difficulty: "hard",
  },
  {
    id: "hard_v2_3",
    name: "Cascade",
    type: "2D",
    gridSize: [11, 9, 1],
    targetVoxels: [
      { x: 2, y: 1, z: 0 },
      { x: 5, y: 1, z: 0 },
      { x: 6, y: 1, z: 0 },
      { x: 8, y: 1, z: 0 },
      { x: 2, y: 2, z: 0 },
      { x: 3, y: 2, z: 0 },
      { x: 4, y: 2, z: 0 },
      { x: 5, y: 2, z: 0 },
      { x: 6, y: 2, z: 0 },
      { x: 7, y: 2, z: 0 },
      { x: 8, y: 2, z: 0 },
      { x: 3, y: 3, z: 0 },
      { x: 4, y: 3, z: 0 },
      { x: 5, y: 3, z: 0 },
      { x: 6, y: 3, z: 0 },
      { x: 7, y: 3, z: 0 },
      { x: 3, y: 4, z: 0 },
      { x: 4, y: 4, z: 0 },
      { x: 5, y: 4, z: 0 },
      { x: 6, y: 4, z: 0 },
      { x: 7, y: 4, z: 0 },
      { x: 8, y: 4, z: 0 },
      { x: 3, y: 5, z: 0 },
      { x: 4, y: 5, z: 0 },
      { x: 5, y: 5, z: 0 },
      { x: 8, y: 5, z: 0 },
      { x: 1, y: 6, z: 0 },
      { x: 2, y: 6, z: 0 },
      { x: 3, y: 6, z: 0 },
      { x: 4, y: 6, z: 0 },
      { x: 5, y: 6, z: 0 },
      { x: 8, y: 6, z: 0 },
      { x: 4, y: 7, z: 0 },
      { x: 5, y: 7, z: 0 },
      { x: 8, y: 7, z: 0 },
      { x: 9, y: 7, z: 0 },
    ],
    pieces: [
      {
        id: "piece_0",
        name: "P-Pento",
        color: "#2196F3",
        layout: [
          { x: 0, y: 0, z: 0 },
          { x: 1, y: 0, z: 0 },
          { x: 0, y: 1, z: 0 },
          { x: 1, y: 1, z: 0 },
          { x: 0, y: 2, z: 0 },
        ],
      },
      {
        id: "piece_4",
        name: "N-Pento",
        color: "#9C27B0",
        layout: [
          { x: 0, y: 0, z: 0 },
          { x: 0, y: 1, z: 0 },
          { x: 1, y: 1, z: 0 },
          { x: 1, y: 2, z: 0 },
          { x: 1, y: 3, z: 0 },
        ],
      },
      {
        id: "piece_2",
        name: "V-Pento",
        color: "#FF9800",
        layout: [
          { x: 0, y: 0, z: 0 },
          { x: 0, y: 1, z: 0 },
          { x: 0, y: 2, z: 0 },
          { x: 1, y: 2, z: 0 },
          { x: 2, y: 2, z: 0 },
        ],
      },
      {
        id: "piece_1",
        name: "W-Pento",
        color: "#F44336",
        layout: [
          { x: 0, y: 0, z: 0 },
          { x: 0, y: 1, z: 0 },
          { x: 1, y: 1, z: 0 },
          { x: 1, y: 2, z: 0 },
          { x: 2, y: 2, z: 0 },
        ],
      },
      {
        id: "piece_3",
        name: "Hook-Hex",
        color: "#795548",
        layout: [
          { x: 0, y: 0, z: 0 },
          { x: 1, y: 0, z: 0 },
          { x: 1, y: 1, z: 0 },
          { x: 1, y: 2, z: 0 },
          { x: 1, y: 3, z: 0 },
          { x: 2, y: 3, z: 0 },
        ],
      },
      {
        id: "piece_6",
        name: "Y-Pento",
        color: "#E91E63",
        layout: [
          { x: 1, y: 0, z: 0 },
          { x: 0, y: 1, z: 0 },
          { x: 1, y: 1, z: 0 },
          { x: 1, y: 2, z: 0 },
          { x: 1, y: 3, z: 0 },
        ],
      },
      {
        id: "piece_5",
        name: "U-Pento",
        color: "#00BCD4",
        layout: [
          { x: 0, y: 0, z: 0 },
          { x: 2, y: 0, z: 0 },
          { x: 0, y: 1, z: 0 },
          { x: 1, y: 1, z: 0 },
          { x: 2, y: 1, z: 0 },
        ],
      },
    ],
    difficulty: "hard",
  },
  {
    id: "hard_v2_4",
    name: "Bastion",
    type: "2D",
    gridSize: [11, 10, 1],
    targetVoxels: [
      { x: 6, y: 1, z: 0 },
      { x: 1, y: 2, z: 0 },
      { x: 3, y: 2, z: 0 },
      { x: 5, y: 2, z: 0 },
      { x: 6, y: 2, z: 0 },
      { x: 1, y: 3, z: 0 },
      { x: 2, y: 3, z: 0 },
      { x: 3, y: 3, z: 0 },
      { x: 4, y: 3, z: 0 },
      { x: 5, y: 3, z: 0 },
      { x: 6, y: 3, z: 0 },
      { x: 2, y: 4, z: 0 },
      { x: 3, y: 4, z: 0 },
      { x: 5, y: 4, z: 0 },
      { x: 6, y: 4, z: 0 },
      { x: 7, y: 4, z: 0 },
      { x: 8, y: 4, z: 0 },
      { x: 9, y: 4, z: 0 },
      { x: 1, y: 5, z: 0 },
      { x: 2, y: 5, z: 0 },
      { x: 3, y: 5, z: 0 },
      { x: 4, y: 5, z: 0 },
      { x: 5, y: 5, z: 0 },
      { x: 6, y: 5, z: 0 },
      { x: 7, y: 5, z: 0 },
      { x: 1, y: 6, z: 0 },
      { x: 2, y: 6, z: 0 },
      { x: 3, y: 6, z: 0 },
      { x: 5, y: 6, z: 0 },
      { x: 6, y: 6, z: 0 },
      { x: 7, y: 6, z: 0 },
      { x: 1, y: 7, z: 0 },
      { x: 2, y: 7, z: 0 },
      { x: 6, y: 7, z: 0 },
      { x: 7, y: 7, z: 0 },
      { x: 6, y: 8, z: 0 },
      { x: 7, y: 8, z: 0 },
    ],
    pieces: [
      {
        id: "piece_6",
        name: "Y-Pento",
        color: "#9C27B0",
        layout: [
          { x: 1, y: 0, z: 0 },
          { x: 0, y: 1, z: 0 },
          { x: 1, y: 1, z: 0 },
          { x: 1, y: 2, z: 0 },
          { x: 1, y: 3, z: 0 },
        ],
      },
      {
        id: "piece_4",
        name: "N-Pento",
        color: "#3F51B5",
        layout: [
          { x: 0, y: 0, z: 0 },
          { x: 0, y: 1, z: 0 },
          { x: 1, y: 1, z: 0 },
          { x: 1, y: 2, z: 0 },
          { x: 1, y: 3, z: 0 },
        ],
      },
      {
        id: "piece_1",
        name: "U-Pento",
        color: "#E91E63",
        layout: [
          { x: 0, y: 0, z: 0 },
          { x: 2, y: 0, z: 0 },
          { x: 0, y: 1, z: 0 },
          { x: 1, y: 1, z: 0 },
          { x: 2, y: 1, z: 0 },
        ],
      },
      {
        id: "piece_0",
        name: "Hook-Hex",
        color: "#F44336",
        layout: [
          { x: 0, y: 0, z: 0 },
          { x: 1, y: 0, z: 0 },
          { x: 1, y: 1, z: 0 },
          { x: 1, y: 2, z: 0 },
          { x: 1, y: 3, z: 0 },
          { x: 2, y: 3, z: 0 },
        ],
      },
      {
        id: "piece_5",
        name: "P-Pento",
        color: "#FF9800",
        layout: [
          { x: 0, y: 0, z: 0 },
          { x: 1, y: 0, z: 0 },
          { x: 0, y: 1, z: 0 },
          { x: 1, y: 1, z: 0 },
          { x: 0, y: 2, z: 0 },
        ],
      },
      {
        id: "piece_2",
        name: "W-Pento",
        color: "#2196F3",
        layout: [
          { x: 0, y: 0, z: 0 },
          { x: 0, y: 1, z: 0 },
          { x: 1, y: 1, z: 0 },
          { x: 1, y: 2, z: 0 },
          { x: 2, y: 2, z: 0 },
        ],
      },
      {
        id: "piece_3",
        name: "Stair-Hex",
        color: "#795548",
        layout: [
          { x: 0, y: 0, z: 0 },
          { x: 0, y: 1, z: 0 },
          { x: 1, y: 1, z: 0 },
          { x: 1, y: 2, z: 0 },
          { x: 2, y: 2, z: 0 },
          { x: 2, y: 3, z: 0 },
        ],
      },
    ],
    difficulty: "hard",
  },

  // ===== EXPERT LEVELS (Full Pentomino Set) =====
  {
    id: "expert_1",
    name: "Pentomino Rectangle",
    type: "2D",
    gridSize: [8, 6, 1],
    targetVoxels: [
      // 5x4 = 20 cells = 4 pentominoes
      { x: 1, y: 1, z: 0 },
      { x: 2, y: 1, z: 0 },
      { x: 3, y: 1, z: 0 },
      { x: 4, y: 1, z: 0 },
      { x: 5, y: 1, z: 0 },
      { x: 1, y: 2, z: 0 },
      { x: 2, y: 2, z: 0 },
      { x: 3, y: 2, z: 0 },
      { x: 4, y: 2, z: 0 },
      { x: 5, y: 2, z: 0 },
      { x: 1, y: 3, z: 0 },
      { x: 2, y: 3, z: 0 },
      { x: 3, y: 3, z: 0 },
      { x: 4, y: 3, z: 0 },
      { x: 5, y: 3, z: 0 },
      { x: 1, y: 4, z: 0 },
      { x: 2, y: 4, z: 0 },
      { x: 3, y: 4, z: 0 },
      { x: 4, y: 4, z: 0 },
      { x: 5, y: 4, z: 0 },
    ],
    pieces: [
      PENTOMINO.I("pi1", "#E91E63"),
      PENTOMINO.L("pl1", "#3F51B5"),
      PENTOMINO.V("pv1", "#FF5722"),
      PENTOMINO.P("pp1", "#795548"),
    ],
    difficulty: "hard",
  },
  {
    id: "expert_2",
    name: "Wide Grid",
    type: "2D",
    gridSize: [9, 5, 1],
    targetVoxels: [
      // 8x3 = 24 cells = 6 O-blocks
      { x: 1, y: 1, z: 0 },
      { x: 2, y: 1, z: 0 },
      { x: 3, y: 1, z: 0 },
      { x: 4, y: 1, z: 0 },
      { x: 5, y: 1, z: 0 },
      { x: 6, y: 1, z: 0 },
      { x: 7, y: 1, z: 0 },
      { x: 8, y: 1, z: 0 },
      { x: 1, y: 2, z: 0 },
      { x: 2, y: 2, z: 0 },
      { x: 3, y: 2, z: 0 },
      { x: 4, y: 2, z: 0 },
      { x: 5, y: 2, z: 0 },
      { x: 6, y: 2, z: 0 },
      { x: 7, y: 2, z: 0 },
      { x: 8, y: 2, z: 0 },
      { x: 1, y: 3, z: 0 },
      { x: 2, y: 3, z: 0 },
      { x: 3, y: 3, z: 0 },
      { x: 4, y: 3, z: 0 },
      { x: 5, y: 3, z: 0 },
      { x: 6, y: 3, z: 0 },
      { x: 7, y: 3, z: 0 },
      { x: 8, y: 3, z: 0 },
    ],
    pieces: [
      TETRIS.I("i1", "#E91E63"),
      TETRIS.I("i2", "#3F51B5"),
      TETRIS.I("i3", "#009688"),
      TETRIS.I("i4", "#FF5722"),
      TETRIS.I("i5", "#FFEB3B"),
      TETRIS.I("i6", "#00BCD4"),
    ],
    difficulty: "hard",
  },
  // 3D levels removed - focusing on polished 2D experience
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
 * - Easy: 3-4 tetrominoes (12-16 cells)
 * - Medium: 5-6 tetrominoes (20-24 cells)
 * - Hard: 7-8 tetrominoes (28-32 cells)
 * - Expert: 6-8 hexominoes (36-48 cells)
 * - Master: 5-7 heptominoes (35-49 cells)
 */
export function generateRandomLevel(difficulty: Difficulty): LevelConfig {
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
