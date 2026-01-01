/**
 * Shared Contexts - Barrel Export
 *
 * PlayerContext provides global player state and actions.
 * For performance optimization, prefer using the specialized hooks:
 * - usePlayerState() - for reading state (causes re-renders on state change)
 * - usePlayerAPI() - for actions only (stable, never causes re-renders)
 */

// Provider (from component file)
export { PlayerProvider } from './PlayerContext';

// Types (from component file)
export type {
  PlayerState,
  PlayerAPI,
  StatsUpdateResult,
  AchievementResult,
  StreakResult,
} from './PlayerContext';

// Hooks (from dedicated hooks file for Fast Refresh compatibility)
export {
  usePlayer,
  usePlayerState,
  usePlayerAPI,
  type PlayerContextValue,
} from './usePlayerHooks';

// Direct context exports (for testing or advanced use cases)
export { PlayerStateContext } from './PlayerStateContext';
export { PlayerAPIContext } from './PlayerAPIContext';
