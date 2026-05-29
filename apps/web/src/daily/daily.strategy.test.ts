import { describe, expect, it } from 'vitest'

import {
  frontierWeightedStrategy,
  seedHash,
  type PerGameStat,
} from './daily.strategy'

const ROTATION = [
  'magic-graph',
  'sequence-race',
  'shape-architect',
  'pattern-detective',
  'fraction-builder',
  'equation-balance',
] as const

function select(
  dateKey: string,
  playerId: string,
  perGameStats: PerGameStat[],
) {
  return frontierWeightedStrategy.select({
    dateKey,
    playerId,
    perGameStats,
    publishedGameIds: ROTATION,
    rotation: ROTATION,
  })
}

describe('seedHash', () => {
  it('is deterministic and unsigned', () => {
    expect(seedHash('2026-06-01:p1')).toBe(seedHash('2026-06-01:p1'))
    expect(seedHash('a')).not.toBe(seedHash('b'))
    expect(seedHash('anything')).toBeGreaterThanOrEqual(0)
  })
})

describe('frontierWeightedStrategy', () => {
  it('picks an unplayed game over a played-but-incomplete one (broaden coverage)', () => {
    // magic-graph heavily played + high completion; every other game is unplayed
    // (score 0) so the pick must be one of them, never magic-graph.
    const decision = select('2026-06-01', 'p1', [
      { gameId: 'magic-graph', attempts: 50, completionRate: 0.9 },
    ])
    expect(decision.gameId).not.toBe('magic-graph')
    expect(ROTATION).toContain(decision.gameId)
  })

  it('among played games, prefers the lowest-completion (weakest) game', () => {
    const decision = frontierWeightedStrategy.select({
      dateKey: '2026-06-01',
      playerId: 'p1',
      // both games played; equation-balance is weaker.
      perGameStats: [
        { gameId: 'magic-graph', attempts: 10, completionRate: 0.8 },
        { gameId: 'equation-balance', attempts: 10, completionRate: 0.3 },
      ],
      publishedGameIds: ['magic-graph', 'equation-balance'],
      rotation: ['magic-graph', 'equation-balance'],
    })
    expect(decision.gameId).toBe('equation-balance')
  })

  it('maps completion rate to a difficulty hint (low→easy, mid→medium, high→hard)', () => {
    const one = ['magic-graph'] as const
    const at = (completionRate: number) =>
      frontierWeightedStrategy.select({
        dateKey: '2026-06-01',
        playerId: 'p1',
        perGameStats: [{ gameId: 'magic-graph', attempts: 10, completionRate }],
        publishedGameIds: one,
        rotation: one,
      }).difficultyHint

    expect(at(0.1)).toBe('easy')
    expect(at(0.5)).toBe('medium')
    expect(at(0.9)).toBe('hard')
  })

  it('gives a new player (no history) a deterministic, easy pick', () => {
    const a = select('2026-06-01', 'p1', [])
    const b = select('2026-06-01', 'p1', [])
    expect(a).toEqual(b)
    expect(a.difficultyHint).toBe('easy')
    expect(ROTATION).toContain(a.gameId)
  })

  it('is idempotent for identical input', () => {
    const stats: PerGameStat[] = [
      { gameId: 'magic-graph', attempts: 3, completionRate: 0.5 },
    ]
    expect(select('2026-06-02', 'p9', stats)).toEqual(
      select('2026-06-02', 'p9', stats),
    )
  })

  it('varies the pick across consecutive dates for a new player', () => {
    const picks = new Set<string>()
    for (let d = 1; d <= 10; d++) {
      const dateKey = `2026-06-${String(d).padStart(2, '0')}`
      picks.add(select(dateKey, 'p1', []).gameId)
    }
    expect(picks.size).toBeGreaterThan(1)
  })

  it('varies the pick across players on the same date (new players)', () => {
    const picks = new Set<string>()
    for (let p = 0; p < 12; p++)
      picks.add(select('2026-06-01', `player-${p}`, []).gameId)
    expect(picks.size).toBeGreaterThan(1)
  })
})
