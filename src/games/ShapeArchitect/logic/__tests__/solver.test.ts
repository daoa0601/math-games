import { describe, it, expect } from 'vitest';
import {
    solvePuzzle,
    isSolvable,
    generate2DRotations,
    generate3DRotations,
    type SolverResult,
} from '../solver';
import type { LevelConfig, Piece, Position3D } from '../types';

// ========================================
// Test Fixtures
// ========================================

const createTestPiece = (id: string, layout: Position3D[]): Piece => ({
    id,
    name: `Piece ${id}`,
    color: '#ff0000',
    layout,
});

const createOBlock = (id: string): Piece => createTestPiece(id, [
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 },
    { x: 1, y: 1, z: 0 },
]);

const createIBlock = (id: string): Piece => createTestPiece(id, [
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
    { x: 2, y: 0, z: 0 },
    { x: 3, y: 0, z: 0 },
]);

const createLBlock = (id: string): Piece => createTestPiece(id, [
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
    { x: 2, y: 0, z: 0 },
    { x: 2, y: 1, z: 0 },
]);

const createTBlock = (id: string): Piece => createTestPiece(id, [
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
    { x: 2, y: 0, z: 0 },
    { x: 1, y: 1, z: 0 },
]);

// 3D corner piece for 3D tests
const create3DCorner = (id: string): Piece => createTestPiece(id, [
    { x: 0, y: 0, z: 0 },
    { x: 1, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 },
    { x: 0, y: 0, z: 1 },
]);

const createTestLevel = (overrides: Partial<LevelConfig> = {}): LevelConfig => ({
    id: 'test-level',
    name: 'Test Level',
    type: '2D',
    gridSize: [6, 6, 1],
    targetVoxels: [],
    pieces: [],
    difficulty: 'easy',
    ...overrides,
});

// ========================================
// Rotation Generation Tests
// ========================================

describe('generate2DRotations', () => {
    it('generates exactly 4 rotations', () => {
        const rotations = generate2DRotations();
        expect(rotations).toHaveLength(4);
    });

    it('all rotations have x=0 and y=0', () => {
        const rotations = generate2DRotations();
        expect(rotations.every(r => r.x === 0 && r.y === 0)).toBe(true);
    });

    it('z rotations are 0, 90, 180, 270', () => {
        const rotations = generate2DRotations();
        const zValues = rotations.map(r => r.z).sort((a, b) => a - b);
        expect(zValues).toEqual([0, 90, 180, 270]);
    });
});

describe('generate3DRotations', () => {
    it('generates exactly 24 unique rotations', () => {
        const rotations = generate3DRotations();
        expect(rotations).toHaveLength(24);
    });

    it('all rotation angles are multiples of 90', () => {
        const rotations = generate3DRotations();
        const validAngles = [0, 90, 180, 270];
        for (const r of rotations) {
            expect(validAngles).toContain(r.x);
            expect(validAngles).toContain(r.y);
            expect(validAngles).toContain(r.z);
        }
    });
});

// ========================================
// Simple Solvable Puzzle Tests
// ========================================

describe('solvePuzzle - Solvable Cases', () => {
    it('solves simple 2x2 with single O-block', () => {
        const level = createTestLevel({
            gridSize: [3, 3, 1],
            targetVoxels: [
                { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 },
                { x: 0, y: 1, z: 0 }, { x: 1, y: 1, z: 0 },
            ],
            pieces: [createOBlock('o1')],
        });

        const result = solvePuzzle(level);

        expect(result.solvable).toBe(true);
        expect(result.timedOut).toBe(false);
        expect(result.solution).toBeDefined();
        expect(result.solution).toHaveLength(1);
        expect(result.solution![0].pieceId).toBe('o1');
    });

    it('solves 4x4 grid with 4 O-blocks', () => {
        const level = createTestLevel({
            gridSize: [6, 6, 1],
            targetVoxels: [
                // 4x4 = 16 cells
                { x: 1, y: 1, z: 0 }, { x: 2, y: 1, z: 0 }, { x: 3, y: 1, z: 0 }, { x: 4, y: 1, z: 0 },
                { x: 1, y: 2, z: 0 }, { x: 2, y: 2, z: 0 }, { x: 3, y: 2, z: 0 }, { x: 4, y: 2, z: 0 },
                { x: 1, y: 3, z: 0 }, { x: 2, y: 3, z: 0 }, { x: 3, y: 3, z: 0 }, { x: 4, y: 3, z: 0 },
                { x: 1, y: 4, z: 0 }, { x: 2, y: 4, z: 0 }, { x: 3, y: 4, z: 0 }, { x: 4, y: 4, z: 0 },
            ],
            pieces: [
                createOBlock('o1'),
                createOBlock('o2'),
                createOBlock('o3'),
                createOBlock('o4'),
            ],
        });

        const result = solvePuzzle(level);

        expect(result.solvable).toBe(true);
        expect(result.solution).toBeDefined();
        expect(result.solution).toHaveLength(4);

        // Verify all pieces are used
        const usedPieces = new Set(result.solution!.map(s => s.pieceId));
        expect(usedPieces.size).toBe(4);
    });

    it('solves 4x4 strip with 4 I-blocks horizontally', () => {
        const level = createTestLevel({
            gridSize: [10, 3, 1],
            targetVoxels: [
                // 8x2 = 16 cells for 4 I-blocks
                { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, { x: 2, y: 0, z: 0 }, { x: 3, y: 0, z: 0 },
                { x: 4, y: 0, z: 0 }, { x: 5, y: 0, z: 0 }, { x: 6, y: 0, z: 0 }, { x: 7, y: 0, z: 0 },
                { x: 0, y: 1, z: 0 }, { x: 1, y: 1, z: 0 }, { x: 2, y: 1, z: 0 }, { x: 3, y: 1, z: 0 },
                { x: 4, y: 1, z: 0 }, { x: 5, y: 1, z: 0 }, { x: 6, y: 1, z: 0 }, { x: 7, y: 1, z: 0 },
            ],
            pieces: [
                createIBlock('i1'),
                createIBlock('i2'),
                createIBlock('i3'),
                createIBlock('i4'),
            ],
        });

        const result = solvePuzzle(level);

        expect(result.solvable).toBe(true);
        expect(result.solution).toHaveLength(4);
    });
});

// ========================================
// Unsolvable Puzzle Tests
// ========================================

describe('solvePuzzle - Unsolvable Cases', () => {
    it('returns unsolvable when volume mismatch (pieces too large)', () => {
        const level = createTestLevel({
            gridSize: [3, 3, 1],
            targetVoxels: [
                { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 },
                // Only 2 target cells for a 4-cell O-block
            ],
            pieces: [createOBlock('o1')],
        });

        const result = solvePuzzle(level);

        expect(result.solvable).toBe(false);
        expect(result.timedOut).toBe(false);
        expect(result.solution).toBeUndefined();
        expect(result.searchedStates).toBe(0); // Quick volume rejection
    });

    it('returns unsolvable when volume mismatch (pieces too small)', () => {
        const level = createTestLevel({
            gridSize: [5, 5, 1],
            targetVoxels: [
                { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }, { x: 2, y: 0, z: 0 },
                { x: 0, y: 1, z: 0 }, { x: 1, y: 1, z: 0 }, { x: 2, y: 1, z: 0 },
                // 6 target cells but O-block only has 4 cells
            ],
            pieces: [createOBlock('o1')],
        });

        const result = solvePuzzle(level);

        expect(result.solvable).toBe(false);
        expect(result.searchedStates).toBe(0);
    });

    it('returns unsolvable when shapes incompatible (checkerboard pattern)', () => {
        // Checkerboard pattern is unsolvable with O-blocks (2x2 squares)
        const level = createTestLevel({
            gridSize: [5, 5, 1],
            targetVoxels: [
                { x: 0, y: 0, z: 0 }, { x: 2, y: 0, z: 0 },
                { x: 1, y: 1, z: 0 }, { x: 3, y: 1, z: 0 },
                // Diagonal cells that can't be covered by O-blocks
            ],
            pieces: [createOBlock('o1')],
        });

        const result = solvePuzzle(level);

        expect(result.solvable).toBe(false);
    });

    it('returns unsolvable for isolated single cell with multi-cell pieces', () => {
        // Single isolated target cell cannot be filled by a 4-cell piece
        const level = createTestLevel({
            gridSize: [10, 10, 1],
            targetVoxels: [
                // Cluster of 3 cells (can't be filled by 4-cell O-block)
                { x: 1, y: 1, z: 0 }, { x: 2, y: 1, z: 0 },
                { x: 1, y: 2, z: 0 },
            ],
            pieces: [], // Volume would mismatch anyway with O-block
        });

        // Even with correct volume, shape doesn't fit
        const level2 = createTestLevel({
            gridSize: [10, 10, 1],
            targetVoxels: [
                // L-shape target that doesn't match T-block orientation
                { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 },
                { x: 0, y: 1, z: 0 }, { x: 0, y: 2, z: 0 },
            ],
            pieces: [createTBlock('t1')],
        });

        const result2 = solvePuzzle(level2);
        expect(result2.solvable).toBe(false);
    });
});

// ========================================
// Rotation Required Tests
// ========================================

describe('solvePuzzle - Rotation Required', () => {
    it('solves puzzle requiring 90-degree rotation', () => {
        // Vertical 4x1 strip - I-block needs rotation from horizontal
        const level = createTestLevel({
            gridSize: [3, 6, 1],
            targetVoxels: [
                { x: 1, y: 0, z: 0 },
                { x: 1, y: 1, z: 0 },
                { x: 1, y: 2, z: 0 },
                { x: 1, y: 3, z: 0 },
            ],
            pieces: [createIBlock('i1')],
        });

        const result = solvePuzzle(level);

        expect(result.solvable).toBe(true);
        expect(result.solution).toHaveLength(1);
        // Should have z rotation of 90 or 270 (vertical orientation)
        const rotation = result.solution![0].rotation;
        expect(rotation.z === 90 || rotation.z === 270).toBe(true);
    });

    it('solves L-shaped puzzle requiring specific rotation', () => {
        // Target matches L-block in specific orientation
        const level = createTestLevel({
            gridSize: [5, 5, 1],
            targetVoxels: [
                { x: 1, y: 1, z: 0 }, { x: 2, y: 1, z: 0 }, { x: 3, y: 1, z: 0 },
                { x: 3, y: 2, z: 0 },
            ],
            pieces: [createLBlock('l1')],
        });

        const result = solvePuzzle(level);

        expect(result.solvable).toBe(true);
        expect(result.solution).toHaveLength(1);
    });
});

// ========================================
// Edge Cases
// ========================================

describe('solvePuzzle - Edge Cases', () => {
    it('handles empty target (trivially solvable)', () => {
        const level = createTestLevel({
            gridSize: [5, 5, 1],
            targetVoxels: [],
            pieces: [], // No pieces needed
        });

        const result = solvePuzzle(level);

        expect(result.solvable).toBe(true);
        expect(result.timedOut).toBe(false);
        expect(result.solution).toEqual([]);
        expect(result.searchedStates).toBe(0);
    });

    it('handles empty pieces with non-empty target (unsolvable)', () => {
        const level = createTestLevel({
            gridSize: [5, 5, 1],
            targetVoxels: [{ x: 1, y: 1, z: 0 }],
            pieces: [],
        });

        const result = solvePuzzle(level);

        expect(result.solvable).toBe(false);
    });

    it('handles single-cell piece with single-cell target', () => {
        const singleCell = createTestPiece('single', [{ x: 0, y: 0, z: 0 }]);
        const level = createTestLevel({
            gridSize: [3, 3, 1],
            targetVoxels: [{ x: 1, y: 1, z: 0 }],
            pieces: [singleCell],
        });

        const result = solvePuzzle(level);

        expect(result.solvable).toBe(true);
        expect(result.solution).toHaveLength(1);
        expect(result.solution![0].position).toEqual({ x: 1, y: 1, z: 0 });
    });
});

// ========================================
// Timeout Behavior Tests
// ========================================

describe('solvePuzzle - Timeout', () => {
    it('respects timeout and returns timedOut=true', () => {
        // Create a complex puzzle that would take too long
        const level = createTestLevel({
            gridSize: [12, 12, 1],
            targetVoxels: Array.from({ length: 28 }, (_, i) => ({
                x: (i % 7) + 1,
                y: Math.floor(i / 7) + 1,
                z: 0,
            })),
            pieces: [
                createIBlock('i1'),
                createIBlock('i2'),
                createIBlock('i3'),
                createIBlock('i4'),
                createLBlock('l1'),
                createLBlock('l2'),
                createTBlock('t1'),
            ],
        });

        // Very short timeout
        const result = solvePuzzle(level, 10);

        // Should complete within timeout or shortly after
        expect(result.timeMs).toBeLessThan(100); // Allow some overhead
        // searchedStates should reflect work done
        expect(result.searchedStates).toBeGreaterThanOrEqual(0);
        // When timed out, solvable is false but timedOut is true
        // This allows caller to distinguish timeout from definitive unsolvable
        expect(result.timedOut).toBe(true);
    });

    it('completes simple puzzle within default timeout with timedOut=false', () => {
        const level = createTestLevel({
            gridSize: [4, 4, 1],
            targetVoxels: [
                { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 },
                { x: 0, y: 1, z: 0 }, { x: 1, y: 1, z: 0 },
            ],
            pieces: [createOBlock('o1')],
        });

        const result = solvePuzzle(level);

        expect(result.solvable).toBe(true);
        expect(result.timedOut).toBe(false);
        expect(result.timeMs).toBeLessThan(1000); // Should be very fast
    });
});

// ========================================
// 3D Puzzle Tests
// ========================================

describe('solvePuzzle - 3D Puzzles', () => {
    it('solves simple 3D puzzle with stacked blocks', () => {
        // 2x2x2 cube target with two 2x2 blocks (flat)
        const level: LevelConfig = {
            id: '3d-test',
            name: '3D Test',
            type: '3D',
            gridSize: [4, 4, 3],
            targetVoxels: [
                { x: 1, y: 1, z: 0 }, { x: 2, y: 1, z: 0 },
                { x: 1, y: 2, z: 0 }, { x: 2, y: 2, z: 0 },
                { x: 1, y: 1, z: 1 }, { x: 2, y: 1, z: 1 },
                { x: 1, y: 2, z: 1 }, { x: 2, y: 2, z: 1 },
            ],
            pieces: [
                createOBlock('o1'),
                createOBlock('o2'),
            ],
            difficulty: 'easy',
        };

        const result = solvePuzzle(level);

        expect(result.solvable).toBe(true);
        expect(result.solution).toHaveLength(2);
    });

    it('uses 24 rotations for 3D levels', () => {
        // This test verifies 3D rotations are used
        // The 3D corner piece requires specific 3D rotation to fit
        const level: LevelConfig = {
            id: '3d-rotation-test',
            name: '3D Rotation Test',
            type: '3D',
            gridSize: [5, 5, 4],
            targetVoxels: [
                // 3D corner shape - needs 3D rotation
                { x: 1, y: 1, z: 0 },
                { x: 2, y: 1, z: 0 },
                { x: 1, y: 2, z: 0 },
                { x: 1, y: 1, z: 1 },
            ],
            pieces: [create3DCorner('corner1')],
            difficulty: 'easy',
        };

        const result = solvePuzzle(level);

        expect(result.solvable).toBe(true);
        expect(result.solution).toHaveLength(1);
    });
});

// ========================================
// isSolvable Convenience Function
// ========================================

describe('isSolvable', () => {
    it('returns true for solvable puzzle', () => {
        const level = createTestLevel({
            gridSize: [4, 4, 1],
            targetVoxels: [
                { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 },
                { x: 0, y: 1, z: 0 }, { x: 1, y: 1, z: 0 },
            ],
            pieces: [createOBlock('o1')],
        });

        expect(isSolvable(level)).toBe(true);
    });

    it('returns false for unsolvable puzzle', () => {
        const level = createTestLevel({
            gridSize: [4, 4, 1],
            targetVoxels: [
                { x: 0, y: 0, z: 0 },
                { x: 2, y: 2, z: 0 },
            ],
            pieces: [createOBlock('o1')], // Volume mismatch
        });

        expect(isSolvable(level)).toBe(false);
    });
});

// ========================================
// Solution Validation Tests
// ========================================

describe('solvePuzzle - Solution Validation', () => {
    it('solution contains valid position for each piece', () => {
        const level = createTestLevel({
            gridSize: [6, 4, 1],
            targetVoxels: [
                { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 },
                { x: 0, y: 1, z: 0 }, { x: 1, y: 1, z: 0 },
                { x: 2, y: 0, z: 0 }, { x: 3, y: 0, z: 0 },
                { x: 2, y: 1, z: 0 }, { x: 3, y: 1, z: 0 },
            ],
            pieces: [createOBlock('o1'), createOBlock('o2')],
        });

        const result = solvePuzzle(level);

        expect(result.solvable).toBe(true);
        expect(result.solution).toBeDefined();

        for (const step of result.solution!) {
            // Position should be non-negative
            expect(step.position.x).toBeGreaterThanOrEqual(0);
            expect(step.position.y).toBeGreaterThanOrEqual(0);
            expect(step.position.z).toBeGreaterThanOrEqual(0);

            // Rotation should be valid
            expect([0, 90, 180, 270]).toContain(step.rotation.x);
            expect([0, 90, 180, 270]).toContain(step.rotation.y);
            expect([0, 90, 180, 270]).toContain(step.rotation.z);
        }
    });

    it('solution uses each piece exactly once', () => {
        const level = createTestLevel({
            gridSize: [6, 6, 1],
            targetVoxels: [
                { x: 1, y: 1, z: 0 }, { x: 2, y: 1, z: 0 }, { x: 3, y: 1, z: 0 }, { x: 4, y: 1, z: 0 },
                { x: 1, y: 2, z: 0 }, { x: 2, y: 2, z: 0 }, { x: 3, y: 2, z: 0 }, { x: 4, y: 2, z: 0 },
                { x: 1, y: 3, z: 0 }, { x: 2, y: 3, z: 0 }, { x: 3, y: 3, z: 0 }, { x: 4, y: 3, z: 0 },
                { x: 1, y: 4, z: 0 }, { x: 2, y: 4, z: 0 }, { x: 3, y: 4, z: 0 }, { x: 4, y: 4, z: 0 },
            ],
            pieces: [
                createOBlock('o1'),
                createOBlock('o2'),
                createOBlock('o3'),
                createOBlock('o4'),
            ],
        });

        const result = solvePuzzle(level);

        expect(result.solvable).toBe(true);
        const pieceIds = result.solution!.map(s => s.pieceId);
        const uniqueIds = new Set(pieceIds);

        expect(pieceIds).toHaveLength(4);
        expect(uniqueIds.size).toBe(4);
    });
});

// ========================================
// Performance & State Counting Tests
// ========================================

describe('solvePuzzle - Performance Metrics', () => {
    it('tracks searched states accurately', () => {
        const level = createTestLevel({
            gridSize: [4, 4, 1],
            targetVoxels: [
                { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 },
                { x: 0, y: 1, z: 0 }, { x: 1, y: 1, z: 0 },
            ],
            pieces: [createOBlock('o1')],
        });

        const result = solvePuzzle(level);

        expect(result.searchedStates).toBeGreaterThan(0);
        expect(result.timeMs).toBeGreaterThan(0);
    });

    it('volume mismatch uses zero search states', () => {
        const level = createTestLevel({
            gridSize: [10, 10, 1],
            targetVoxels: [{ x: 0, y: 0, z: 0 }],
            pieces: [createOBlock('o1')], // 4 cells vs 1 target
        });

        const result = solvePuzzle(level);

        expect(result.solvable).toBe(false);
        expect(result.searchedStates).toBe(0);
    });
});
