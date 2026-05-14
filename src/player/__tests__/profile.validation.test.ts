import { describe, expect, it } from 'vitest'

import { validatePlayerProfileInput } from '../profile.validation'

describe('validatePlayerProfileInput', () => {
  it('normalizes display names', () => {
    expect(
      validatePlayerProfileInput({
        displayName: '  Linh   Nguyen  ',
        locale: 'vi',
        gradeBand: 'middle',
      }),
    ).toEqual({
      displayName: 'Linh Nguyen',
      locale: 'vi',
      gradeBand: 'middle',
    })
  })

  it('rejects invalid locales', () => {
    expect(() =>
      validatePlayerProfileInput({
        displayName: 'Linh',
        locale: 'fr' as 'vi',
        gradeBand: 'middle',
      }),
    ).toThrow('Invalid player profile payload')
  })

  it('rejects short display names', () => {
    expect(() =>
      validatePlayerProfileInput({
        displayName: 'A',
        locale: 'en',
        gradeBand: 'elementary',
      }),
    ).toThrow('Invalid player profile payload')
  })
})
