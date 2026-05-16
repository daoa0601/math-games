export interface PatternConfig {
  id: string
  difficulty: 'easy' | 'medium' | 'hard'
  patternType:
    | 'arithmetic'
    | 'geometric'
    | 'fibonacci-like'
    | 'prime'
    | 'custom'
  sequence: readonly number[]
  missingIndex: number
  answer: number
  distractors: readonly number[]
  hint?: string
}

export const catalog: readonly PatternConfig[] = [
  // --- Easy: arithmetic sequences ---
  {
    id: 'pd-easy-add2',
    difficulty: 'easy',
    patternType: 'arithmetic',
    sequence: [2, 4, 6, -1, 10],
    missingIndex: 3,
    answer: 8,
    distractors: [7, 9, 12],
    hint: 'Each number increases by the same amount.',
  },
  {
    id: 'pd-easy-add3',
    difficulty: 'easy',
    patternType: 'arithmetic',
    sequence: [3, 6, 9, 12, -1],
    missingIndex: 4,
    answer: 15,
    distractors: [13, 14, 18],
  },
  {
    id: 'pd-easy-add5',
    difficulty: 'easy',
    patternType: 'arithmetic',
    sequence: [5, 10, -1, 20, 25],
    missingIndex: 2,
    answer: 15,
    distractors: [12, 14, 16],
  },
  {
    id: 'pd-easy-add10',
    difficulty: 'easy',
    patternType: 'arithmetic',
    sequence: [-1, 20, 30, 40, 50],
    missingIndex: 0,
    answer: 10,
    distractors: [5, 8, 15],
  },
  {
    id: 'pd-easy-sub2',
    difficulty: 'easy',
    patternType: 'arithmetic',
    sequence: [20, 18, 16, -1, 12],
    missingIndex: 3,
    answer: 14,
    distractors: [13, 15, 17],
  },
  {
    id: 'pd-easy-double',
    difficulty: 'easy',
    patternType: 'geometric',
    sequence: [1, 2, 4, -1, 16],
    missingIndex: 3,
    answer: 8,
    distractors: [6, 10, 12],
  },

  // --- Medium: geometric, fibonacci-like, primes ---
  {
    id: 'pd-med-triple',
    difficulty: 'medium',
    patternType: 'geometric',
    sequence: [2, 6, 18, -1, 162],
    missingIndex: 3,
    answer: 54,
    distractors: [36, 48, 72],
  },
  {
    id: 'pd-med-fib',
    difficulty: 'medium',
    patternType: 'fibonacci-like',
    sequence: [1, 1, 2, 3, -1, 8],
    missingIndex: 4,
    answer: 5,
    distractors: [4, 6, 7],
  },
  {
    id: 'pd-med-fib2',
    difficulty: 'medium',
    patternType: 'fibonacci-like',
    sequence: [2, 3, 5, 8, -1, 21],
    missingIndex: 4,
    answer: 13,
    distractors: [10, 11, 15],
  },
  {
    id: 'pd-med-prime',
    difficulty: 'medium',
    patternType: 'prime',
    sequence: [2, 3, 5, 7, -1, 13],
    missingIndex: 4,
    answer: 11,
    distractors: [9, 10, 12],
  },
  {
    id: 'pd-med-squares',
    difficulty: 'medium',
    patternType: 'custom',
    sequence: [1, 4, 9, -1, 25, 36],
    missingIndex: 3,
    answer: 16,
    distractors: [12, 14, 18],
  },
  {
    id: 'pd-med-cubes',
    difficulty: 'medium',
    patternType: 'custom',
    sequence: [1, 8, 27, -1, 125],
    missingIndex: 3,
    answer: 64,
    distractors: [36, 48, 81],
  },

  // --- Hard: multi-step patterns ---
  {
    id: 'pd-hard-triangular',
    difficulty: 'hard',
    patternType: 'custom',
    sequence: [1, 3, 6, 10, -1, 21],
    missingIndex: 4,
    answer: 15,
    distractors: [12, 14, 18],
  },
  {
    id: 'pd-hard-alt-sign',
    difficulty: 'hard',
    patternType: 'custom',
    sequence: [1, -2, 4, -8, -1, -32],
    missingIndex: 4,
    answer: 16,
    distractors: [-16, 10, 24],
  },
  {
    id: 'pd-hard-pow2-minus1',
    difficulty: 'hard',
    patternType: 'custom',
    sequence: [1, 3, 7, 15, -1, 63],
    missingIndex: 4,
    answer: 31,
    distractors: [23, 27, 32],
  },
  {
    id: 'pd-hard-factorial',
    difficulty: 'hard',
    patternType: 'custom',
    sequence: [1, 2, 6, 24, -1, 720],
    missingIndex: 4,
    answer: 120,
    distractors: [48, 60, 100],
  },
  {
    id: 'pd-hard-prime-gap',
    difficulty: 'hard',
    patternType: 'prime',
    sequence: [29, 31, 37, 41, -1, 47],
    missingIndex: 4,
    answer: 43,
    distractors: [42, 44, 45],
  },
  {
    id: 'pd-hard-catalan',
    difficulty: 'hard',
    patternType: 'custom',
    sequence: [1, 1, 2, 5, -1, 42],
    missingIndex: 4,
    answer: 14,
    distractors: [8, 10, 21],
  },
]

export const difficulties = ['easy', 'medium', 'hard'] as const
