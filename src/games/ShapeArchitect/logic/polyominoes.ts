/**
 * Hexominoes (6-cell polyominoes) and Heptominoes (7-cell polyominoes)
 *
 * Hexominoes: 35 free pieces (we define 25 varied shapes)
 * Heptominoes: 108 free pieces (we define 25 varied shapes)
 *
 * Naming follows standard polyomino conventions where available,
 * with descriptive names for less common shapes.
 */

import type { Piece } from './types'

// ========================================
// HEXOMINOES (6 cells each)
// 35 free hexominoes exist; we define 25 varied shapes
// ========================================

export const HEXOMINO = {
  // I6 - Straight line
  I: (id: string, color: string): Piece => ({
    id,
    name: 'I-Hex',
    color,
    layout: [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 },
      { x: 3, y: 0, z: 0 },
      { x: 4, y: 0, z: 0 },
      { x: 5, y: 0, z: 0 },
    ],
  }),

  // L6 - Extended L
  L: (id: string, color: string): Piece => ({
    id,
    name: 'L-Hex',
    color,
    layout: [
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 0, y: 2, z: 0 },
      { x: 0, y: 3, z: 0 },
      { x: 0, y: 4, z: 0 },
      { x: 1, y: 4, z: 0 },
    ],
  }),

  // J6 - Mirror of L6
  J: (id: string, color: string): Piece => ({
    id,
    name: 'J-Hex',
    color,
    layout: [
      { x: 1, y: 0, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 1, y: 2, z: 0 },
      { x: 1, y: 3, z: 0 },
      { x: 1, y: 4, z: 0 },
      { x: 0, y: 4, z: 0 },
    ],
  }),

  // T6 - Extended T
  T: (id: string, color: string): Piece => ({
    id,
    name: 'T-Hex',
    color,
    layout: [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 },
      { x: 3, y: 0, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 1, y: 2, z: 0 },
    ],
  }),

  // S6 - Extended S
  S: (id: string, color: string): Piece => ({
    id,
    name: 'S-Hex',
    color,
    layout: [
      { x: 2, y: 0, z: 0 },
      { x: 3, y: 0, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 2, y: 1, z: 0 },
      { x: 0, y: 2, z: 0 },
      { x: 1, y: 2, z: 0 },
    ],
  }),

  // Z6 - Extended Z
  Z: (id: string, color: string): Piece => ({
    id,
    name: 'Z-Hex',
    color,
    layout: [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 2, y: 1, z: 0 },
      { x: 2, y: 2, z: 0 },
      { x: 3, y: 2, z: 0 },
    ],
  }),

  // U6 - U shape with extra cells
  U: (id: string, color: string): Piece => ({
    id,
    name: 'U-Hex',
    color,
    layout: [
      { x: 0, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 2, y: 1, z: 0 },
      { x: 1, y: 2, z: 0 },
    ],
  }),

  // Y6 - Y shape extended
  Y: (id: string, color: string): Piece => ({
    id,
    name: 'Y-Hex',
    color,
    layout: [
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 1, y: 2, z: 0 },
      { x: 1, y: 3, z: 0 },
      { x: 1, y: 4, z: 0 },
    ],
  }),

  // Cross - Plus sign with 6 cells
  Cross: (id: string, color: string): Piece => ({
    id,
    name: 'Cross',
    color,
    layout: [
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 2, y: 1, z: 0 },
      { x: 1, y: 2, z: 0 },
      { x: 1, y: 3, z: 0 },
    ],
  }),

  // Hook - Like a fish hook
  Hook: (id: string, color: string): Piece => ({
    id,
    name: 'Hook',
    color,
    layout: [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 1, y: 2, z: 0 },
      { x: 1, y: 3, z: 0 },
      { x: 2, y: 3, z: 0 },
    ],
  }),

  // Stairs - Staircase pattern
  Stairs: (id: string, color: string): Piece => ({
    id,
    name: 'Stairs',
    color,
    layout: [
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 1, y: 2, z: 0 },
      { x: 2, y: 2, z: 0 },
      { x: 2, y: 3, z: 0 },
    ],
  }),

  // Snake - Serpentine pattern
  Snake: (id: string, color: string): Piece => ({
    id,
    name: 'Snake',
    color,
    layout: [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 1, y: 2, z: 0 },
      { x: 2, y: 2, z: 0 },
      { x: 2, y: 3, z: 0 },
    ],
  }),

  // P6 - P pentomino with extra cell
  P: (id: string, color: string): Piece => ({
    id,
    name: 'P-Hex',
    color,
    layout: [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 0, y: 2, z: 0 },
      { x: 0, y: 3, z: 0 },
    ],
  }),

  // Q6 - Mirror of P6
  Q: (id: string, color: string): Piece => ({
    id,
    name: 'Q-Hex',
    color,
    layout: [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 1, y: 2, z: 0 },
      { x: 1, y: 3, z: 0 },
    ],
  }),

  // Rectangle - 2x3 rectangle
  Rect: (id: string, color: string): Piece => ({
    id,
    name: '2x3',
    color,
    layout: [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 0, y: 2, z: 0 },
      { x: 1, y: 2, z: 0 },
    ],
  }),

  // C6 - C shape
  C: (id: string, color: string): Piece => ({
    id,
    name: 'C-Hex',
    color,
    layout: [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 0, y: 2, z: 0 },
      { x: 1, y: 2, z: 0 },
    ],
  }),

  // R6 - R-like shape
  R: (id: string, color: string): Piece => ({
    id,
    name: 'R-Hex',
    color,
    layout: [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 0, y: 2, z: 0 },
      { x: 2, y: 0, z: 0 },
    ],
  }),

  // Fork - Y with extra prong
  Fork: (id: string, color: string): Piece => ({
    id,
    name: 'Fork',
    color,
    layout: [
      { x: 0, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 2, y: 1, z: 0 },
      { x: 1, y: 2, z: 0 },
    ],
  }),

  // Bolt - Lightning bolt shape
  Bolt: (id: string, color: string): Piece => ({
    id,
    name: 'Bolt',
    color,
    layout: [
      { x: 2, y: 0, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 2, y: 1, z: 0 },
      { x: 0, y: 2, z: 0 },
      { x: 1, y: 2, z: 0 },
      { x: 0, y: 3, z: 0 },
    ],
  }),

  // H6 - H shape
  H: (id: string, color: string): Piece => ({
    id,
    name: 'H-Hex',
    color,
    layout: [
      { x: 0, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 2, y: 1, z: 0 },
      { x: 0, y: 2, z: 0 },
    ],
  }),

  // Wing - Asymmetric wing shape
  Wing: (id: string, color: string): Piece => ({
    id,
    name: 'Wing',
    color,
    layout: [
      { x: 1, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 },
      { x: 3, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 0, y: 2, z: 0 },
    ],
  }),

  // Claw - Claw-like shape
  Claw: (id: string, color: string): Piece => ({
    id,
    name: 'Claw',
    color,
    layout: [
      { x: 0, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 2, y: 1, z: 0 },
      { x: 2, y: 2, z: 0 },
    ],
  }),

  // Tree - Tree-like shape
  Tree: (id: string, color: string): Piece => ({
    id,
    name: 'Tree',
    color,
    layout: [
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 2, y: 1, z: 0 },
      { x: 1, y: 2, z: 0 },
      { x: 1, y: 3, z: 0 },
    ],
  }),

  // Arrow - Arrow pointing up
  Arrow: (id: string, color: string): Piece => ({
    id,
    name: 'Arrow',
    color,
    layout: [
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 2, y: 1, z: 0 },
      { x: 0, y: 2, z: 0 },
      { x: 2, y: 2, z: 0 },
    ],
  }),

  // Pistol - Gun-like shape
  Pistol: (id: string, color: string): Piece => ({
    id,
    name: 'Pistol',
    color,
    layout: [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 2, y: 1, z: 0 },
      { x: 3, y: 1, z: 0 },
      { x: 1, y: 2, z: 0 },
    ],
  }),
}

// ========================================
// HEPTOMINOES (7 cells each)
// 108 free heptominoes exist; we define 25 varied shapes
// ========================================

export const HEPTOMINO = {
  // I7 - Straight line
  I: (id: string, color: string): Piece => ({
    id,
    name: 'I-Hept',
    color,
    layout: [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 },
      { x: 3, y: 0, z: 0 },
      { x: 4, y: 0, z: 0 },
      { x: 5, y: 0, z: 0 },
      { x: 6, y: 0, z: 0 },
    ],
  }),

  // L7 - Extended L
  L: (id: string, color: string): Piece => ({
    id,
    name: 'L-Hept',
    color,
    layout: [
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 0, y: 2, z: 0 },
      { x: 0, y: 3, z: 0 },
      { x: 0, y: 4, z: 0 },
      { x: 0, y: 5, z: 0 },
      { x: 1, y: 5, z: 0 },
    ],
  }),

  // T7 - Extended T
  T: (id: string, color: string): Piece => ({
    id,
    name: 'T-Hept',
    color,
    layout: [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 },
      { x: 3, y: 0, z: 0 },
      { x: 4, y: 0, z: 0 },
      { x: 2, y: 1, z: 0 },
      { x: 2, y: 2, z: 0 },
    ],
  }),

  // Cross7 - Large cross
  Cross: (id: string, color: string): Piece => ({
    id,
    name: 'Cross7',
    color,
    layout: [
      { x: 1, y: 0, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 0, y: 2, z: 0 },
      { x: 1, y: 2, z: 0 },
      { x: 2, y: 2, z: 0 },
      { x: 1, y: 3, z: 0 },
      { x: 1, y: 4, z: 0 },
    ],
  }),

  // H7 - H shape extended
  H: (id: string, color: string): Piece => ({
    id,
    name: 'H-Hept',
    color,
    layout: [
      { x: 0, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 2, y: 1, z: 0 },
      { x: 0, y: 2, z: 0 },
      { x: 2, y: 2, z: 0 },
    ],
  }),

  // Stairs7 - Extended staircase
  Stairs: (id: string, color: string): Piece => ({
    id,
    name: 'Stairs7',
    color,
    layout: [
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 1, y: 2, z: 0 },
      { x: 2, y: 2, z: 0 },
      { x: 2, y: 3, z: 0 },
      { x: 3, y: 3, z: 0 },
    ],
  }),

  // Snake7 - Extended serpentine
  Snake: (id: string, color: string): Piece => ({
    id,
    name: 'Snake7',
    color,
    layout: [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 1, y: 2, z: 0 },
      { x: 2, y: 2, z: 0 },
      { x: 2, y: 3, z: 0 },
      { x: 3, y: 3, z: 0 },
    ],
  }),

  // W7 - W shape extended
  W: (id: string, color: string): Piece => ({
    id,
    name: 'W-Hept',
    color,
    layout: [
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 1, y: 2, z: 0 },
      { x: 2, y: 2, z: 0 },
      { x: 2, y: 3, z: 0 },
      { x: 2, y: 4, z: 0 },
    ],
  }),

  // Y7 - Y shape extended
  Y: (id: string, color: string): Piece => ({
    id,
    name: 'Y-Hept',
    color,
    layout: [
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 2, y: 1, z: 0 },
      { x: 1, y: 2, z: 0 },
      { x: 1, y: 3, z: 0 },
      { x: 1, y: 4, z: 0 },
    ],
  }),

  // U7 - U shape extended
  U: (id: string, color: string): Piece => ({
    id,
    name: 'U-Hept',
    color,
    layout: [
      { x: 0, y: 0, z: 0 },
      { x: 3, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 2, y: 1, z: 0 },
      { x: 3, y: 1, z: 0 },
      { x: 1, y: 2, z: 0 },
    ],
  }),

  // Tree7 - Tree shape
  Tree: (id: string, color: string): Piece => ({
    id,
    name: 'Tree7',
    color,
    layout: [
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 2, y: 1, z: 0 },
      { x: 1, y: 2, z: 0 },
      { x: 1, y: 3, z: 0 },
      { x: 1, y: 4, z: 0 },
    ],
  }),

  // Anchor - Anchor shape
  Anchor: (id: string, color: string): Piece => ({
    id,
    name: 'Anchor',
    color,
    layout: [
      { x: 1, y: 0, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 1, y: 2, z: 0 },
      { x: 0, y: 3, z: 0 },
      { x: 1, y: 3, z: 0 },
      { x: 2, y: 3, z: 0 },
      { x: 1, y: 4, z: 0 },
    ],
  }),

  // Hook7 - Extended hook
  Hook: (id: string, color: string): Piece => ({
    id,
    name: 'Hook7',
    color,
    layout: [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 1, y: 2, z: 0 },
      { x: 1, y: 3, z: 0 },
      { x: 1, y: 4, z: 0 },
      { x: 2, y: 4, z: 0 },
    ],
  }),

  // Claw7 - Claw shape
  Claw: (id: string, color: string): Piece => ({
    id,
    name: 'Claw7',
    color,
    layout: [
      { x: 0, y: 0, z: 0 },
      { x: 3, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 2, y: 1, z: 0 },
      { x: 3, y: 1, z: 0 },
      { x: 1, y: 2, z: 0 },
    ],
  }),

  // C7 - C shape extended
  C: (id: string, color: string): Piece => ({
    id,
    name: 'C-Hept',
    color,
    layout: [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 0, y: 2, z: 0 },
      { x: 0, y: 3, z: 0 },
      { x: 1, y: 3, z: 0 },
    ],
  }),

  // N7 - N shape extended
  N: (id: string, color: string): Piece => ({
    id,
    name: 'N-Hept',
    color,
    layout: [
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 1, y: 2, z: 0 },
      { x: 1, y: 3, z: 0 },
      { x: 2, y: 3, z: 0 },
      { x: 2, y: 4, z: 0 },
    ],
  }),

  // F7 - F pentomino extended
  F: (id: string, color: string): Piece => ({
    id,
    name: 'F-Hept',
    color,
    layout: [
      { x: 1, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 1, y: 2, z: 0 },
      { x: 1, y: 3, z: 0 },
      { x: 1, y: 4, z: 0 },
    ],
  }),

  // P7 - P shape extended
  P: (id: string, color: string): Piece => ({
    id,
    name: 'P-Hept',
    color,
    layout: [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 0, y: 2, z: 0 },
      { x: 0, y: 3, z: 0 },
      { x: 0, y: 4, z: 0 },
    ],
  }),

  // Arrow7 - Arrow shape
  Arrow: (id: string, color: string): Piece => ({
    id,
    name: 'Arrow7',
    color,
    layout: [
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 2, y: 1, z: 0 },
      { x: 0, y: 2, z: 0 },
      { x: 2, y: 2, z: 0 },
      { x: 1, y: 3, z: 0 },
    ],
  }),

  // Fork7 - Trident/fork shape
  Fork: (id: string, color: string): Piece => ({
    id,
    name: 'Fork7',
    color,
    layout: [
      { x: 0, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 },
      { x: 4, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 2, y: 1, z: 0 },
      { x: 4, y: 1, z: 0 },
      { x: 2, y: 2, z: 0 },
    ],
  }),

  // Bolt7 - Lightning bolt extended
  Bolt: (id: string, color: string): Piece => ({
    id,
    name: 'Bolt7',
    color,
    layout: [
      { x: 2, y: 0, z: 0 },
      { x: 3, y: 0, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 2, y: 1, z: 0 },
      { x: 0, y: 2, z: 0 },
      { x: 1, y: 2, z: 0 },
      { x: 0, y: 3, z: 0 },
    ],
  }),

  // E7 - E shape
  E: (id: string, color: string): Piece => ({
    id,
    name: 'E-Hept',
    color,
    layout: [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 0, y: 2, z: 0 },
      { x: 1, y: 2, z: 0 },
      { x: 0, y: 3, z: 0 },
      { x: 0, y: 4, z: 0 },
    ],
  }),

  // Boomerang - Boomerang shape
  Boomerang: (id: string, color: string): Piece => ({
    id,
    name: 'Boomerang',
    color,
    layout: [
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 1, y: 2, z: 0 },
      { x: 1, y: 3, z: 0 },
      { x: 2, y: 3, z: 0 },
      { x: 2, y: 4, z: 0 },
    ],
  }),

  // Zigzag - Zigzag pattern
  Zigzag: (id: string, color: string): Piece => ({
    id,
    name: 'Zigzag',
    color,
    layout: [
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 1, y: 2, z: 0 },
      { x: 1, y: 3, z: 0 },
      { x: 2, y: 3, z: 0 },
      { x: 2, y: 4, z: 0 },
    ],
  }),

  // Wing7 - Wing shape
  Wing: (id: string, color: string): Piece => ({
    id,
    name: 'Wing7',
    color,
    layout: [
      { x: 1, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 },
      { x: 3, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 2, y: 1, z: 0 },
      { x: 0, y: 2, z: 0 },
    ],
  }),
}

// Helper to get all hexomino factories
export const HEXOMINO_KEYS = Object.keys(HEXOMINO) as (keyof typeof HEXOMINO)[]

// Helper to get all heptomino factories
export const HEPTOMINO_KEYS = Object.keys(
  HEPTOMINO,
) as (keyof typeof HEPTOMINO)[]
