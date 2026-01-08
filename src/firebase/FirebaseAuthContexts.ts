/**
 * Firebase Auth Contexts
 *
 * Separated from FirebaseAuthContext.tsx for Fast Refresh compatibility.
 */

import { createContext } from 'react';
import type { User } from 'firebase/auth';

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface FirebaseAuthState {
  user: User | null;
  isAuthenticated: boolean;
  isAnonymous: boolean;
  isLoading: boolean;
  error: string | null;
  isFirebaseAvailable: boolean;
}

export interface FirebaseAuthAPI {
  signInAnonymously: () => Promise<boolean>;
  signInWithGoogle: () => Promise<boolean>;
  signInWithEmail: (email: string, password: string) => Promise<boolean>;
  createAccount: (email: string, password: string) => Promise<boolean>;
  linkToGoogle: () => Promise<boolean>;
  linkToEmail: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

// ═══════════════════════════════════════════════════════════════════
// CONTEXTS
// ═══════════════════════════════════════════════════════════════════

export const FirebaseAuthStateContext = createContext<FirebaseAuthState | null>(null);
export const FirebaseAuthAPIContext = createContext<FirebaseAuthAPI | null>(null);
