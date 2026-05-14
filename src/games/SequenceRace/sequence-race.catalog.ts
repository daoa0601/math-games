import { createSeededRandom } from '@/shared/utils'

import { SEQUENCE_INFO, generateSeededConfig, presetGames } from './logic'

export type SequenceRaceDifficulty = 'easy' | 'medium' | 'hard'

function normalizePracticeSeed(seed: string) {
  return seed
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function getSequenceRaceCatalog() {
  const config =
    presetGames.find((game) => game.id === 'arith_15') ?? presetGames[0]

  return {
    config,
    configs: presetGames,
    initialConfigId: config.id,
    sequenceInfoByType: SEQUENCE_INFO,
  }
}

export function getSequenceRacePracticeConfig(
  seed: string,
  difficulty: SequenceRaceDifficulty = 'medium',
) {
  const normalizedSeed = normalizePracticeSeed(seed) || 'practice'
  const config = generateSeededConfig(
    createSeededRandom(`sequence-race-practice-${normalizedSeed}`),
    difficulty,
  )

  return {
    ...config,
    id: `practice_${difficulty}_${normalizedSeed}`,
    name: `Practice: ${config.name}`,
  }
}
