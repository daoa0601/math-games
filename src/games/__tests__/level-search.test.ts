import { describe, expect, it } from 'vitest'

import { validateLevelSearch } from '../level-search'

describe('validateLevelSearch', () => {
  it('keeps non-empty level ids', () => {
    expect(validateLevelSearch({ level: 'magic-square-3×3' })).toEqual({
      level: 'magic-square-3×3',
    })
  })

  it('drops missing and empty level ids', () => {
    expect(validateLevelSearch({})).toEqual({ level: undefined })
    expect(validateLevelSearch({ level: '' })).toEqual({ level: undefined })
  })

  it('drops non-string values', () => {
    expect(validateLevelSearch({ level: 42 })).toEqual({ level: undefined })
  })
})
