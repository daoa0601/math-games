import { describe, it, expect } from 'vitest'
import type { SequenceType } from '../presets'
import {
  generateSequence,
  SEQUENCE_INFO,
  presetGames,
  generateRandomConfig,
} from '../presets'
import { validateGameFairness } from '../engine'

describe('SequenceRace Presets', () => {
  describe('generateSequence', () => {
    it('generates arithmetic sequence correctly', () => {
      const seq = generateSequence('arithmetic', 5)
      expect(seq).toEqual([1, 2, 3, 4, 5])
    })

    it('generates geometric sequence (powers of 2) correctly', () => {
      const seq = generateSequence('geometric', 5)
      expect(seq).toEqual([1, 2, 4, 8, 16])
    })

    it('generates fibonacci sequence correctly', () => {
      const seq = generateSequence('fibonacci', 7)
      expect(seq).toEqual([1, 1, 2, 3, 5, 8, 13])
    })

    it('generates prime sequence correctly', () => {
      const seq = generateSequence('prime', 5)
      expect(seq).toEqual([2, 3, 5, 7, 11])
    })

    it('generates square sequence correctly', () => {
      const seq = generateSequence('square', 5)
      expect(seq).toEqual([1, 4, 9, 16, 25])
    })

    it('generates triangular sequence correctly', () => {
      const seq = generateSequence('triangular', 5)
      expect(seq).toEqual([1, 3, 6, 10, 15])
    })

    it('generates powers of 3 sequence correctly', () => {
      const seq = generateSequence('powers3', 5)
      expect(seq).toEqual([1, 3, 9, 27, 81])
    })

    it('handles length of 1', () => {
      expect(generateSequence('arithmetic', 1)).toEqual([1])
      expect(generateSequence('prime', 1)).toEqual([2])
      expect(generateSequence('triangular', 1)).toEqual([1])
      expect(generateSequence('powers3', 1)).toEqual([1])
    })

    it('handles empty sequence', () => {
      expect(generateSequence('arithmetic', 0)).toEqual([])
    })
  })

  describe('SEQUENCE_INFO', () => {
    const expectedTypes: SequenceType[] = [
      'arithmetic',
      'geometric',
      'fibonacci',
      'prime',
      'square',
      'triangular',
      'powers3',
    ]

    it('has info for all sequence types', () => {
      for (const type of expectedTypes) {
        expect(SEQUENCE_INFO[type]).toBeDefined()
        expect(SEQUENCE_INFO[type].name).toBeTruthy()
        expect(SEQUENCE_INFO[type].description).toBeTruthy()
        expect(SEQUENCE_INFO[type].formula).toBeTruthy()
      }
    })
  })

  describe('presetGames', () => {
    it('has at least 5 preset games', () => {
      expect(presetGames.length).toBeGreaterThanOrEqual(5)
    })

    it('all presets have required fields', () => {
      for (const preset of presetGames) {
        expect(preset.id).toBeTruthy()
        expect(preset.name).toBeTruthy()
        expect(preset.target).toBeGreaterThan(0)
        expect(preset.stepPool.length).toBeGreaterThan(0)
        expect(['easy', 'medium', 'hard']).toContain(preset.difficulty)
      }
    })

    it('all presets have unique IDs', () => {
      const ids = presetGames.map((p) => p.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })

    it('step pools have reasonable targets', () => {
      for (const preset of presetGames) {
        // Target should be achievable by using at least some steps
        // Some games may intentionally be challenging (some steps may exceed target)
        expect(preset.target).toBeGreaterThan(0)
        expect(preset.stepPool.length).toBeGreaterThan(0)
        // At minimum, smallest step should be usable
        const minStep = Math.min(...preset.stepPool)
        expect(minStep).toBeLessThanOrEqual(preset.target)
      }
    })
  })

  describe('generateRandomConfig', () => {
    it('generates valid easy config', () => {
      const config = generateRandomConfig('easy')
      expect(config.difficulty).toBe('easy')
      expect(config.stepPool.length).toBeGreaterThanOrEqual(3)
      expect(config.target).toBeGreaterThan(0)
    })

    it('generates valid medium config', () => {
      const config = generateRandomConfig('medium')
      expect(config.difficulty).toBe('medium')
      expect(config.stepPool.length).toBeGreaterThanOrEqual(4)
    })

    it('generates valid hard config', () => {
      const config = generateRandomConfig('hard')
      expect(config.difficulty).toBe('hard')
      expect(config.stepPool.length).toBeGreaterThanOrEqual(4)
    })

    it('generates IDs with timestamp prefix', () => {
      const config = generateRandomConfig('easy')
      expect(config.id).toMatch(/^random_\d+$/)
    })

    it('generates fair configs where player can always win', () => {
      // Generate 100 random configs and verify all are fair
      for (let i = 0; i < 100; i++) {
        const config = generateRandomConfig('medium')
        const fairness = validateGameFairness(config)

        // Player should be able to win (either first or second)
        // OR the game is a draw with perfect play (rare edge case)
        if (!fairness.isPlayerWinnable && !fairness.isAIWinnable) {
          // Draw scenario - both players can avoid losing with perfect play
          // This is mathematically valid and rare
          expect(config.aiMovesFirst).toBeUndefined()
        } else if (!fairness.isPlayerWinnable) {
          // Player can't win going first, but AI can - so player gets second-mover advantage
          expect(config.aiMovesFirst).toBe(true)
        }
      }
    })
  })
})
