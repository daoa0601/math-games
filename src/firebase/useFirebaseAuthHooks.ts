/**
 * Firebase Auth Hooks
 *
 * Separated from FirebaseAuthContext.tsx for Fast Refresh compatibility.
 */

import { useContext } from 'react';
import {
  FirebaseAuthStateContext,
  FirebaseAuthAPIContext,
  type FirebaseAuthState,
  type FirebaseAuthAPI,
} from './FirebaseAuthContexts';

export function useFirebaseAuthState(): FirebaseAuthState {
  const context = useContext(FirebaseAuthStateContext);
  if (!context) {
    throw new Error('useFirebaseAuthState must be used within a FirebaseAuthProvider');
  }
  return context;
}

export function useFirebaseAuthAPI(): FirebaseAuthAPI {
  const context = useContext(FirebaseAuthAPIContext);
  if (!context) {
    throw new Error('useFirebaseAuthAPI must be used within a FirebaseAuthProvider');
  }
  return context;
}

export function useFirebaseAuth() {
  return {
    ...useFirebaseAuthState(),
    ...useFirebaseAuthAPI(),
  };
}
