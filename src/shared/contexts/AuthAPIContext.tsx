/**
 * AuthAPIContext
 *
 * Contains auth action functions (login, logout, clearError).
 * Separated from AuthStateContext for Fast Refresh compatibility.
 */

import { createContext, useContext } from 'react';
import type { LoginResult } from '../services/api';

export interface AuthAPI {
  login: (playerId: string) => Promise<LoginResult | null>;
  loginAsGuest: () => void;
  logout: () => void;
  clearError: () => void;
}

export const AuthAPIContext = createContext<AuthAPI | null>(null);

export function useAuthAPI(): AuthAPI {
  const context = useContext(AuthAPIContext);
  if (!context) {
    throw new Error('useAuthAPI must be used within an AuthProvider');
  }
  return context;
}
