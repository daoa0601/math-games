/**
 * PlayerAPIContext
 *
 * Contains player action functions with stable references.
 * These functions are memoized with empty dependencies, meaning they
 * never change and never cause re-renders when consumed.
 *
 * Use usePlayerAPI() when you only need to call actions (e.g., recording stats).
 *
 * @see docs/adr/0003-context-splitting.md
 */

import { createContext, useContext } from 'react';
import type { PlayerPreferences, PlayerStats } from '../services/player';
import type { PlayerRank } from '../services/rank';
import type { Achievement, AchievementContext } from '../services/achievements';

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface StatsUpdateResult {
  rankedUp: boolean;
  previousRank: PlayerRank;
  newRank: PlayerRank;
}

export interface AchievementResult {
  newAchievements: Achievement[];
}

export interface StreakResult {
  streakMaintained: boolean;
  isNewStreak: boolean;
}

export interface PlayerAPI {
  // Profile management
  refreshProfile: () => void;
  updateDisplayName: (name: string) => void;
  updatePreferences: (preferences: Partial<PlayerPreferences>) => void;

  // Session tracking
  checkStreak: () => StreakResult;
  recordPlay: () => void;

  // Game completion
  updateStats: (updates: Partial<PlayerStats>) => StatsUpdateResult;
  checkAndUnlockAchievements: (context: AchievementContext) => AchievementResult;

  // Achievement helpers
  hasAchievement: (id: string) => boolean;
  getRecentAchievements: (count?: number) => Achievement[];
}

// ═══════════════════════════════════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════════════════════════════════

export const PlayerAPIContext = createContext<PlayerAPI | null>(null);

// ═══════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════

/**
 * Access player action functions (updateStats, checkAchievements, etc.).
 * Use this hook when you only need to call actions, not read state.
 *
 * Advantage: Components using only this hook will NOT re-render when
 * player state changes - the API reference is stable.
 *
 * @example
 * function GameEndHandler() {
 *   const { updateStats, checkAndUnlockAchievements } = usePlayerAPI();
 *
 *   const handleWin = () => {
 *     updateStats({ totalPuzzlesSolved: 1 });
 *     checkAndUnlockAchievements({ game: 'MagicGraph', solved: true });
 *   };
 * }
 */
export function usePlayerAPI(): PlayerAPI {
  const context = useContext(PlayerAPIContext);
  if (!context) {
    throw new Error('usePlayerAPI must be used within a PlayerProvider');
  }
  return context;
}
