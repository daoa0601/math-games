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
  loginPlayer,
  logout as apiLogout,
  type LoginResult,
} from '../services/api';
import type { PlayerProfile } from '../services/player';
import { getPlayerProfile, createDefaultProfile, savePlayerProfile } from '../services/player';
import { GUEST_MODE_KEY } from '../constants';
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
  // TEMPORARY: Login disabled - everyone is treated as guest
  const [state, setState] = useState<AuthState>(() => {
    return {
      isLoggedIn: true,
      isGuest: true,
      playerId: null,
      isLoading: true,
      error: null,
      isOffline: false,
    };
  });

  // Auto-login as guest on mount (login disabled)
  useEffect(() => {
    // Create a local guest profile if needed
    const existingProfile = getPlayerProfile();
    const guestProfile = existingProfile.id ? existingProfile : createDefaultProfile();
    if (!existingProfile.id) {
      savePlayerProfile(guestProfile);
    }

    // Mark as guest in localStorage
    localStorage.setItem(GUEST_MODE_KEY, 'true');

    setState({
      isLoggedIn: true,
      isGuest: true,
      playerId: null,
      isLoading: false,
      error: null,
      isOffline: false,
    });

    if (onLogin) {
      onLogin(guestProfile, !existingProfile.id);
    }
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
      // Clear guest mode when logging in with a real account
      localStorage.removeItem(GUEST_MODE_KEY);
      setState({
        isLoggedIn: true,
        isGuest: false,
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

  const loginAsGuest = useCallback(() => {
    // Create a local guest profile
    const guestProfile = createDefaultProfile();
    guestProfile.displayName = '';  // Will show "Guest" in UI
    savePlayerProfile(guestProfile);

    // Mark as guest in localStorage
    localStorage.setItem(GUEST_MODE_KEY, 'true');

    setState({
      isLoggedIn: true,
      isGuest: true,
      playerId: null,
      isLoading: false,
      error: null,
      isOffline: false,
    });

    if (onLogin) {
      onLogin(guestProfile, true);
    }
  }, [onLogin]);

  const logout = useCallback(() => {
    apiLogout();
    // Clear guest mode flag
    localStorage.removeItem(GUEST_MODE_KEY);
    setState({
      isLoggedIn: false,
      isGuest: false,
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

  const api: AuthAPI = { login, loginAsGuest, logout, clearError };

  return (
    <AuthStateContext.Provider value={state}>
      <AuthAPIContext.Provider value={api}>
        {children}
      </AuthAPIContext.Provider>
    </AuthStateContext.Provider>
  );
}

// Hooks are exported from ./useAuthHooks.ts for Fast Refresh compatibility
