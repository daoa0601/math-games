import { describe, expect, it } from 'vitest'

import { parseDailyChallengeConfig, planDailyChallenge } from '../daily.logic'
import { registry } from '@/games/registry'

describe('planDailyChallenge', () => {
  it('is deterministic for a date', async () => {
    expect(await planDailyChallenge('2026-05-13')).toEqual(
      await planDailyChallenge('2026-05-13'),
    )
  })

  it('produces different challenges for different dates', async () => {
    const a = await planDailyChallenge('2026-05-13')
    const b = await planDailyChallenge('2026-05-14')

    expect(a.seed).not.toBe(b.seed)
  })

  it('returns a valid game from the registry', async () => {
    const challenge = await planDailyChallenge('2026-05-13')

    expect(challenge.gameId in registry).toBe(true)
  })

  it('returns a level that resolves in the game module', async () => {
    for (const date of ['2026-01-01', '2026-06-15', '2026-12-31']) {
      const challenge = await planDailyChallenge(date)
      const module = registry[challenge.gameId]
      const config = module.resolveLevelConfig(challenge.levelId)

      expect(config).not.toBeNull()
    }
  })

  it('rotates across all three games over enough dates', async () => {
    const seen = new Set<string>()

    for (let i = 0; i < 30; i++) {
      const date = `2026-01-${String(i + 1).padStart(2, '0')}`
      const challenge = await planDailyChallenge(date)
      seen.add(challenge.gameId)
    }

    expect(seen.size).toBe(3)
  })

  it('stores a serializable config payload', async () => {
    const challenge = await planDailyChallenge('2026-05-13')

    expect(parseDailyChallengeConfig(challenge.configJson)).toMatchObject({
      gameId: challenge.gameId,
      levelId: challenge.levelId,
      route: challenge.route,
    })
  })

  it('rejects invalid config payloads', () => {
    expect(() =>
      parseDailyChallengeConfig(
        JSON.stringify({
          gameId: 'unknown',
          levelId: 'level',
          title: 'Title',
          route: '/games/magic-graph',
          difficulty: 'medium',
        }),
      ),
    ).toThrow()
  })

  it('includes challengeDate in the result', async () => {
    const challenge = await planDailyChallenge('2026-05-13')
    expect(challenge.challengeDate).toBe('2026-05-13')
  })

  it('builds seed from date, game, and level', async () => {
    const challenge = await planDailyChallenge('2026-05-13')
    expect(challenge.seed).toBe(
      `2026-05-13:${challenge.gameId}:${challenge.levelId}`,
    )
  })
})
