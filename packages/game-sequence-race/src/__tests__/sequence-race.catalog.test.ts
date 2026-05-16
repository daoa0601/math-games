import { describe, expect, it } from 'vitest'

import {
  getSequenceRaceCatalog,
  getSequenceRacePracticeConfig,
} from '../catalog'

describe('Sequence Race catalog', () => {
  it('exposes every preset to the migrated route', () => {
    const catalog = getSequenceRaceCatalog()

    expect(catalog.configs).toHaveLength(12)
    expect(catalog.configs.map((config) => config.id)).toEqual(
      expect.arrayContaining([
        'arith_10',
        'arith_15',
        'geo_31',
        'prime_28',
        'pow3_40',
      ]),
    )
  })

  it('uses a stable default level', () => {
    expect(getSequenceRaceCatalog().initialConfigId).toBe('arith_15')
  })

  it('provides sequence metadata for every preset type', () => {
    const catalog = getSequenceRaceCatalog()

    for (const config of catalog.configs) {
      const sequenceType = config.sequenceType ?? 'arithmetic'
      expect(catalog.sequenceInfoByType[sequenceType]).toMatchObject({
        type: sequenceType,
      })
    }
  })

  it('generates deterministic practice configs from a seed', () => {
    expect(getSequenceRacePracticeConfig(' May 13 ', 'hard')).toEqual(
      getSequenceRacePracticeConfig('may-13', 'hard'),
    )
  })

  it('uses progress-safe ids for practice configs', () => {
    expect(
      getSequenceRacePracticeConfig('Prime sprint!', 'medium'),
    ).toMatchObject({
      id: 'practice_medium_prime-sprint',
      difficulty: 'medium',
    })
  })
})
