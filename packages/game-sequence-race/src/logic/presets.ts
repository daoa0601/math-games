// ========================================
// Sequence Sprinter - Preset Game Configs
// Now with mathematical sequences!
// ========================================

import type { GameConfig, SequenceType } from './types'
import type { FairnessResult } from './engine'
import { validateAllPresets, validateGameFairness } from './engine'

// Re-export SequenceType for consumers who import from presets
export type { SequenceType } from './types'

export interface SequenceInfo {
  type: SequenceType
  name: string
  description: string
  formula: string
}

// Generate sequence based on type
export function generateSequence(type: SequenceType, length: number): number[] {
  switch (type) {
    case 'arithmetic':
      // 1, 2, 3, 4, 5... (add 1 each time)
      return Array.from({ length }, (_, i) => i + 1)
    case 'geometric':
      // 1, 2, 4, 8, 16... (multiply by 2)
      return Array.from({ length }, (_, i) => Math.pow(2, i))
    case 'fibonacci': {
      // 1, 1, 2, 3, 5, 8... (add previous two)
      const fib = [1, 1]
      for (let i = 2; i < length; i++) {
        fib.push(fib[i - 1] + fib[i - 2])
      }
      return fib.slice(0, length)
    }
    case 'prime': {
      // 2, 3, 5, 7, 11... (prime numbers)
      const primes: number[] = []
      let n = 2
      while (primes.length < length) {
        if (isPrime(n)) primes.push(n)
        n++
      }
      return primes
    }
    case 'square':
      // 1, 4, 9, 16, 25... (perfect squares)
      return Array.from({ length }, (_, i) => (i + 1) * (i + 1))
    case 'triangular':
      // 1, 3, 6, 10, 15... (triangular numbers: n(n+1)/2)
      return Array.from({ length }, (_, i) => ((i + 1) * (i + 2)) / 2)
    case 'powers3':
      // 1, 3, 9, 27, 81... (powers of 3)
      return Array.from({ length }, (_, i) => Math.pow(3, i))
  }
}

function isPrime(n: number): boolean {
  if (n < 2) return false
  for (let i = 2; i <= Math.sqrt(n); i++) {
    if (n % i === 0) return false
  }
  return true
}

// Sequence info for hints
export const SEQUENCE_INFO: Record<SequenceType, SequenceInfo> = {
  arithmetic: {
    type: 'arithmetic',
    name: 'Counting Numbers',
    description: 'Add 1 to get the next number',
    formula: 'aₙ = n',
  },
  geometric: {
    type: 'geometric',
    name: 'Powers of 2',
    description: 'Multiply by 2 to get the next number',
    formula: 'aₙ = 2^(n-1)',
  },
  fibonacci: {
    type: 'fibonacci',
    name: 'Fibonacci Sequence',
    description: 'Add the previous two numbers',
    formula: 'aₙ = aₙ₋₁ + aₙ₋₂',
  },
  prime: {
    type: 'prime',
    name: 'Prime Numbers',
    description: 'Numbers only divisible by 1 and themselves',
    formula: 'p: p ∤ k for 1 < k < p',
  },
  square: {
    type: 'square',
    name: 'Perfect Squares',
    description: 'Numbers that are n × n',
    formula: 'aₙ = n²',
  },
  triangular: {
    type: 'triangular',
    name: 'Triangular Numbers',
    description: 'Sum of first n natural numbers',
    formula: 'aₙ = n(n+1)/2',
  },
  powers3: {
    type: 'powers3',
    name: 'Powers of 3',
    description: 'Multiply by 3 to get the next number',
    formula: 'aₙ = 3^(n-1)',
  },
}

export const presetGames: GameConfig[] = [
  // Easy: Arithmetic sequences
  {
    id: 'arith_10',
    name: 'Count to 10',
    target: 10,
    stepPool: generateSequence('arithmetic', 4), // [1,2,3,4]
    difficulty: 'easy',
    sequenceType: 'arithmetic',
    aiMovesFirst: true, // Second-mover wins this game
  },
  {
    id: 'arith_15',
    name: 'Count to 15',
    target: 15,
    stepPool: generateSequence('arithmetic', 5), // [1,2,3,4,5]
    difficulty: 'easy',
    sequenceType: 'arithmetic',
  },

  // Medium: Geometric and Fibonacci
  {
    id: 'geo_15',
    name: 'Powers of 2',
    target: 15,
    stepPool: generateSequence('geometric', 4), // [1,2,4,8]
    difficulty: 'medium',
    sequenceType: 'geometric',
    aiMovesFirst: true, // Second-mover wins this game
  },
  {
    id: 'fib_13',
    name: 'Fibonacci Race',
    target: 13,
    stepPool: generateSequence('fibonacci', 5), // [1,1,2,3,5]
    difficulty: 'medium',
    sequenceType: 'fibonacci',
    aiMovesFirst: true, // Second-mover wins this game
  },
  {
    id: 'geo_31',
    name: 'Binary Sprint',
    target: 31,
    stepPool: generateSequence('geometric', 5), // [1,2,4,8,16]
    difficulty: 'medium',
    sequenceType: 'geometric',
  },

  // Hard: Primes and Squares
  {
    id: 'prime_28',
    name: 'Prime Time',
    target: 28,
    stepPool: generateSequence('prime', 5), // [2,3,5,7,11]
    difficulty: 'hard',
    sequenceType: 'prime',
  },
  {
    id: 'square_30',
    name: 'Square Race',
    target: 30,
    stepPool: generateSequence('square', 4), // [1,4,9,16]
    difficulty: 'hard',
    sequenceType: 'square',
    aiMovesFirst: true, // Second-mover wins this game
  },
  {
    id: 'fib_21',
    name: 'Golden Ratio',
    target: 21,
    stepPool: generateSequence('fibonacci', 6), // [1,1,2,3,5,8]
    difficulty: 'hard',
    sequenceType: 'fibonacci',
  },

  // New: Triangular numbers
  {
    id: 'tri_21',
    name: 'Triangle Count',
    target: 21,
    stepPool: generateSequence('triangular', 5), // [1,3,6,10,15]
    difficulty: 'medium',
    sequenceType: 'triangular',
    aiMovesFirst: true, // Second-mover wins this game
  },
  {
    id: 'tri_36',
    name: 'Pyramid Race',
    target: 36,
    stepPool: generateSequence('triangular', 6), // [1,3,6,10,15,21]
    difficulty: 'hard',
    sequenceType: 'triangular',
    aiMovesFirst: true, // Second-mover wins this game
  },

  // New: Powers of 3
  {
    id: 'pow3_13',
    name: 'Ternary Sprint',
    target: 13,
    stepPool: generateSequence('powers3', 4), // [1,3,9,27]
    difficulty: 'medium',
    sequenceType: 'powers3',
  },
  {
    id: 'pow3_40',
    name: 'Triple Power',
    target: 40,
    stepPool: generateSequence('powers3', 4), // [1,3,9,27]
    difficulty: 'hard',
    sequenceType: 'powers3',
    aiMovesFirst: true, // Second-mover wins this game
  },
]

/**
 * Generate a random game config with a random sequence type
 */
export function generateRandomConfig(
  difficulty: 'easy' | 'medium' | 'hard',
): GameConfig {
  let sequenceTypes: SequenceType[]
  let poolSize: number

  switch (difficulty) {
    case 'easy':
      sequenceTypes = ['arithmetic', 'triangular']
      poolSize = 3 + Math.floor(Math.random() * 2) // 3-4
      break
    case 'medium':
      sequenceTypes = [
        'geometric',
        'fibonacci',
        'arithmetic',
        'triangular',
        'powers3',
      ]
      poolSize = 4 + Math.floor(Math.random() * 2) // 4-5
      break
    case 'hard':
      sequenceTypes = [
        'prime',
        'square',
        'fibonacci',
        'geometric',
        'triangular',
        'powers3',
      ]
      poolSize = 4 + Math.floor(Math.random() * 3) // 4-6
      break
  }

  const sequenceType =
    sequenceTypes[Math.floor(Math.random() * sequenceTypes.length)]
  const stepPool = generateSequence(sequenceType, poolSize)

  // Calculate a reasonable target based on the step pool
  const maxStep = Math.max(...stepPool)
  const minTarget = maxStep * 2
  const maxTarget = stepPool.reduce((a, b) => a + b, 0)
  const target = minTarget + Math.floor(Math.random() * (maxTarget - minTarget))

  // Create base config
  const baseConfig: GameConfig = {
    id: `random_${Date.now()}`,
    name: `${SEQUENCE_INFO[sequenceType].name} (${target})`,
    target,
    stepPool,
    difficulty,
    sequenceType,
  }

  // Validate fairness - ensure player can win
  const fairness = validateGameFairness(baseConfig)

  // If player can't win going first, check if they can win going second
  if (!fairness.isPlayerWinnable && fairness.isAIWinnable) {
    // Player gets second-mover advantage (AI moves first)
    return { ...baseConfig, aiMovesFirst: true }
  }

  return baseConfig
}

// ========================================
// Dev Mode: Preset Validation
// ========================================

/**
 * Run validation on all presets in development mode
 * Logs warnings for unfair games where player cannot win
 */
export function runPresetValidation(): Map<string, FairnessResult> {
  const results = validateAllPresets(presetGames)
  return results
}

// Export for external use (e.g., in game UI to show fairness badge)
export type { FairnessResult }
