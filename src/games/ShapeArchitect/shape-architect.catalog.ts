import { createSeededRandom } from '@/shared/utils'

import { generateGuaranteedSolvableWithRetry, presetLevels } from './logic'

export type ShapeArchitectPracticeDifficulty = 'easy' | 'medium' | 'hard'

function normalizePracticeSeed(seed: string) {
  return seed
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function getShapeArchitectCatalog() {
  const config =
    presetLevels.find((level) => level.id === 'easy_1') ?? presetLevels[0]

  return {
    config,
    configs: presetLevels,
    initialConfigId: config.id,
  }
}

export function getShapeArchitectPracticeConfig(
  seed: string,
  difficulty: ShapeArchitectPracticeDifficulty = 'medium',
) {
  const normalizedSeed = normalizePracticeSeed(seed) || 'practice'
  const config = generateGuaranteedSolvableWithRetry(
    createSeededRandom(`shape-architect-practice-${normalizedSeed}`),
    difficulty,
  )

  return {
    ...config,
    id: `practice_${difficulty}_${normalizedSeed}`,
    name: `Practice: ${config.name}`,
  }
}
