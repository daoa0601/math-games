import { describe, expect, it } from 'vitest'

import { checkAchievements, getAchievementById } from '../achievements.logic'

describe('achievement logic', () => {
  it('unlocks first completion achievements once', () => {
    expect(
      checkAchievements(
        {
          gameId: 'magic-graph',
          completed: true,
          difficulty: 'easy',
        },
        [],
      ),
    ).toEqual(['global_first_steps', 'mg_first_solve'])

    expect(
      checkAchievements(
        {
          gameId: 'magic-graph',
          completed: true,
          difficulty: 'easy',
        },
        ['global_first_steps', 'mg_first_solve'],
      ),
    ).toEqual([])
  })

  it('unlocks all-games when every game has progress', () => {
    expect(
      checkAchievements(
        {
          gameId: 'shape-architect',
          completed: true,
          gamesPlayedByType: {
            'magic-graph': 1,
            'sequence-race': 1,
            'shape-architect': 1,
          },
        },
        ['global_first_steps'],
      ),
    ).toContain('global_all_games')
  })

  it('keeps hard sequence victory separate from any loss', () => {
    expect(
      checkAchievements(
        {
          gameId: 'sequence-race',
          completed: false,
          difficulty: 'hard',
          wasWinner: false,
        },
        [],
      ),
    ).toEqual([])

    expect(
      checkAchievements(
        {
          gameId: 'sequence-race',
          completed: true,
          difficulty: 'hard',
          wasWinner: true,
        },
        [],
      ),
    ).toEqual(['global_first_steps', 'sr_first_victory', 'sr_hard_winner'])
  })

  it('exposes achievement metadata by id', () => {
    expect(getAchievementById('sa_first_build')).toMatchObject({
      category: 'shape-architect',
      rarity: 'common',
    })
  })
})
