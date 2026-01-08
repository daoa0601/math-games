/**
 * AuthStateContext
 *
 * Contains auth state data (login status, loading, error).
 * Separated from AuthAPIContext for Fast Refresh compatibility.
 */

import { createContext, useContext } from 'react';

export interface AuthState {
  isLoggedIn: boolean;
  isGuest: boolean;
  playerId: string | null;
  isLoading: boolean;
  error: string | null;
  isOffline: boolean; // True when API server is unavailable (localStorage-only mode)
  // Firebase-specific state
  isFirebaseUser: boolean; // True when user is authenticated via Firebase
  isAnonymous: boolean; // True when Firebase user is anonymous (can be upgraded)
}

export const AuthStateContext = createContext<AuthState | null>(null);

export function useAuthState(): AuthState {
  const context = useContext(AuthStateContext);
  if (!context) {
    throw new Error('useAuthState must be used within an AuthProvider');
  }
  return context;
}
