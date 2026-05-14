import { describe, expect, it } from 'vitest'

import { getUtcDateKey, planDailyChallenge } from '../daily.logic'

describe('daily challenge planning', () => {
  it('uses UTC date keys', () => {
    expect(getUtcDateKey(new Date('2026-05-13T23:30:00.000Z'))).toBe(
      '2026-05-13',
    )
  })

  it('is deterministic for a date', () => {
    expect(planDailyChallenge('2026-05-13')).toEqual(
      planDailyChallenge('2026-05-13'),
    )
  })

  it('stores a serializable config payload', () => {
    const challenge = planDailyChallenge('2026-05-13')

    expect(JSON.parse(challenge.configJson)).toMatchObject({
      gameId: challenge.gameId,
      levelId: challenge.levelId,
      route: challenge.route,
    })
  })
})
