import { describe, expect, it } from 'vitest'

import { parseDailyChallengeConfig, planDailyChallenge } from './daily.logic'
import type { DailySelectionStrategy } from './daily.strategy'

function stubStrategy(
  gameId: string,
  difficultyHint?: string,
): DailySelectionStrategy {
  return { id: 'stub', select: () => ({ gameId, difficultyHint }) }
}

describe('planDailyChallenge (per-player)', () => {
  it('wires the strategy decision through the chosen module', () => {
    const planned = planDailyChallenge(
      '2026-06-01',
      'player-1',
      [],
      stubStrategy('equation-balance'),
    )

    expect(planned.gameId).toBe('equation-balance')
    expect(planned.route).toBe('/games/equation-balance')
    expect(planned.levelId).toBeTruthy()
    expect(planned.title).toBeTruthy()
    expect(planned.playerId).toBe('player-1')
    expect(planned.challengeDate).toBe('2026-06-01')
    expect(planned.seed).toBe(
      `2026-06-01:player-1:equation-balance:${planned.levelId}`,
    )
  })

  it('round-trips configJson through parseDailyChallengeConfig', () => {
    const planned = planDailyChallenge(
      '2026-06-02',
      'p2',
      [],
      stubStrategy('magic-graph'),
    )

    const parsed = parseDailyChallengeConfig(planned.configJson)
    expect(parsed.gameId).toBe('magic-graph')
    expect(parsed.levelId).toBe(planned.levelId)
    expect(parsed.route).toBe('/games/magic-graph')
  })

  it('still returns a valid level when a difficulty hint is supplied', () => {
    const planned = planDailyChallenge(
      '2026-06-03',
      'p3',
      [],
      stubStrategy('equation-balance', 'hard'),
    )

    expect(planned.levelId).toBeTruthy()
    expect(typeof planned.difficulty).toBe('string')
  })
})
