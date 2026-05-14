/**
 * Seeded Config Generator for SequenceRace
 *
 * Generates reproducible game configurations for daily challenges.
 * Same seed always produces the same game config.
 *
 * @example
 * import { getDailySequenceRaceConfig } from './seededGenerator';
 *
 * const config = getDailySequenceRaceConfig('2025-01-01');
 * // Always returns the same config for Jan 1, 2025
 */

import type { GameConfig } from './types'
import type { SeededRandom } from '@/shared/utils'
import type { SequenceType } from './presets'
import { createDailyRandom } from '@/shared/utils'
import { generateSequence, SEQUENCE_INFO } from './presets'
import { validateGameFairness } from './engine'

// ============================================================================
// Constants
// ============================================================================

/**
 * Sequence types available per difficulty level.
 * Easy uses simpler sequences, hard uses more complex ones.
 */
const SEQUENCES_BY_DIFFICULTY: Record<
  'easy' | 'medium' | 'hard',
  SequenceType[]
> = {
  easy: ['arithmetic', 'triangular'],
  medium: ['geometric', 'fibonacci', 'arithmetic', 'triangular', 'powers3'],
  hard: ['prime', 'square', 'fibonacci', 'geometric', 'triangular', 'powers3'],
}

/**
 * Step pool size ranges by difficulty.
 * Larger pools = more options = more complex strategy.
 */
const POOL_SIZE_RANGE: Record<'easy' | 'medium' | 'hard', [number, number]> = {
  easy: [3, 4],
  medium: [4, 5],
  hard: [4, 6],
}

// ============================================================================
// Seeded Generator Functions
// ============================================================================

/**
 * Generate a game config using seeded randomness.
 * Produces the same config for the same seed.
 *
 * @param rng - Seeded random number generator
 * @param difficulty - Game difficulty (daily challenges use 'medium')
 * @returns Complete game configuration
 */
export function generateSeededConfig(
  rng: SeededRandom,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium',
): GameConfig {
  // 1. Select sequence type using seeded RNG
  const sequenceTypes = SEQUENCES_BY_DIFFICULTY[difficulty]
  const sequenceType = rng.pick(sequenceTypes)

  // 2. Determine pool size using seeded RNG
  const [minPool, maxPool] = POOL_SIZE_RANGE[difficulty]
  const poolSize = rng.nextInt(minPool, maxPool)

  // 3. Generate step pool from sequence
  const stepPool = generateSequence(sequenceType, poolSize)

  // 4. Calculate target using seeded RNG
  const maxStep = Math.max(...stepPool)
  const totalSum = stepPool.reduce((a, b) => a + b, 0)
  const minTarget = maxStep * 2
  const maxTarget = totalSum
  const target = rng.nextInt(minTarget, maxTarget)

  // 5. Create base config
  const baseConfig: GameConfig = {
    id: `daily_${rng.seed}`,
    name: `${SEQUENCE_INFO[sequenceType].name} (${target})`,
    target,
    stepPool,
    difficulty,
    sequenceType,
  }

  // 6. Validate fairness - ensure player can win
  const fairness = validateGameFairness(baseConfig)

  // If player can't win going first, check if they can win going second
  if (!fairness.isPlayerWinnable && fairness.isAIWinnable) {
    // Player gets second-mover advantage (AI moves first)
    return { ...baseConfig, aiMovesFirst: true }
  }

  return baseConfig
}

// ============================================================================
// Daily Challenge API
// ============================================================================

/**
 * Get today's daily challenge config for SequenceRace.
 * Always returns the same config for the same date.
 *
 * @param date - Date string in YYYY-MM-DD format (defaults to today)
 * @returns Game config for daily challenge
 */
export function getDailySequenceRaceConfig(date?: string): GameConfig {
  const dateStr = date ?? new Date().toISOString().split('T')[0]
  const rng = createDailyRandom(dateStr, 'sequence-race')

  // Daily challenges are always medium difficulty
  return generateSeededConfig(rng, 'medium')
}

/**
 * Preview a future daily config (for testing/admin).
 *
 * @param daysFromNow - Number of days in the future (0 = today)
 * @returns Game config for that date
 */
export function previewDailyConfig(daysFromNow: number = 0): GameConfig {
  const date = new Date()
  date.setDate(date.getDate() + daysFromNow)
  const dateStr = date.toISOString().split('T')[0]
  return getDailySequenceRaceConfig(dateStr)
}
