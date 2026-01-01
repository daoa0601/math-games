/**
 * Player Context Hooks
 *
 * Re-exports all player-related hooks for convenience.
 * Separated from PlayerContext.tsx for Fast Refresh compatibility.
 */

import { useMemo } from 'react';
import { usePlayerState, type PlayerState } from './PlayerStateContext';
import {
  usePlayerAPI,
  type PlayerAPI,
  type StatsUpdateResult,
  type AchievementResult,
  type StreakResult,
} from './PlayerAPIContext';

// Re-export individual hooks
export { usePlayerState, usePlayerAPI };
export type { PlayerState };
export type { PlayerAPI, StatsUpdateResult, AchievementResult, StreakResult };

// Combined type
export type PlayerContextValue = PlayerState & PlayerAPI;

/**
 * Access both player state and actions.
 *
 * Note: Prefer using usePlayerState() or usePlayerAPI() separately
 * to optimize re-renders. This hook is provided for backward
 * compatibility and convenience when you need both.
 *
 * @example
 * // Prefer this when you only need state:
 * const { profile, currentRank } = usePlayerState();
 *
 * // Prefer this when you only need actions:
 * const { updateStats } = usePlayerAPI();
 *
 * // Use this when you need both:
 * const { profile, updateStats } = usePlayer();
 */
export function usePlayer(): PlayerContextValue {
  const state = usePlayerState();
  const api = usePlayerAPI();

  return useMemo(() => ({ ...state, ...api }), [state, api]);
}
