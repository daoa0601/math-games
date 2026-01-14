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

// Auth context (for centralized player authentication)
export { AuthProvider } from './AuthContext';
export { AuthStateContext, useAuthState, type AuthState } from './AuthStateContext';
export { AuthAPIContext, useAuthAPI, type AuthAPI } from './AuthAPIContext';

// Combined auth hook for convenience
export { useAuth } from './useAuthCombined';

// Theme context (for theme switching and preference persistence)
export { ThemeProvider, useTheme } from './ThemeContext';
export type { Theme } from './ThemeContext';
