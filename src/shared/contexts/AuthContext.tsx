/**
 * Auth Context
 * Manages player authentication state (login/logout)
 * Integrates with Firebase when available for cloud sync
 */

import {
  useState,
  useCallback,
  useEffect,
  useMemo,
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
import {
  useFirebaseAuthState,
  useFirebaseAuthAPI,
} from '../../firebase/useFirebaseAuthHooks';

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
  // Get Firebase auth state and API
  const firebaseAuth = useFirebaseAuthState();
  const firebaseAPI = useFirebaseAuthAPI();

  const [state, setState] = useState<AuthState>(() => {
    return {
      isLoggedIn: false,
      isGuest: false,
      playerId: null,
      isLoading: true,
      error: null,
      isOffline: false,
      isFirebaseUser: false,
      isAnonymous: false,
    };
  });

  // Sync auth state with Firebase
  useEffect(() => {
    // Still loading Firebase
    if (firebaseAuth.isLoading) {
      return;
    }

    // Firebase is available and user is authenticated
    if (firebaseAuth.isFirebaseAvailable && firebaseAuth.isAuthenticated && firebaseAuth.user) {
      // Create or get local profile
      const existingProfile = getPlayerProfile();
      const profile = existingProfile.id ? existingProfile : createDefaultProfile();

      // Update profile ID to match Firebase UID for sync
      if (profile.id !== firebaseAuth.user.uid) {
        profile.id = firebaseAuth.user.uid;
        // Set display name from Firebase if available
        if (firebaseAuth.user.displayName && !profile.displayName) {
          profile.displayName = firebaseAuth.user.displayName;
        }
        savePlayerProfile(profile);
      }

      setState({
        isLoggedIn: true,
        isGuest: false,
        playerId: firebaseAuth.user.uid,
        isLoading: false,
        error: null,
        isOffline: false,
        isFirebaseUser: true,
        isAnonymous: firebaseAuth.isAnonymous,
      });

      if (onLogin) {
        onLogin(profile, !existingProfile.id);
      }
      return;
    }

    // Firebase available but no user - auto sign-in anonymously for seamless play
    if (firebaseAuth.isFirebaseAvailable && !firebaseAuth.isAuthenticated) {
      firebaseAPI.signInAnonymously().catch(console.error);
      return;
    }

    // Firebase not available - use guest mode with localStorage only
    if (!firebaseAuth.isFirebaseAvailable) {
      const existingProfile = getPlayerProfile();
      const guestProfile = existingProfile.id ? existingProfile : createDefaultProfile();
      if (!existingProfile.id) {
        savePlayerProfile(guestProfile);
      }

      localStorage.setItem(GUEST_MODE_KEY, 'true');

      setState({
        isLoggedIn: true,
        isGuest: true,
        playerId: null,
        isLoading: false,
        error: null,
        isOffline: false,
        isFirebaseUser: false,
        isAnonymous: false,
      });

      if (onLogin) {
        onLogin(guestProfile, !existingProfile.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseAuth.isLoading, firebaseAuth.isFirebaseAvailable, firebaseAuth.isAuthenticated, firebaseAuth.user?.uid]);

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
        isFirebaseUser: false,
        isAnonymous: false,
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
      isFirebaseUser: false,
      isAnonymous: false,
    });

    if (onLogin) {
      onLogin(guestProfile, true);
    }
  }, [onLogin]);

  const logout = useCallback(async () => {
    apiLogout();
    // Clear guest mode flag
    localStorage.removeItem(GUEST_MODE_KEY);

    // Sign out from Firebase if available
    if (firebaseAuth.isFirebaseAvailable && firebaseAuth.isAuthenticated) {
      await firebaseAPI.signOut();
    }

    setState({
      isLoggedIn: false,
      isGuest: false,
      playerId: null,
      isLoading: false,
      error: null,
      isOffline: false,
      isFirebaseUser: false,
      isAnonymous: false,
    });
    if (onLogout) {
      onLogout();
    }
  }, [onLogout, firebaseAuth.isFirebaseAvailable, firebaseAuth.isAuthenticated, firebaseAPI]);

  const clearError = useCallback(() => {
    setState(s => ({ ...s, error: null }));
  }, []);

  const api: AuthAPI = useMemo(() => ({
    login,
    loginAsGuest,
    logout,
    clearError,
  }), [login, loginAsGuest, logout, clearError]);

  return (
    <AuthStateContext.Provider value={state}>
      <AuthAPIContext.Provider value={api}>
        {children}
      </AuthAPIContext.Provider>
    </AuthStateContext.Provider>
  );
}

// Hooks are exported from ./useAuthHooks.ts for Fast Refresh compatibility
