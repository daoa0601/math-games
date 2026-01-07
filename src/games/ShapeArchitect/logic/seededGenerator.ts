/**
 * Seeded Level Generator for ShapeArchitect
 *
 * Generates puzzles by starting with cohesive base shapes (squares, rectangles,
 * L-shapes, T-shapes, etc.) and breaking them into multiple pieces.
 * Difficulty is determined by the number of pieces.
 *
 * Algorithm:
 * 1. Select a base shape template based on difficulty
 * 2. Use region-growing to split the shape into N connected pieces
 * 3. Convert pieces to game format
 * 4. Validate and return
 *
 * @example
 * import { getDailyShapeArchitectLevel } from './seededGenerator';
 *
 * const level = getDailyShapeArchitectLevel('2025-01-01');
 * // Always returns the same level for Jan 1, 2025
 */

import type { LevelConfig, Piece, Position3D } from './types';
import type { SeededRandom } from '@/shared/utils';
import { createSeededRandom } from '@/shared/utils';
import { presetLevels } from './presets';

// ============================================================================
// Types
// ============================================================================

interface BaseShape {
  name: string;
  cells: Position3D[];
  minPieces: number;
  maxPieces: number;
}

// ============================================================================
// Constants
// ============================================================================

const PIECE_COLORS = [
  '#00BCD4', // Cyan
  '#FFEB3B', // Yellow
  '#9C27B0', // Purple
  '#4CAF50', // Green
  '#F44336', // Red
  '#2196F3', // Blue
  '#FF9800', // Orange
  '#E91E63', // Pink
  '#26A69A', // Teal
  '#795548', // Brown
];

/**
 * Piece count ranges by difficulty.
 * More pieces = harder puzzle.
 */
const PIECE_COUNT_RANGE: Record<'easy' | 'medium' | 'hard', [number, number]> = {
  easy: [3, 4],
  medium: [5, 6],
  hard: [7, 8],
};

/**
 * Maximum retry attempts before falling back to preset.
 */
const MAX_RETRY_ATTEMPTS = 10;

// ============================================================================
// Base Shape Templates
// ============================================================================

/**
 * Generate a rectangle shape.
 */
function createRectangle(width: number, height: number): Position3D[] {
  const cells: Position3D[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      cells.push({ x, y, z: 0 });
    }
  }
  return cells;
}

/**
 * Generate an L-shape.
 * Two rectangles joined at a corner.
 */
function createLShape(armLength: number, armWidth: number): Position3D[] {
  const cells: Position3D[] = [];
  // Vertical arm
  for (let y = 0; y < armLength; y++) {
    for (let x = 0; x < armWidth; x++) {
      cells.push({ x, y, z: 0 });
    }
  }
  // Horizontal arm (extending right from bottom)
  for (let x = armWidth; x < armLength; x++) {
    for (let y = 0; y < armWidth; y++) {
      cells.push({ x, y, z: 0 });
    }
  }
  return cells;
}

/**
 * Generate a T-shape.
 */
function createTShape(stemLength: number, topWidth: number, thickness: number): Position3D[] {
  const cells: Position3D[] = [];
  // Top bar
  const topStart = Math.floor((topWidth - thickness) / 2);
  for (let x = 0; x < topWidth; x++) {
    for (let y = stemLength; y < stemLength + thickness; y++) {
      cells.push({ x, y, z: 0 });
    }
  }
  // Stem
  for (let y = 0; y < stemLength; y++) {
    for (let x = topStart; x < topStart + thickness; x++) {
      cells.push({ x, y, z: 0 });
    }
  }
  return cells;
}

/**
 * Generate a plus/cross shape.
 */
function createPlusShape(armLength: number, thickness: number): Position3D[] {
  const cells: Position3D[] = [];
  const totalSize = armLength * 2 + thickness;

  for (let y = 0; y < totalSize; y++) {
    for (let x = 0; x < totalSize; x++) {
      // Check if in horizontal arm or vertical arm
      const inHorizontal = y >= armLength && y < armLength + thickness;
      const inVertical = x >= armLength && x < armLength + thickness;
      if (inHorizontal || inVertical) {
        cells.push({ x, y, z: 0 });
      }
    }
  }
  return cells;
}

/**
 * Generate a U-shape.
 */
function createUShape(width: number, height: number, thickness: number): Position3D[] {
  const cells: Position3D[] = [];
  // Left arm
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < thickness; x++) {
      cells.push({ x, y, z: 0 });
    }
  }
  // Right arm
  for (let y = 0; y < height; y++) {
    for (let x = width - thickness; x < width; x++) {
      cells.push({ x, y, z: 0 });
    }
  }
  // Bottom connecting bar
  for (let x = thickness; x < width - thickness; x++) {
    for (let y = 0; y < thickness; y++) {
      cells.push({ x, y, z: 0 });
    }
  }
  return cells;
}

/**
 * Generate an H-shape.
 */
function createHShape(width: number, height: number, thickness: number): Position3D[] {
  const cells: Position3D[] = [];
  const midY = Math.floor((height - thickness) / 2);

  // Left arm (full height)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < thickness; x++) {
      cells.push({ x, y, z: 0 });
    }
  }
  // Right arm (full height)
  for (let y = 0; y < height; y++) {
    for (let x = width - thickness; x < width; x++) {
      cells.push({ x, y, z: 0 });
    }
  }
  // Middle connecting bar
  for (let x = thickness; x < width - thickness; x++) {
    for (let y = midY; y < midY + thickness; y++) {
      cells.push({ x, y, z: 0 });
    }
  }
  return cells;
}

/**
 * Get base shapes appropriate for the given piece count.
 * Larger shapes support more pieces.
 */
function getBaseShapes(pieceCount: number): BaseShape[] {
  const shapes: BaseShape[] = [];

  // Small shapes for 3-4 pieces
  if (pieceCount <= 4) {
    shapes.push({ name: '4x4 Square', cells: createRectangle(4, 4), minPieces: 3, maxPieces: 4 });
    shapes.push({ name: '6x3 Rectangle', cells: createRectangle(6, 3), minPieces: 3, maxPieces: 4 });
    shapes.push({ name: '8x2 Strip', cells: createRectangle(8, 2), minPieces: 3, maxPieces: 4 });
    shapes.push({ name: 'Small L', cells: createLShape(4, 2), minPieces: 3, maxPieces: 4 });
  }

  // Medium shapes for 5-6 pieces
  if (pieceCount >= 4 && pieceCount <= 6) {
    shapes.push({ name: '5x5 Square', cells: createRectangle(5, 5), minPieces: 4, maxPieces: 6 });
    shapes.push({ name: '6x4 Rectangle', cells: createRectangle(6, 4), minPieces: 4, maxPieces: 6 });
    shapes.push({ name: '8x3 Rectangle', cells: createRectangle(8, 3), minPieces: 4, maxPieces: 6 });
    shapes.push({ name: 'Medium L', cells: createLShape(5, 2), minPieces: 4, maxPieces: 6 });
    shapes.push({ name: 'T-Shape', cells: createTShape(3, 5, 2), minPieces: 4, maxPieces: 6 });
    shapes.push({ name: 'Plus Shape', cells: createPlusShape(2, 2), minPieces: 4, maxPieces: 6 });
  }

  // Large shapes for 7-8 pieces
  if (pieceCount >= 6) {
    shapes.push({ name: '6x6 Square', cells: createRectangle(6, 6), minPieces: 6, maxPieces: 9 });
    shapes.push({ name: '8x4 Rectangle', cells: createRectangle(8, 4), minPieces: 6, maxPieces: 8 });
    shapes.push({ name: '10x3 Rectangle', cells: createRectangle(10, 3), minPieces: 6, maxPieces: 8 });
    shapes.push({ name: 'Large L', cells: createLShape(6, 2), minPieces: 5, maxPieces: 8 });
    shapes.push({ name: 'Large T', cells: createTShape(4, 6, 2), minPieces: 5, maxPieces: 8 });
    shapes.push({ name: 'Large Plus', cells: createPlusShape(3, 2), minPieces: 5, maxPieces: 8 });
    shapes.push({ name: 'U-Shape', cells: createUShape(6, 4, 2), minPieces: 5, maxPieces: 8 });
    shapes.push({ name: 'H-Shape', cells: createHShape(6, 5, 2), minPieces: 5, maxPieces: 8 });
  }

  // Filter to shapes that support the requested piece count
  return shapes.filter(s => pieceCount >= s.minPieces && pieceCount <= s.maxPieces);
}

// ============================================================================
// Shape Dissection Algorithm
// ============================================================================

/**
 * Get adjacent cells (4-connected neighbors).
 */
function getNeighbors(pos: Position3D, cellSet: Set<string>): Position3D[] {
  const directions = [
    { x: 1, y: 0, z: 0 },
    { x: -1, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 },
    { x: 0, y: -1, z: 0 },
  ];

  const neighbors: Position3D[] = [];
  for (const dir of directions) {
    const key = `${pos.x + dir.x},${pos.y + dir.y},${pos.z + dir.z}`;
    if (cellSet.has(key)) {
      neighbors.push({ x: pos.x + dir.x, y: pos.y + dir.y, z: pos.z + dir.z });
    }
  }
  return neighbors;
}

/**
 * Check if a set of cells forms a connected region.
 */
function isConnected(cells: Position3D[]): boolean {
  if (cells.length <= 1) return true;

  const cellSet = new Set(cells.map(c => `${c.x},${c.y},${c.z}`));
  const visited = new Set<string>();
  const queue: Position3D[] = [cells[0]];
  visited.add(`${cells[0].x},${cells[0].y},${cells[0].z}`);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const neighbors = getNeighbors(current, cellSet);

    for (const neighbor of neighbors) {
      const key = `${neighbor.x},${neighbor.y},${neighbor.z}`;
      if (!visited.has(key)) {
        visited.add(key);
        queue.push(neighbor);
      }
    }
  }

  return visited.size === cells.length;
}

/**
 * Position key helper.
 */
function posKey(pos: Position3D): string {
  return `${pos.x},${pos.y},${pos.z}`;
}

/**
 * Parse position key back to Position3D.
 */
function parseKey(key: string): Position3D {
  const [x, y, z] = key.split(',').map(Number);
  return { x, y, z };
}

/**
 * Split a shape into N connected pieces using region-growing.
 *
 * Algorithm:
 * 1. Select N random seed points spread across the shape
 * 2. Grow regions from each seed by claiming neighboring cells
 * 3. Continue until all cells are assigned
 * 4. Validate that each region is connected
 *
 * @returns Array of cell arrays (one per piece), or null if dissection fails
 */
function dissectShape(
  cells: Position3D[],
  numPieces: number,
  rng: SeededRandom
): Position3D[][] | null {
  if (cells.length < numPieces) return null;

  const cellSet = new Set(cells.map(c => posKey(c)));
  const assigned = new Map<string, number>(); // cell -> region index
  const regions: Set<string>[] = Array.from({ length: numPieces }, () => new Set());
  const frontiers: Set<string>[] = Array.from({ length: numPieces }, () => new Set());

  // Select seed points spread across the shape
  const shuffledCells = rng.shuffle([...cells]);

  for (let i = 0; i < numPieces && i < shuffledCells.length; i++) {
    // Pick the i-th cell from shuffled list as seed
    const seed = shuffledCells[i];
    const key = posKey(seed);
    regions[i].add(key);
    assigned.set(key, i);

    // Add neighbors to frontier
    const neighbors = getNeighbors(seed, cellSet);
    for (const n of neighbors) {
      const nKey = posKey(n);
      if (!assigned.has(nKey)) {
        frontiers[i].add(nKey);
      }
    }
  }

  // Region growing: each region claims cells from its frontier
  let maxIterations = cells.length * 2;
  while (assigned.size < cells.length && maxIterations-- > 0) {
    // Find regions that still have frontier cells
    const activeRegions = regions
      .map((_, i) => i)
      .filter(i => frontiers[i].size > 0);

    if (activeRegions.length === 0) break;

    // Each active region claims one cell from its frontier
    const shuffledActive = rng.shuffle(activeRegions);

    for (const regionIdx of shuffledActive) {
      if (frontiers[regionIdx].size === 0) continue;

      // Convert frontier to array and pick one randomly
      const frontierArray = Array.from(frontiers[regionIdx]);
      const candidateKey = rng.pick(frontierArray);
      frontiers[regionIdx].delete(candidateKey);

      // Skip if already assigned (another region claimed it)
      if (assigned.has(candidateKey)) continue;

      // Check if assigning this cell would leave other regions unable to grow
      // (Simple heuristic: ensure remaining unassigned cells stay connected)
      const candidate = parseKey(candidateKey);

      // Assign the cell
      regions[regionIdx].add(candidateKey);
      assigned.set(candidateKey, regionIdx);

      // Add new neighbors to frontier
      const neighbors = getNeighbors(candidate, cellSet);
      for (const n of neighbors) {
        const nKey = posKey(n);
        if (!assigned.has(nKey)) {
          frontiers[regionIdx].add(nKey);
        }
      }
    }
  }

  // Check if all cells were assigned
  if (assigned.size !== cells.length) {
    // Assign remaining cells to nearest regions
    for (const cell of cells) {
      const key = posKey(cell);
      if (!assigned.has(key)) {
        // Find adjacent assigned cell and join its region
        const neighbors = getNeighbors(cell, cellSet);
        for (const n of neighbors) {
          const nKey = posKey(n);
          if (assigned.has(nKey)) {
            const regionIdx = assigned.get(nKey)!;
            regions[regionIdx].add(key);
            assigned.set(key, regionIdx);
            break;
          }
        }
      }
    }
  }

  // Convert regions to arrays and validate connectivity
  const result: Position3D[][] = [];
  for (const region of regions) {
    const regionCells = Array.from(region).map(k => parseKey(k));
    if (regionCells.length === 0) return null; // Empty region = failure
    if (!isConnected(regionCells)) return null; // Disconnected = failure
    result.push(regionCells);
  }

  // Ensure minimum piece size (at least 2 cells per piece)
  // This allows for more flexible dissection while keeping pieces meaningful
  const minSize = 2;
  if (result.some(r => r.length < minSize)) {
    return null;
  }

  return result;
}

// ============================================================================
// Piece Conversion
// ============================================================================

/**
 * Normalize a piece's layout to start at origin (0,0,0).
 */
function normalizeLayout(cells: Position3D[]): Position3D[] {
  if (cells.length === 0) return cells;

  const minX = Math.min(...cells.map(c => c.x));
  const minY = Math.min(...cells.map(c => c.y));
  const minZ = Math.min(...cells.map(c => c.z));

  return cells.map(c => ({
    x: c.x - minX,
    y: c.y - minY,
    z: c.z - minZ,
  }));
}

/**
 * Convert dissected regions to Piece objects.
 */
function convertToPieces(regions: Position3D[][], rng: SeededRandom): Piece[] {
  const shuffledColors = rng.shuffle([...PIECE_COLORS]);

  return regions.map((region, i) => ({
    id: `piece_${i}`,
    name: `Piece ${i + 1}`,
    color: shuffledColors[i % shuffledColors.length],
    layout: normalizeLayout(region),
  }));
}

// ============================================================================
// Level Generation
// ============================================================================

/**
 * Calculate the bounding box of a shape and add padding.
 */
function calculateGridSize(cells: Position3D[]): [number, number, number] {
  if (cells.length === 0) return [4, 4, 1];

  const maxX = Math.max(...cells.map(c => c.x));
  const maxY = Math.max(...cells.map(c => c.y));
  const maxZ = Math.max(...cells.map(c => c.z));

  // Add 2 cells padding on each side
  return [maxX + 3, maxY + 3, Math.max(1, maxZ + 1)];
}

/**
 * Offset cells to center them in the grid (with padding).
 */
function centerShape(cells: Position3D[]): Position3D[] {
  // Add 1 cell offset to create border around the shape
  return cells.map(c => ({
    x: c.x + 1,
    y: c.y + 1,
    z: c.z,
  }));
}

/**
 * Generate a puzzle by selecting a cohesive shape and breaking it into pieces.
 *
 * @returns LevelConfig or null if generation fails
 */
export function generateCohesivePuzzle(
  rng: SeededRandom,
  difficulty: 'easy' | 'medium' | 'hard'
): LevelConfig | null {
  // 1. Determine piece count based on difficulty
  const [minPieces, maxPieces] = PIECE_COUNT_RANGE[difficulty];
  const pieceCount = rng.nextInt(minPieces, maxPieces);

  // 2. Select a base shape appropriate for this piece count
  const availableShapes = getBaseShapes(pieceCount);
  if (availableShapes.length === 0) return null;

  const baseShape = rng.pick(availableShapes);

  // 3. Dissect the shape into pieces
  const regions = dissectShape(baseShape.cells, pieceCount, rng);
  if (!regions) return null;

  // 4. Convert regions to pieces
  const pieces = convertToPieces(regions, rng);

  // Shuffle pieces so solution order isn't obvious
  const shuffledPieces = rng.shuffle(pieces);

  // 5. Calculate grid size and center the shape
  const centeredCells = centerShape(baseShape.cells);
  const gridSize = calculateGridSize(centeredCells);

  return {
    id: `cohesive_${rng.seed}`,
    name: `${baseShape.name} (${pieceCount} pieces)`,
    type: '2D',
    gridSize,
    targetVoxels: centeredCells,
    pieces: shuffledPieces,
    difficulty,
  };
}

/**
 * Generate a guaranteed-solvable level with retry logic.
 * Falls back to preset if generation consistently fails.
 */
export function generateGuaranteedSolvableWithRetry(
  rng: SeededRandom,
  difficulty: 'easy' | 'medium' | 'hard'
): LevelConfig {
  for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt++) {
    const result = generateCohesivePuzzle(rng, difficulty);
    if (result) {
      return result;
    }
    // Advance RNG state for next attempt
    rng.next();
  }

  // Fall back to preset
  return getFallbackPreset(rng, difficulty);
}

// ============================================================================
// Fallback Preset Selection
// ============================================================================

/**
 * Get a fallback preset level matching the specified difficulty.
 */
function getFallbackPreset(
  rng: SeededRandom,
  difficulty: 'easy' | 'medium' | 'hard'
): LevelConfig {
  // Filter presets by difficulty (only 2D presets)
  const matchingPresets = presetLevels.filter(
    (level) => level.difficulty === difficulty && level.type === '2D'
  );

  // If no exact match, use any 2D preset
  const candidates =
    matchingPresets.length > 0
      ? matchingPresets
      : presetLevels.filter((level) => level.type === '2D');

  // Use seeded selection for reproducibility
  const selected = rng.pick(candidates);

  return {
    ...selected,
    id: `daily_fallback_${rng.seed}`,
    name: `Daily Challenge (${selected.name})`,
  };
}

// ============================================================================
// Daily Challenge API
// ============================================================================

/**
 * Get today's daily challenge level for ShapeArchitect.
 * Always returns the same level for the same date.
 * Uses cohesive shape generation for interesting puzzles.
 *
 * @param date - Date string in YYYY-MM-DD format (defaults to today)
 * @returns Level config for daily challenge (guaranteed solvable)
 */
export function getDailyShapeArchitectLevel(date?: string): LevelConfig {
  const dateStr = date ?? new Date().toISOString().split('T')[0];
  const baseSeed = `${dateStr}-shape-architect`;
  const rng = createSeededRandom(baseSeed);

  // Daily challenges are always medium difficulty
  return generateGuaranteedSolvableWithRetry(rng, 'medium');
}

/**
 * Preview a future daily level (for testing/admin).
 *
 * @param daysFromNow - Number of days in the future (0 = today)
 * @returns Level config for that date
 */
export function previewDailyLevel(daysFromNow: number = 0): LevelConfig {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  const dateStr = date.toISOString().split('T')[0];
  return getDailyShapeArchitectLevel(dateStr);
}

// ============================================================================
// Testing Utilities
// ============================================================================

/**
 * Exported constants for testing purposes.
 */
export const GENERATOR_CONSTANTS = {
  MAX_RETRY_ATTEMPTS,
  PIECE_COUNT_RANGE,
} as const;

/**
 * Generate a validated level directly (for testing).
 */
export function generateValidatedLevelForTesting(
  baseSeed: string,
  difficulty: 'easy' | 'medium' | 'hard'
): LevelConfig {
  const rng = createSeededRandom(baseSeed);
  return generateGuaranteedSolvableWithRetry(rng, difficulty);
}
