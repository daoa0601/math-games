import { GAME_IDS } from '@/games/game-module'
import type { Achievement, AchievementContext } from '@/games/game-module'
import { gameModules, registry } from '@/games/registry'

export type {
  Achievement,
  AchievementCategory,
  AchievementContext,
  AchievementRarity,
  GameId,
} from '@/games/game-module'

const GLOBAL_ACHIEVEMENTS: readonly Achievement[] = [
  {
    id: 'global_first_steps',
    category: 'global',
    name: 'First Steps',
    description: 'Complete any game.',
    rarity: 'common',
  },
  {
    id: 'global_all_games',
    category: 'global',
    name: 'All Games',
    description: 'Play Magic Graph, Sequence Race, and Shape Architect.',
    rarity: 'rare',
  },
  {
    id: 'global_streak_30',
    category: 'global',
    name: 'Thirty Day Streak',
    description: 'Keep a 30 day learning streak.',
    rarity: 'epic',
  },
  {
    id: 'global_grandmaster',
    category: 'global',
    name: 'Grandmaster',
    description: 'Reach grandmaster rank.',
    rarity: 'legendary',
  },
]

export const ACHIEVEMENTS: readonly Achievement[] = [
  ...GLOBAL_ACHIEVEMENTS,
  ...gameModules.flatMap((module) => module.achievements),
]

export function getAchievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((achievement) => achievement.id === id)
}

function evaluateGlobalAchievements(
  ctx: AchievementContext,
  unlocked: ReadonlySet<string>,
): string[] {
  const newly: string[] = []

  if (ctx.completed && !unlocked.has('global_first_steps')) {
    newly.push('global_first_steps')
  }

  if (
    ctx.streak !== undefined &&
    ctx.streak >= 30 &&
    !unlocked.has('global_streak_30')
  ) {
    newly.push('global_streak_30')
  }

  if (ctx.gamesPlayedByType !== undefined) {
    const gamesPlayed = ctx.gamesPlayedByType
    const allPlayed = GAME_IDS.every((gameId) => gamesPlayed[gameId] > 0)

    if (allPlayed && !unlocked.has('global_all_games')) {
      newly.push('global_all_games')
    }
  }

  if (
    ctx.currentRank === 'grandmaster' &&
    !unlocked.has('global_grandmaster')
  ) {
    newly.push('global_grandmaster')
  }

  return newly
}

export function checkAchievements(
  context: AchievementContext,
  unlockedAchievements: readonly string[],
): string[] {
  const unlocked = new Set(unlockedAchievements)
  const fromGlobal = evaluateGlobalAchievements(context, unlocked)

  for (const id of fromGlobal) {
    unlocked.add(id)
  }

  const fromGame = registry[context.gameId].evaluateAchievements(
    context,
    unlocked,
  )

  return [...fromGlobal, ...fromGame]
}
