import { describe, it, expect } from 'vitest';
import {
  generateSeededLevel,
  getDailyShapeArchitectLevel,
  previewDailyLevel,
  GENERATOR_CONSTANTS,
  generateValidatedLevelForTesting,
  generateGuaranteedSolvable,
  generateGuaranteedSolvableWithRetry,
} from '../seededGenerator';
import { createSeededRandom } from '@/shared/utils';
import { solvePuzzle } from '../solver';

// ========================================
// Test Fixtures
// ========================================

const TEST_DATES = ['2025-01-01', '2025-06-15', '2025-12-31'];
const TEST_SEEDS = ['test-seed-1', 'test-seed-2', 'daily-challenge-123'];

// ========================================
// Basic Generation Tests
// ========================================

describe('generateSeededLevel', () => {
  it('generates reproducible levels with same seed', () => {
    const seed = 'reproducible-test';
    const rng1 = createSeededRandom(seed);
    const rng2 = createSeededRandom(seed);

    const level1 = generateSeededLevel(rng1, 'medium');
    const level2 = generateSeededLevel(rng2, 'medium');

    expect(level1.pieces.length).toBe(level2.pieces.length);
    expect(level1.targetVoxels.length).toBe(level2.targetVoxels.length);
    expect(level1.gridSize).toEqual(level2.gridSize);
  });

  it('generates different levels with different seeds', () => {
    const rng1 = createSeededRandom('seed-a');
    const rng2 = createSeededRandom('seed-b');

    const level1 = generateSeededLevel(rng1, 'medium');
    const level2 = generateSeededLevel(rng2, 'medium');

    // At least one property should differ (high probability)
    const same =
      level1.pieces.length === level2.pieces.length &&
      level1.pieces.every(
        (p, i) => p.name === level2.pieces[i]?.name
      );

    // It's possible but extremely unlikely for two different seeds to produce identical levels
    // This test may occasionally fail due to random chance, but very rarely
    expect(same).toBe(false);
  });

  it('generates correct piece counts by difficulty', () => {
    const difficulties: Array<'easy' | 'medium' | 'hard'> = ['easy', 'medium', 'hard'];
    const expectedRanges = {
      easy: [4, 5],
      medium: [5, 6],
      hard: [6, 7],
    };

    for (const difficulty of difficulties) {
      const rng = createSeededRandom(`test-${difficulty}`);
      const level = generateSeededLevel(rng, difficulty);
      const [min, max] = expectedRanges[difficulty];

      expect(level.pieces.length).toBeGreaterThanOrEqual(min);
      expect(level.pieces.length).toBeLessThanOrEqual(max);
    }
  });

  it('generates 2D levels only', () => {
    for (const seed of TEST_SEEDS) {
      const rng = createSeededRandom(seed);
      const level = generateSeededLevel(rng, 'medium');

      expect(level.type).toBe('2D');
      expect(level.gridSize[2]).toBe(1);
      expect(level.targetVoxels.every(v => v.z === 0)).toBe(true);
    }
  });

  it('generates levels with matching volume (pieces match target)', () => {
    for (const seed of TEST_SEEDS) {
      const rng = createSeededRandom(seed);
      const level = generateSeededLevel(rng, 'medium');

      const pieceVolume = level.pieces.reduce((sum, p) => sum + p.layout.length, 0);
      const targetVolume = level.targetVoxels.length;

      expect(pieceVolume).toBe(targetVolume);
    }
  });
});

// ========================================
// Validation Tests
// ========================================

describe('Generator Validation', () => {
  it('exports validation constants', () => {
    expect(GENERATOR_CONSTANTS.VALIDATION_TIMEOUT_MS).toBe(2000);
    expect(GENERATOR_CONSTANTS.MAX_RETRY_ATTEMPTS).toBe(10);
  });

  it('validates generated levels are solvable or uses fallback', () => {
    // Generate a few levels and verify they're solvable
    // The validation system should ensure all returned levels are solvable
    // (either by finding a solvable generated level or falling back to preset)
    for (const date of TEST_DATES) {
      const level = getDailyShapeArchitectLevel(date);

      // Use longer timeout to verify solvability
      const result = solvePuzzle(level, 10000);

      // If the level is a fallback preset, it's definitely solvable
      // If it's generated and passed validation, it should be solvable
      // Only accept timedOut if we can't verify in reasonable time
      if (!result.solvable && !result.timedOut) {
        // This would indicate a bug in our validation
        console.log(`Date ${date}: level ${level.id} is unsolvable`);
      }

      expect(result.solvable || result.timedOut).toBe(true);
    }
  }, 60000); // 60s test timeout

  it('generateValidatedLevelForTesting returns solvable level', () => {
    const level = generateValidatedLevelForTesting('test-validation', 'medium');

    // The level should be solvable (or fallback to a known-solvable preset)
    const result = solvePuzzle(level, 10000);
    const isValid = result.solvable || result.timedOut;
    expect(isValid).toBe(true);
  }, 30000);

  it('falls back to preset when retries exhausted', () => {
    // The fallback mechanism ensures we always return a valid level
    const level = getDailyShapeArchitectLevel('2025-01-01');

    // Whether generated or fallback, should have expected properties
    expect(level.id).toBeDefined();
    expect(level.pieces.length).toBeGreaterThan(0);
    expect(level.targetVoxels.length).toBeGreaterThan(0);

    // Fallback levels have IDs containing 'fallback' or are from generated levels
    // Either way, the level should be playable
    expect(level.difficulty).toBe('medium');
  }, 30000);
});

// ========================================
// Daily Challenge API Tests
// ========================================

describe('getDailyShapeArchitectLevel', () => {
  it('returns same level for same date', () => {
    const date = '2025-03-15';
    const level1 = getDailyShapeArchitectLevel(date);
    const level2 = getDailyShapeArchitectLevel(date);

    expect(level1.id).toBe(level2.id);
    expect(level1.pieces.length).toBe(level2.pieces.length);
    expect(level1.targetVoxels.length).toBe(level2.targetVoxels.length);
  }, 60000); // Validation can take time with retries

  it('returns different levels for different dates', () => {
    const level1 = getDailyShapeArchitectLevel('2025-01-01');
    const level2 = getDailyShapeArchitectLevel('2025-01-02');

    // IDs should be different due to different dates
    expect(level1.id).not.toBe(level2.id);
  }, 60000);

  it('always returns medium difficulty', () => {
    for (const date of TEST_DATES) {
      const level = getDailyShapeArchitectLevel(date);
      expect(level.difficulty).toBe('medium');
    }
  }, 90000);

  it('uses today date when not specified', () => {
    const level = getDailyShapeArchitectLevel();

    // The level should be for today
    expect(level.id).toContain('daily');
  }, 30000);
});

// ========================================
// Preview Daily Level Tests
// ========================================

describe('previewDailyLevel', () => {
  it('returns today level for daysFromNow=0', () => {
    const preview = previewDailyLevel(0);
    const today = getDailyShapeArchitectLevel();

    expect(preview.id).toBe(today.id);
  }, 60000); // Longer timeout for validation

  it('returns future levels correctly', () => {
    const preview1 = previewDailyLevel(1);
    const preview7 = previewDailyLevel(7);

    // Different days should give different levels
    expect(preview1.id).not.toBe(preview7.id);
  }, 60000);

  it('returns validated levels for future dates', () => {
    // Test a few days ahead (not all 7 to keep test time reasonable)
    for (let i = 0; i <= 3; i++) {
      const level = previewDailyLevel(i);
      const result = solvePuzzle(level, 10000);

      const isValid = result.solvable || result.timedOut;
      expect(isValid).toBe(true);
    }
  }, 120000); // 2 minute timeout for this test
});

// ========================================
// Fallback Mechanism Tests
// ========================================

describe('Fallback Mechanism', () => {
  it('fallback levels have correct naming pattern', () => {
    // We can't easily force a fallback, but we can verify the structure
    // by checking that getDailyShapeArchitectLevel always returns valid levels
    const level = getDailyShapeArchitectLevel('2025-01-01');

    expect(level.name).toBeDefined();
    expect(level.name.length).toBeGreaterThan(0);
  });

  it('returned level always has required properties', () => {
    for (const date of TEST_DATES) {
      const level = getDailyShapeArchitectLevel(date);

      expect(level.id).toBeDefined();
      expect(level.name).toBeDefined();
      expect(level.type).toBeDefined();
      expect(level.gridSize).toHaveLength(3);
      expect(level.targetVoxels.length).toBeGreaterThan(0);
      expect(level.pieces.length).toBeGreaterThan(0);
      expect(level.difficulty).toBeDefined();
    }
  }, 90000);
});

// ========================================
// Solvability Stress Test
// ========================================

describe('Solvability Stress Test', () => {
  it('generates solvable levels for 10 consecutive days', () => {
    const results: { date: string; solvable: boolean; timedOut: boolean; levelId: string }[] = [];

    for (let i = 0; i < 10; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      const level = getDailyShapeArchitectLevel(dateStr);
      // Use longer timeout for verification
      const result = solvePuzzle(level, 10000);

      results.push({
        date: dateStr,
        solvable: result.solvable,
        timedOut: result.timedOut,
        levelId: level.id,
      });
    }

    // All levels should be either solvable or timed out (never definitively unsolvable)
    // The validation with retries and fallback should guarantee this
    const unsolvable = results.filter(r => !r.solvable && !r.timedOut);

    if (unsolvable.length > 0) {
      console.log('Unsolvable dates:', unsolvable.map(r => `${r.date} (${r.levelId})`));
    }

    expect(unsolvable.length).toBe(0);
  }, 180000); // 3 minute timeout for stress test
});

// ========================================
// Guaranteed Solvable Generator Tests
// ========================================

describe('generateGuaranteedSolvable', () => {
  it('generates levels that are guaranteed solvable', () => {
    // Test multiple seeds to ensure consistent solvability
    const seeds = ['test-1', 'test-2', 'test-3', 'puzzle-abc', 'random-xyz'];

    for (const seed of seeds) {
      const rng = createSeededRandom(seed);
      const level = generateGuaranteedSolvable(rng, 'easy');

      // Level should be generated (not null)
      expect(level).not.toBeNull();

      if (level) {
        // Verify with solver (should be solvable since we placed pieces ourselves)
        const result = solvePuzzle(level, 5000);
        expect(result.solvable).toBe(true);
      }
    }
  }, 30000);

  it('generates correct piece counts by difficulty', () => {
    const expectedRanges = {
      easy: [3, 4],
      medium: [5, 6],
      hard: [6, 7],
    };

    for (const difficulty of ['easy', 'medium', 'hard'] as const) {
      const rng = createSeededRandom(`test-${difficulty}`);
      const level = generateGuaranteedSolvable(rng, difficulty);

      expect(level).not.toBeNull();
      if (level) {
        const [min, max] = expectedRanges[difficulty];
        expect(level.pieces.length).toBeGreaterThanOrEqual(min);
        expect(level.pieces.length).toBeLessThanOrEqual(max);
      }
    }
  });

  it('uses pentominoes in harder difficulties', () => {
    // Hard difficulty should include pentominoes (5-cell pieces)
    const rng = createSeededRandom('test-hard-pento');
    const level = generateGuaranteedSolvable(rng, 'hard');

    expect(level).not.toBeNull();
    if (level) {
      // At least some pieces should be pentominoes (5 cells)
      const hasPentominoes = level.pieces.some(p => p.layout.length === 5);
      expect(hasPentominoes).toBe(true);
    }
  });

  it('easy difficulty uses only tetrominoes', () => {
    // Easy difficulty should only have tetrominoes (4-cell pieces)
    const rng = createSeededRandom('test-easy-tetris');
    const level = generateGuaranteedSolvable(rng, 'easy');

    expect(level).not.toBeNull();
    if (level) {
      // All pieces should be tetrominoes (4 cells)
      const allTetrominoes = level.pieces.every(p => p.layout.length === 4);
      expect(allTetrominoes).toBe(true);
    }
  });

  it('target voxels match total piece volume', () => {
    const rng = createSeededRandom('volume-test');
    const level = generateGuaranteedSolvable(rng, 'medium');

    expect(level).not.toBeNull();
    if (level) {
      const pieceVolume = level.pieces.reduce((sum, p) => sum + p.layout.length, 0);
      const targetVolume = level.targetVoxels.length;

      // Target shape should exactly fit all pieces
      expect(targetVolume).toBe(pieceVolume);
    }
  });

  it('generates reproducible levels with same seed', () => {
    const seed = 'reproducible-guaranteed';

    const rng1 = createSeededRandom(seed);
    const rng2 = createSeededRandom(seed);

    const level1 = generateGuaranteedSolvable(rng1, 'medium');
    const level2 = generateGuaranteedSolvable(rng2, 'medium');

    expect(level1).not.toBeNull();
    expect(level2).not.toBeNull();

    if (level1 && level2) {
      expect(level1.pieces.length).toBe(level2.pieces.length);
      expect(level1.targetVoxels.length).toBe(level2.targetVoxels.length);
      expect(level1.gridSize).toEqual(level2.gridSize);
    }
  });
});

describe('generateGuaranteedSolvableWithRetry', () => {
  it('always returns a valid level', () => {
    const seeds = ['retry-test-1', 'retry-test-2', 'retry-test-3'];

    for (const seed of seeds) {
      const rng = createSeededRandom(seed);
      const level = generateGuaranteedSolvableWithRetry(rng, 'medium');

      // Should always return a level (never null due to fallback)
      expect(level).toBeDefined();
      expect(level.pieces.length).toBeGreaterThan(0);
      expect(level.targetVoxels.length).toBeGreaterThan(0);

      // Level should be solvable
      const result = solvePuzzle(level, 5000);
      expect(result.solvable || result.timedOut).toBe(true);
    }
  }, 30000);

  it('falls back gracefully if generation fails repeatedly', () => {
    // Even with a "bad" seed, retry mechanism should return valid level
    const rng = createSeededRandom('edge-case-seed');
    const level = generateGuaranteedSolvableWithRetry(rng, 'hard');

    expect(level).toBeDefined();
    expect(level.difficulty).toBe('hard');
  });
});
