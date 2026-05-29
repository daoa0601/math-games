import { describe, expect, it } from 'vitest'

import type { GameFeedback } from '@math-games/core'

import { formatGameFeedback } from './i18n-format'

describe('formatGameFeedback', () => {
  const fb: GameFeedback = {
    kind: 'misconception',
    labelKey: 'eb.feedback.wrong_substitution',
    params: { answer: 4, result: 7, rightSide: 9 },
  }

  it('interpolates params into the localized (en) template', () => {
    expect(formatGameFeedback('en', fb)).toBe(
      'Substituting 4 makes the left side 7, not 9. Both sides must match.',
    )
  })

  it('localizes the same feedback to vi', () => {
    expect(formatGameFeedback('vi', fb)).toBe(
      'Thay 4 làm vế trái bằng 7, không phải 9. Hai vế phải bằng nhau.',
    )
  })

  it('returns null for non-misconception kinds and for undefined', () => {
    expect(
      formatGameFeedback('en', { kind: 'generic', message: 'x' }),
    ).toBeNull()
    expect(formatGameFeedback('en', undefined)).toBeNull()
  })

  it('leaves an unmatched placeholder intact when a param is missing', () => {
    const partial = formatGameFeedback('en', {
      kind: 'misconception',
      labelKey: 'eb.feedback.wrong_substitution',
      params: { answer: 4 },
    })
    expect(partial).toContain('Substituting 4')
    expect(partial).toContain('{result}')
  })
})
