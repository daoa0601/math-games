import { describe, expect, it } from 'vitest'

import {
  checkAchievements,
  getAchievementById,
  ACHIEVEMENTS,
} from '../achievements.logic'

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

  it('does not unlock first_steps on incomplete game', () => {
    expect(
      checkAchievements(
        {
          gameId: 'magic-graph',
          completed: false,
          difficulty: 'easy',
        },
        [],
      ),
    ).not.toContain('global_first_steps')
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

  it('does not unlock all-games when a game is missing', () => {
    const result = checkAchievements(
      {
        gameId: 'shape-architect',
        completed: true,
        gamesPlayedByType: {
          'magic-graph': 1,
          'sequence-race': 0,
          'shape-architect': 1,
        },
      },
      ['global_first_steps'],
    )
    expect(result).not.toContain('global_all_games')
  })

  it('unlocks streak achievement at exactly 30 days', () => {
    const result = checkAchievements(
      {
        gameId: 'magic-graph',
        completed: true,
        streak: 30,
      },
      ['global_first_steps'],
    )
    expect(result).toContain('global_streak_30')
  })

  it('does not unlock streak achievement at 29 days', () => {
    const result = checkAchievements(
      {
        gameId: 'magic-graph',
        completed: true,
        streak: 29,
      },
      ['global_first_steps'],
    )
    expect(result).not.toContain('global_streak_30')
  })

  it('unlocks grandmaster achievement', () => {
    const result = checkAchievements(
      {
        gameId: 'magic-graph',
        completed: true,
        currentRank: 'grandmaster',
      },
      ['global_first_steps'],
    )
    expect(result).toContain('global_grandmaster')
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

  it('handles duplicate achievement ids in the already-unlocked list', () => {
    const result = checkAchievements(
      {
        gameId: 'magic-graph',
        completed: true,
        difficulty: 'easy',
      },
      ['global_first_steps', 'global_first_steps', 'mg_first_solve'],
    )
    expect(result).toEqual([])
  })

  it('handles empty already-unlocked list', () => {
    const result = checkAchievements(
      {
        gameId: 'magic-graph',
        completed: true,
        difficulty: 'easy',
      },
      [],
    )
    expect(result.length).toBeGreaterThan(0)
    expect(result).toContain('global_first_steps')
  })
})

describe('getAchievementById', () => {
  it('finds achievement metadata by id', () => {
    expect(getAchievementById('sa_first_build')).toMatchObject({
      category: 'shape-architect',
      rarity: 'common',
    })
  })

  it('returns undefined for unknown id', () => {
    expect(getAchievementById('nonexistent_achievement')).toBeUndefined()
  })

  it('returns undefined for empty string', () => {
    expect(getAchievementById('')).toBeUndefined()
  })
})

describe('ACHIEVEMENTS registry', () => {
  it('has no duplicate ids', () => {
    const ids = ACHIEVEMENTS.map((a) => a.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every achievement has required fields', () => {
    for (const achievement of ACHIEVEMENTS) {
      expect(achievement.id).toBeTruthy()
      expect(achievement.category).toBeTruthy()
      expect(achievement.name).toBeTruthy()
      expect(achievement.description).toBeTruthy()
      expect(achievement.rarity).toBeTruthy()
    }
  })

  it('includes global achievements', () => {
    const globalIds = ACHIEVEMENTS.filter((a) => a.category === 'global').map(
      (a) => a.id,
    )
    expect(globalIds).toContain('global_first_steps')
    expect(globalIds).toContain('global_all_games')
  })

  it('includes per-game achievements', () => {
    const categories = new Set(ACHIEVEMENTS.map((a) => a.category))
    expect(categories).toContain('magic-graph')
    expect(categories).toContain('sequence-race')
    expect(categories).toContain('shape-architect')
  })
})
