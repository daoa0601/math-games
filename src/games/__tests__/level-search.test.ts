import { describe, expect, it } from 'vitest'

import { validateLevelSearch } from '../level-search'

describe('validateLevelSearch', () => {
  it('keeps non-empty level ids', () => {
    expect(validateLevelSearch({ level: 'magic-square-3×3' })).toEqual({
      level: 'magic-square-3×3',
    })
  })

  it('keeps unicode level ids', () => {
    expect(validateLevelSearch({ level: 'puzzle-café-☕' })).toEqual({
      level: 'puzzle-café-☕',
    })
  })

  it('drops missing and empty level ids', () => {
    expect(validateLevelSearch({})).toEqual({ level: undefined })
    expect(validateLevelSearch({ level: '' })).toEqual({ level: undefined })
  })

  it('drops non-string values', () => {
    expect(validateLevelSearch({ level: 42 })).toEqual({ level: undefined })
    expect(validateLevelSearch({ level: true })).toEqual({ level: undefined })
    expect(validateLevelSearch({ level: null })).toEqual({ level: undefined })
    expect(validateLevelSearch({ level: undefined })).toEqual({
      level: undefined,
    })
    expect(validateLevelSearch({ level: ['array'] })).toEqual({
      level: undefined,
    })
    expect(validateLevelSearch({ level: { nested: true } })).toEqual({
      level: undefined,
    })
  })

  it('ignores extra keys in the search object', () => {
    const result = validateLevelSearch({
      level: 'test',
      extra: 'ignored',
      __proto__: {},
    })
    expect(result).toEqual({ level: 'test' })
    expect(Object.keys(result)).toEqual(['level'])
  })

  it('handles very long strings', () => {
    const long = 'a'.repeat(1000)
    expect(validateLevelSearch({ level: long })).toEqual({ level: long })
  })
})
