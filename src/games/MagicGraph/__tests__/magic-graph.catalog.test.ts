import { describe, expect, it } from 'vitest'

import {
  createMagicGraphPuzzleId,
  getMagicGraphCatalog,
  getMagicGraphPracticeConfig,
} from '../magic-graph.catalog'

describe('Magic Graph catalog', () => {
  it('assigns stable route ids to puzzle templates', () => {
    expect(createMagicGraphPuzzleId('Magic Square 3×3')).toBe(
      'magic-square-3×3',
    )
  })

  it('exposes the verified puzzle template catalog', () => {
    const catalog = getMagicGraphCatalog()

    expect(catalog.configs.length).toBeGreaterThan(5)
    expect(catalog.configs.map((config) => config.id)).toEqual(
      expect.arrayContaining([
        'line-of-three',
        'cross',
        'magic-triangle',
        'diamond',
        'magic-square-3×3',
      ]),
    )
  })

  it('uses Magic Triangle as the stable default puzzle', () => {
    expect(getMagicGraphCatalog().initialConfigId).toBe('magic-triangle')
  })

  it('keeps every puzzle ready for progress persistence', () => {
    for (const config of getMagicGraphCatalog().configs) {
      expect(config.id.length).toBeGreaterThan(0)
      expect(config.nodes.length).toBe(config.availableNumbers.length)
      expect(config.lines.length).toBeGreaterThan(0)
    }
  })

  it('generates deterministic seeded practice puzzles', () => {
    const config = getMagicGraphPracticeConfig(' Prime Sprint ', 'hard')
    const matchingConfig = getMagicGraphPracticeConfig('prime-sprint', 'hard')

    expect(config.id).toBe('practice_hard_prime-sprint')
    expect(config).toEqual(matchingConfig)
    expect(config.name).toMatch(/^Practice: /)
    expect(config.difficulty).toBe('hard')
  })
})
