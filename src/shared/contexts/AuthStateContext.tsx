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
}

export const AuthStateContext = createContext<AuthState | null>(null);

export function useAuthState(): AuthState {
  const context = useContext(AuthStateContext);
  if (!context) {
    throw new Error('useAuthState must be used within an AuthProvider');
  }
  return context;
}
