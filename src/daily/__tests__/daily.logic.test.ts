import { describe, expect, it } from 'vitest'

import { getUtcDateKey, planDailyChallenge } from '../daily.logic'
import { registry } from '@/games/registry'

describe('getUtcDateKey', () => {
  it('formats UTC date as YYYY-MM-DD', () => {
    expect(getUtcDateKey(new Date('2026-05-13T23:30:00.000Z'))).toBe(
      '2026-05-13',
    )
  })

  it('handles midnight boundary correctly', () => {
    expect(getUtcDateKey(new Date('2026-05-13T23:59:59.999Z'))).toBe(
      '2026-05-13',
    )
    expect(getUtcDateKey(new Date('2026-05-14T00:00:00.000Z'))).toBe(
      '2026-05-14',
    )
  })

  it('defaults to current date when no argument', () => {
    const key = getUtcDateKey()
    expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('planDailyChallenge', () => {
  it('is deterministic for a date', () => {
    expect(planDailyChallenge('2026-05-13')).toEqual(
      planDailyChallenge('2026-05-13'),
    )
  })

  it('produces different challenges for different dates', () => {
    const a = planDailyChallenge('2026-05-13')
    const b = planDailyChallenge('2026-05-14')

    // At minimum the seed differs (dates are in the seed)
    expect(a.seed).not.toBe(b.seed)
  })

  it('returns a valid game from the registry', () => {
    const challenge = planDailyChallenge('2026-05-13')

    expect(challenge.gameId in registry).toBe(true)
  })

  it('returns a level that resolves in the game module', () => {
    for (const date of ['2026-01-01', '2026-06-15', '2026-12-31']) {
      const challenge = planDailyChallenge(date)
      const module = registry[challenge.gameId]
      const config = module.resolveLevelConfig(challenge.levelId)

      expect(config).not.toBeNull()
    }
  })

  it('rotates across all three games over enough dates', () => {
    const seen = new Set<string>()

    for (let i = 0; i < 30; i++) {
      const date = `2026-01-${String(i + 1).padStart(2, '0')}`
      const challenge = planDailyChallenge(date)
      seen.add(challenge.gameId)
    }

    expect(seen.size).toBe(3)
  })

  it('stores a serializable config payload', () => {
    const challenge = planDailyChallenge('2026-05-13')

    expect(JSON.parse(challenge.configJson)).toMatchObject({
      gameId: challenge.gameId,
      levelId: challenge.levelId,
      route: challenge.route,
    })
  })

  it('includes challengeDate in the result', () => {
    const challenge = planDailyChallenge('2026-05-13')
    expect(challenge.challengeDate).toBe('2026-05-13')
  })

  it('builds seed from date, game, and level', () => {
    const challenge = planDailyChallenge('2026-05-13')
    expect(challenge.seed).toBe(
      `2026-05-13:${challenge.gameId}:${challenge.levelId}`,
    )
  })
})
