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
  type LoginResult,
} from '../services/api';
import type { PlayerProfile } from '../services/player';
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
      isLoading: false,
      error: null,
    };
  });

  // Verify login on mount (check if server has the profile)
  useEffect(() => {
    const verifyLogin = async () => {
      if (state.playerId) {
        setState(s => ({ ...s, isLoading: true }));
        const result = await fetchPlayerProfile();
        if (result.error) {
          // Player ID in localStorage but not on server - clear it
          apiLogout();
          setState({
            isLoggedIn: false,
            playerId: null,
            isLoading: false,
            error: null,
          });
        } else {
          setState(s => ({ ...s, isLoading: false }));
          if (result.data && onLogin) {
            onLogin(result.data, false);
          }
        }
      }
    };
    verifyLogin();
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
