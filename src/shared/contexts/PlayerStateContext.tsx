/**
 * PlayerStateContext
 *
 * Contains player state data that changes frequently.
 * Separated from PlayerAPIContext to prevent unnecessary re-renders
 * in components that only need to call actions.
 *
 * @see docs/adr/0003-context-splitting.md
 */

import { createContext, useContext } from 'react';
import type { PlayerProfile } from '../services/player';
import type { PlayerRank, RankThreshold } from '../services/rank';

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface RankProgress {
  gamesNeeded: number;
  solvesNeeded: number;
  progressPercent: number;
}

export interface PlayerState {
  // Core state
  profile: PlayerProfile;
  loading: boolean;

  // Rank info (derived from profile)
  currentRank: PlayerRank;
  currentRankInfo: RankThreshold;
  nextRank: RankThreshold | null;
  rankProgress: RankProgress | null;

  // Session info
  isFirstPlayOfDay: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════════════════════════════════

export const PlayerStateContext = createContext<PlayerState | null>(null);

// ═══════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════

/**
 * Access player state data (profile, rank, progress).
 * Use this hook when you need to display player information.
 *
 * Note: Components using this hook will re-render when state changes.
 * If you only need to call actions, use usePlayerAPI() instead.
 *
 * @example
 * function ProfileCard() {
 *   const { profile, currentRank } = usePlayerState();
 *   return <div>{profile.displayName} - {currentRank}</div>;
 * }
 */
export function usePlayerState(): PlayerState {
  const context = useContext(PlayerStateContext);
  if (!context) {
    throw new Error('usePlayerState must be used within a PlayerProvider');
  }
  return context;
}
