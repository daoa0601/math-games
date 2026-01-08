/**
 * Auth Context
 * Manages player authentication state (login/logout)
 */

import {
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import {
  getCurrentPlayerId,
  loginPlayer,
  logout as apiLogout,
  fetchPlayerProfile,
  checkApiAvailability,
  type LoginResult,
} from '../services/api';
import type { PlayerProfile } from '../services/player';
import { getPlayerProfile } from '../services/player';
import { AuthStateContext, type AuthState } from './AuthStateContext';
import { AuthAPIContext, type AuthAPI } from './AuthAPIContext';

// Re-export types and contexts for convenience
export type { AuthState } from './AuthStateContext';
export type { AuthAPI } from './AuthAPIContext';
export { AuthStateContext } from './AuthStateContext';
export { AuthAPIContext } from './AuthAPIContext';

interface AuthProviderProps {
  children: ReactNode;
  onLogin?: (profile: PlayerProfile, isNewPlayer: boolean) => void;
  onLogout?: () => void;
}

export function AuthProvider({ children, onLogin, onLogout }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>(() => {
    const playerId = getCurrentPlayerId();
    return {
      isLoggedIn: playerId !== null,
      playerId,
      isLoading: true, // Start with loading while we check API
      error: null,
      isOffline: false,
    };
  });

  // Check API availability and verify login on mount
  useEffect(() => {
    const initializeAuth = async () => {
      // First check if the API server is available
      const apiAvailable = await checkApiAvailability();

      if (!apiAvailable) {
        // API is unavailable - enable offline mode with localStorage data
        const localProfile = getPlayerProfile();
        setState({
          isLoggedIn: true,
          playerId: localProfile.id,
          isLoading: false,
          error: null,
          isOffline: true,
        });
        if (onLogin) {
          onLogin(localProfile, false);
        }
        return;
      }

      // API is available - verify login with server
      const playerId = getCurrentPlayerId();
      if (playerId) {
        const result = await fetchPlayerProfile();
        if (result.error) {
          // Player ID in localStorage but not on server - clear it
          apiLogout();
          setState({
            isLoggedIn: false,
            playerId: null,
            isLoading: false,
            error: null,
            isOffline: false,
          });
        } else {
          setState({
            isLoggedIn: true,
            playerId,
            isLoading: false,
            error: null,
            isOffline: false,
          });
          if (result.data && onLogin) {
            onLogin(result.data, false);
          }
        }
      } else {
        // No player ID - need to login
        setState({
          isLoggedIn: false,
          playerId: null,
          isLoading: false,
          error: null,
          isOffline: false,
        });
      }
    };
    initializeAuth();
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (playerId: string): Promise<LoginResult | null> => {
    setState(s => ({ ...s, isLoading: true, error: null }));

    const result = await loginPlayer(playerId);

    if (result.error) {
      setState(s => ({ ...s, isLoading: false, error: result.error }));
      return null;
    }

    if (result.data) {
      setState({
        isLoggedIn: true,
        playerId: playerId.trim().toLowerCase(),
        isLoading: false,
        error: null,
        isOffline: false,
      });

      if (onLogin) {
        onLogin(result.data.profile, result.data.isNewPlayer);
      }

      return result.data;
    }

    return null;
  }, [onLogin]);

  const logout = useCallback(() => {
    apiLogout();
    setState({
      isLoggedIn: false,
      playerId: null,
      isLoading: false,
      error: null,
      isOffline: false,
    });
    if (onLogout) {
      onLogout();
    }
  }, [onLogout]);

  const clearError = useCallback(() => {
    setState(s => ({ ...s, error: null }));
  }, []);

  const api: AuthAPI = { login, logout, clearError };

  return (
    <AuthStateContext.Provider value={state}>
      <AuthAPIContext.Provider value={api}>
        {children}
      </AuthAPIContext.Provider>
    </AuthStateContext.Provider>
  );
}

// Hooks are exported from ./useAuthHooks.ts for Fast Refresh compatibility
