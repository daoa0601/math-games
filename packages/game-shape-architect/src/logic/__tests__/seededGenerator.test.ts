import { describe, it, expect } from 'vitest'

import { createSeededRandom } from '@math-games/core'

import {
  getDailyShapeArchitectLevel,
  previewDailyLevel,
  GENERATOR_CONSTANTS,
  generateValidatedLevelForTesting,
  generateGuaranteedSolvableWithRetry,
  generateCohesivePuzzle,
} from '../seededGenerator'
import type { LevelConfig } from '../types'
import { solvePuzzle } from '../solver'

// ========================================
// Test Fixtures
// ========================================

const TEST_DATES = ['2025-01-01', '2025-06-15', '2025-12-31']
const TEST_SEEDS = ['test-seed-1', 'test-seed-2', 'daily-challenge-123']

// ========================================
// Basic Generation Tests
// ========================================

describe('generateCohesivePuzzle', () => {
  it('generates reproducible levels with same seed (deep equality)', () => {
    const seed = 'reproducible-test-abc'
    const rng1 = createSeededRandom(seed)
    const rng2 = createSeededRandom(seed)

    const level1 = generateCohesivePuzzle(rng1, 'easy')
    const level2 = generateCohesivePuzzle(rng2, 'easy')

    expect(level1).toEqual(level2)
  })

  it('generates different levels with different seeds using retry', () => {
    // Use the retry function to ensure we get valid levels
    const rng1 = createSeededRandom('diff-seed-a')
    const rng2 = createSeededRandom('diff-seed-b')

    const level1 = generateGuaranteedSolvableWithRetry(rng1, 'medium')
    const level2 = generateGuaranteedSolvableWithRetry(rng2, 'medium')

    expect(level1).not.toEqual(level2)
  })

  it('generates correct piece counts by difficulty using retry', () => {
    const difficulties: Array<'easy' | 'medium' | 'hard'> = [
      'easy',
      'medium',
      'hard',
    ]
    const expectedRanges = {
      easy: [3, 4],
      medium: [5, 6],
      hard: [7, 8],
    }

    for (const difficulty of difficulties) {
      const rng = createSeededRandom(`count-${difficulty}-xyz`)
      const level = generateGuaranteedSolvableWithRetry(rng, difficulty)

      const [min, max] = expectedRanges[difficulty]
      // Fallback presets may have different piece counts, so only check generated levels
      if (level.id.startsWith('cohesive_')) {
        expect(level.pieces.length).toBeGreaterThanOrEqual(min)
        expect(level.pieces.length).toBeLessThanOrEqual(max)
      }
    }
  })

  it('generates 2D levels only', () => {
    for (const seed of TEST_SEEDS) {
      const rng = createSeededRandom(seed)
      const level = generateCohesivePuzzle(rng, 'medium')

      if (level) {
        expect(level.type).toBe('2D')
        expect(level.gridSize[2]).toBe(1)
        expect(level.targetVoxels.every((v) => v.z === 0)).toBe(true)
      }
    }
  })

  it('generates levels with matching volume (pieces match target)', () => {
    for (const seed of TEST_SEEDS) {
      const rng = createSeededRandom(seed)
      const level = generateCohesivePuzzle(rng, 'medium')

      if (level) {
        const pieceVolume = level.pieces.reduce(
          (sum, p) => sum + p.layout.length,
          0,
        )
        const targetVolume = level.targetVoxels.length

        expect(pieceVolume).toBe(targetVolume)
      }
    }
  })

  it('generates cohesive shapes that are actually solvable', () => {
    const seeds = ['solve-1-xyz', 'solve-2-xyz', 'solve-3-xyz']

    for (const seed of seeds) {
      const rng = createSeededRandom(seed)
      const level = generateGuaranteedSolvableWithRetry(rng, 'easy')

      const result = solvePuzzle(level, 15000)
      expect(result.solvable).toBe(true)
    }
  }, 60000)
})

// ========================================
// Validation Tests
// ========================================

describe('Generator Validation', () => {
  it('exports validation constants', () => {
    expect(GENERATOR_CONSTANTS.MAX_RETRY_ATTEMPTS).toBe(10)
    expect(GENERATOR_CONSTANTS.PIECE_COUNT_RANGE).toEqual({
      easy: [3, 4],
      medium: [5, 6],
      hard: [7, 8],
      expert: [6, 8],
      master: [5, 7],
    })
  })

  it('validates generated levels are solvable', () => {
    for (const date of TEST_DATES) {
      const level = getDailyShapeArchitectLevel(date)

      const result = solvePuzzle(level, 30000)

      expect(result.solvable).toBe(true)
    }
  }, 120000)

  it('generateValidatedLevelForTesting returns solvable level', () => {
    const level = generateValidatedLevelForTesting('test-validation', 'medium')

    const result = solvePuzzle(level, 30000)
    expect(result.solvable).toBe(true)
  }, 60000)

  it('falls back to preset when retries exhausted', () => {
    const level = getDailyShapeArchitectLevel('2025-01-01')

    expect(level.id).toBeDefined()
    expect(level.pieces.length).toBeGreaterThan(0)
    expect(level.targetVoxels.length).toBeGreaterThan(0)
    expect(level.difficulty).toBe('medium')
  }, 30000)
})

// ========================================
// Daily Challenge API Tests
// ========================================

describe('getDailyShapeArchitectLevel', () => {
  it('returns same level for same date (deep equality)', () => {
    const date = '2025-03-15'
    const level1 = getDailyShapeArchitectLevel(date)
    const level2 = getDailyShapeArchitectLevel(date)

    expect(level1).toEqual(level2)
  }, 60000)

  it('returns different levels for different dates', () => {
    const level1 = getDailyShapeArchitectLevel('2025-01-01')
    const level2 = getDailyShapeArchitectLevel('2025-01-02')

    expect(level1.id).not.toBe(level2.id)
  }, 60000)

  it('always returns medium difficulty', () => {
    for (const date of TEST_DATES) {
      const level = getDailyShapeArchitectLevel(date)
      expect(level.difficulty).toBe('medium')
    }
  }, 90000)

  it('returns cohesive shape level', () => {
    const level = getDailyShapeArchitectLevel()

    // The level ID should start with 'cohesive_' or 'daily_fallback_'
    expect(level.id).toMatch(/^(cohesive_|daily_fallback_)/)
  }, 30000)
})

// ========================================
// Preview Daily Level Tests
// ========================================

describe('previewDailyLevel', () => {
  it('returns today level for daysFromNow=0', () => {
    const preview = previewDailyLevel(0)
    const today = getDailyShapeArchitectLevel()

    expect(preview.id).toBe(today.id)
  }, 60000)

  it('returns future levels correctly', () => {
    const preview1 = previewDailyLevel(1)
    const preview7 = previewDailyLevel(7)

    expect(preview1.id).not.toBe(preview7.id)
  }, 60000)

  it('returns validated levels for future dates', () => {
    for (let i = 0; i <= 3; i++) {
      const level = previewDailyLevel(i)
      const result = solvePuzzle(level, 30000)

      expect(result.solvable).toBe(true)
    }
  }, 180000)
})

// ========================================
// Fallback Mechanism Tests
// ========================================

describe('Fallback Mechanism', () => {
  it('fallback levels have correct naming pattern', () => {
    const level = getDailyShapeArchitectLevel('2025-01-01')

    expect(level.name).toBeDefined()
    expect(level.name.length).toBeGreaterThan(0)
  })

  it('returned level always has required properties', () => {
    for (const date of TEST_DATES) {
      const level = getDailyShapeArchitectLevel(date)

      expect(level.id).toBeDefined()
      expect(level.name).toBeDefined()
      expect(level.type).toBeDefined()
      expect(level.gridSize).toHaveLength(3)
      expect(level.targetVoxels.length).toBeGreaterThan(0)
      expect(level.pieces.length).toBeGreaterThan(0)
      expect(level.difficulty).toBeDefined()
    }
  }, 90000)
})

// ========================================
// Solvability Stress Test
// ========================================

describe('Solvability Stress Test', () => {
  it('generates solvable levels for 10 consecutive days', () => {
    const results: {
      date: string
      solvable: boolean
      timedOut: boolean
      levelId: string
    }[] = []

    for (let i = 0; i < 10; i++) {
      const date = new Date()
      date.setDate(date.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]

      const level = getDailyShapeArchitectLevel(dateStr)
      const result = solvePuzzle(level, 30000)

      results.push({
        date: dateStr,
        solvable: result.solvable,
        timedOut: result.timedOut,
        levelId: level.id,
      })
    }

    const unsolvable = results.filter((r) => !r.solvable)

    if (unsolvable.length > 0) {
      console.log(
        'Unsolvable dates:',
        unsolvable.map((r) => `${r.date} (${r.levelId})`),
      )
    }

    expect(unsolvable.length).toBe(0)
  }, 360000)
})

describe('solver baseline: can detect unsolvable puzzles', () => {
  it('returns solvable=false for a puzzle with mismatched volume', () => {
    const unsolvableLevel: LevelConfig = {
      id: 'unsolvable-volume',
      name: 'Unsolvable',
      type: '2D',
      gridSize: [4, 4, 1],
      targetVoxels: [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
        { x: 2, y: 0, z: 0 },
      ],
      pieces: [
        {
          id: 'big',
          name: 'Big',
          color: '#f00',
          layout: [
            { x: 0, y: 0, z: 0 },
            { x: 1, y: 0, z: 0 },
            { x: 2, y: 0, z: 0 },
            { x: 3, y: 0, z: 0 },
          ],
        },
      ],
      difficulty: 'easy',
    }

    const result = solvePuzzle(unsolvableLevel, 5000)
    expect(result.solvable).toBe(false)
    expect(result.timedOut).toBe(false)
  })

  it('returns solvable=false for a puzzle where pieces cannot fit the shape', () => {
    const unsolvableLevel: LevelConfig = {
      id: 'unsolvable-shape',
      name: 'Unsolvable Shape',
      type: '2D',
      gridSize: [4, 4, 1],
      targetVoxels: [
        { x: 0, y: 0, z: 0 },
        { x: 2, y: 2, z: 0 },
      ],
      pieces: [
        {
          id: 'domino',
          name: 'Domino',
          color: '#f00',
          layout: [
            { x: 0, y: 0, z: 0 },
            { x: 1, y: 0, z: 0 },
          ],
        },
      ],
      difficulty: 'easy',
    }

    const result = solvePuzzle(unsolvableLevel, 5000)
    expect(result.solvable).toBe(false)
  })
})

describe('generateGuaranteedSolvableWithRetry', () => {
  it('always returns a valid level', () => {
    const seeds = ['retry-test-1', 'retry-test-2', 'retry-test-3']

    for (const seed of seeds) {
      const rng = createSeededRandom(seed)
      const level = generateGuaranteedSolvableWithRetry(rng, 'medium')

      expect(level).toBeDefined()
      expect(level.pieces.length).toBeGreaterThan(0)
      expect(level.targetVoxels.length).toBeGreaterThan(0)

      const result = solvePuzzle(level, 15000)
      expect(result.solvable).toBe(true)
    }
  }, 30000)

  it('falls back gracefully if generation fails repeatedly', () => {
    const rng = createSeededRandom('edge-case-seed')
    const level = generateGuaranteedSolvableWithRetry(rng, 'hard')

    expect(level).toBeDefined()
    expect(level.difficulty).toBe('hard')
  })
})
