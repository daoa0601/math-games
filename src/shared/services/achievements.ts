/**
 * Achievement System
 * Defines 10 core achievements across all games
 */

import type { StorageGameId, AchievementCategory as ImportedCategory } from '../types';

// Re-export for backwards compatibility
export type GameId = StorageGameId;
export type AchievementCategory = ImportedCategory;
export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Achievement {
  id: string;
  category: AchievementCategory;
  nameKey: string;         // i18n translation key
  descriptionKey: string;  // i18n translation key
  icon: string;            // Emoji icon
  rarity: AchievementRarity;
}

/**
 * Context passed to achievement condition checkers
 */
export interface AchievementContext {
  gameId: GameId;
  difficulty?: string;
  streak?: number;
  // Game-specific
  isOptimalSolution?: boolean;  // MagicGraph grandmaster
  wasWinner?: boolean;          // SequenceRace
  // Profile data
  currentRank?: string;
  gamesPlayedByType?: {
    magicGraph: number;
    sequenceRace: number;
    shapeArchitect: number;
  };
}

/**
 * Core achievements (10 total)
 *
 * Global (4): first_steps, all_games, streak_30, grandmaster
 * MagicGraph (2): first_solve, grandmaster
 * SequenceRace (2): first_victory, hard_winner
 * ShapeArchitect (2): first_build, master_architect
 */
export const ACHIEVEMENTS: Achievement[] = [
  // ═══════════════════════════════════════════════════════════════════
  // GLOBAL ACHIEVEMENTS (4)
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'global_first_steps',
    category: 'global',
    nameKey: 'achievements.global_first_steps.name',
    descriptionKey: 'achievements.global_first_steps.description',
    icon: '👶',
    rarity: 'common',
  },
  {
    id: 'global_all_games',
    category: 'global',
    nameKey: 'achievements.global_all_games.name',
    descriptionKey: 'achievements.global_all_games.description',
    icon: '🎮',
    rarity: 'rare',
  },
  {
    id: 'global_streak_30',
    category: 'global',
    nameKey: 'achievements.global_streak_30.name',
    descriptionKey: 'achievements.global_streak_30.description',
    icon: '🌋',
    rarity: 'epic',
  },
  {
    id: 'global_grandmaster',
    category: 'global',
    nameKey: 'achievements.global_grandmaster.name',
    descriptionKey: 'achievements.global_grandmaster.description',
    icon: '🌟',
    rarity: 'legendary',
  },

  // ═══════════════════════════════════════════════════════════════════
  // MAGIC GRAPH ACHIEVEMENTS (2)
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'mg_first_solve',
    category: 'magic-graph',
    nameKey: 'achievements.mg_first_solve.name',
    descriptionKey: 'achievements.mg_first_solve.description',
    icon: '🌟',
    rarity: 'common',
  },
  {
    id: 'mg_grandmaster',
    category: 'magic-graph',
    nameKey: 'achievements.mg_grandmaster.name',
    descriptionKey: 'achievements.mg_grandmaster.description',
    icon: '👑',
    rarity: 'epic',
  },

  // ═══════════════════════════════════════════════════════════════════
  // SEQUENCE RACE ACHIEVEMENTS (2)
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'sr_first_victory',
    category: 'sequence-race',
    nameKey: 'achievements.sr_first_victory.name',
    descriptionKey: 'achievements.sr_first_victory.description',
    icon: '🏆',
    rarity: 'common',
  },
  {
    id: 'sr_hard_winner',
    category: 'sequence-race',
    nameKey: 'achievements.sr_hard_winner.name',
    descriptionKey: 'achievements.sr_hard_winner.description',
    icon: '💪',
    rarity: 'epic',
  },

  // ═══════════════════════════════════════════════════════════════════
  // SHAPE ARCHITECT ACHIEVEMENTS (2)
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 'sa_first_build',
    category: 'shape-architect',
    nameKey: 'achievements.sa_first_build.name',
    descriptionKey: 'achievements.sa_first_build.description',
    icon: '🏗️',
    rarity: 'common',
  },
  {
    id: 'sa_master_architect',
    category: 'shape-architect',
    nameKey: 'achievements.sa_master_architect.name',
    descriptionKey: 'achievements.sa_master_architect.description',
    icon: '🏛️',
    rarity: 'epic',
  },
];

/**
 * Get achievement by ID
 */
export function getAchievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}

/**
 * Get achievements by category
 */
export function getAchievementsByCategory(category: AchievementCategory): Achievement[] {
  return ACHIEVEMENTS.filter((a) => a.category === category);
}

/**
 * Get achievements by rarity
 */
export function getAchievementsByRarity(rarity: AchievementRarity): Achievement[] {
  return ACHIEVEMENTS.filter((a) => a.rarity === rarity);
}

/**
 * Check which achievements are newly unlocked based on context
 * Returns array of achievement IDs that should be unlocked
 */
export function checkAchievements(
  context: AchievementContext,
  unlockedAchievements: string[]
): string[] {
  const newlyUnlocked: string[] = [];

  // Helper to check if achievement should be unlocked
  const shouldUnlock = (id: string, condition: boolean): void => {
    if (condition && !unlockedAchievements.includes(id)) {
      newlyUnlocked.push(id);
    }
  };

  const { gameId, difficulty, streak, gamesPlayedByType, currentRank } = context;

  // ═══════════════════════════════════════════════════════════════════
  // GLOBAL ACHIEVEMENTS
  // ═══════════════════════════════════════════════════════════════════

  // First steps - complete any game
  shouldUnlock('global_first_steps', true);

  // Streak 30 days
  if (streak !== undefined) {
    shouldUnlock('global_streak_30', streak >= 30);
  }

  // All games - played at least one of each
  if (gamesPlayedByType) {
    const playedAll =
      gamesPlayedByType.magicGraph > 0 &&
      gamesPlayedByType.sequenceRace > 0 &&
      gamesPlayedByType.shapeArchitect > 0;
    shouldUnlock('global_all_games', playedAll);
  }

  // Grandmaster rank
  shouldUnlock('global_grandmaster', currentRank === 'grandmaster');

  // ═══════════════════════════════════════════════════════════════════
  // MAGIC GRAPH ACHIEVEMENTS
  // ═══════════════════════════════════════════════════════════════════

  if (gameId === 'magic-graph') {
    // First solve
    shouldUnlock('mg_first_solve', true);

    // Grandmaster - optimal solution in grandmaster mode
    shouldUnlock('mg_grandmaster', difficulty === 'grandmaster' && context.isOptimalSolution === true);
  }

  // ═══════════════════════════════════════════════════════════════════
  // SEQUENCE RACE ACHIEVEMENTS
  // ═══════════════════════════════════════════════════════════════════

  if (gameId === 'sequence-race' && context.wasWinner) {
    // First victory
    shouldUnlock('sr_first_victory', true);

    // Hard winner
    shouldUnlock('sr_hard_winner', difficulty === 'hard');
  }

  // ═══════════════════════════════════════════════════════════════════
  // SHAPE ARCHITECT ACHIEVEMENTS
  // ═══════════════════════════════════════════════════════════════════

  if (gameId === 'shape-architect') {
    // First build
    shouldUnlock('sa_first_build', true);

    // Master architect - complete on master difficulty
    shouldUnlock('sa_master_architect', difficulty === 'master');
  }

  return newlyUnlocked;
}

/**
 * Get count of achievements by rarity
 */
export function getAchievementStats(unlockedAchievements: string[]): {
  total: number;
  unlocked: number;
  byRarity: Record<AchievementRarity, { total: number; unlocked: number }>;
} {
  const byRarity: Record<AchievementRarity, { total: number; unlocked: number }> = {
    common: { total: 0, unlocked: 0 },
    rare: { total: 0, unlocked: 0 },
    epic: { total: 0, unlocked: 0 },
    legendary: { total: 0, unlocked: 0 },
  };

  ACHIEVEMENTS.forEach((achievement) => {
    byRarity[achievement.rarity].total++;
    if (unlockedAchievements.includes(achievement.id)) {
      byRarity[achievement.rarity].unlocked++;
    }
  });

  return {
    total: ACHIEVEMENTS.length,
    unlocked: unlockedAchievements.length,
    byRarity,
  };
}

/**
 * Get rarity color for CSS styling (Linear Editorial palette)
 */
export function getRarityColor(rarity: AchievementRarity): string {
  switch (rarity) {
    case 'common':
      return 'var(--muted)';
    case 'rare':
      return 'var(--accent)';
    case 'epic':
      return '#a78bfa'; // Violet
    case 'legendary':
      return '#fbbf24'; // Amber/Gold
    default:
      return 'var(--text)';
  }
}
