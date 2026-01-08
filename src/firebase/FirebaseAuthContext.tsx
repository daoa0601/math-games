/**
 * Firebase Auth Provider
 *
 * Provides Firebase authentication state and actions.
 * Integrates with the existing AuthStateContext/AuthAPIContext pattern.
 *
 * Types and contexts are in FirebaseAuthContexts.ts for Fast Refresh compatibility.
 * Hooks are in useFirebaseAuthHooks.ts for Fast Refresh compatibility.
 */

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import type { User } from 'firebase/auth';
import {
  initializeFirebase,
  isFirebaseEnabled,
  isFirebaseInitialized,
} from './index';
import {
  signInAnonymous,
  signInWithGoogle,
  signInWithEmail,
  createAccountWithEmail,
  linkAnonymousToGoogle,
  linkAnonymousToEmail,
  signOut,
  onAuthStateChanged,
  isAnonymousUser,
  getCurrentUser,
} from './auth';
import {
  FirebaseAuthStateContext,
  FirebaseAuthAPIContext,
  type FirebaseAuthState,
  type FirebaseAuthAPI,
} from './FirebaseAuthContexts';

// Re-export types for convenience
export type { FirebaseAuthState, FirebaseAuthAPI } from './FirebaseAuthContexts';

// ═══════════════════════════════════════════════════════════════════
// PROVIDER
// ═══════════════════════════════════════════════════════════════════

interface FirebaseAuthProviderProps {
  children: ReactNode;
  onUserChange?: (user: User | null) => void;
}

export function FirebaseAuthProvider({ children, onUserChange }: FirebaseAuthProviderProps) {
  const [state, setState] = useState<FirebaseAuthState>({
    user: null,
    isAuthenticated: false,
    isAnonymous: false,
    isLoading: true,
    error: null,
    isFirebaseAvailable: false,
  });

  // Initialize Firebase on mount
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    async function init() {
      // Check if Firebase is enabled
      if (!isFirebaseEnabled()) {
        setState(s => ({
          ...s,
          isLoading: false,
          isFirebaseAvailable: false,
        }));
        return;
      }

      // Initialize Firebase
      const initialized = await initializeFirebase();
      if (!initialized) {
        setState(s => ({
          ...s,
          isLoading: false,
          isFirebaseAvailable: false,
        }));
        return;
      }

      // Subscribe to auth state changes
      unsubscribe = onAuthStateChanged((user) => {
        setState({
          user,
          isAuthenticated: user !== null,
          isAnonymous: user?.isAnonymous ?? false,
          isLoading: false,
          error: null,
          isFirebaseAvailable: true,
        });
        onUserChange?.(user);
      });
    }

    init();

    return () => {
      unsubscribe?.();
    };
  }, [onUserChange]);

  // ─────────────────────────────────────────────────────────────────
  // API Functions
  // ─────────────────────────────────────────────────────────────────

  const handleSignInAnonymously = useCallback(async (): Promise<boolean> => {
    if (!isFirebaseInitialized()) {
      setState(s => ({ ...s, error: 'Firebase not available' }));
      return false;
    }

    setState(s => ({ ...s, isLoading: true, error: null }));
    const result = await signInAnonymous();

    if (result.error) {
      setState(s => ({ ...s, isLoading: false, error: result.error }));
      return false;
    }

    return true;
  }, []);

  const handleSignInWithGoogle = useCallback(async (): Promise<boolean> => {
    if (!isFirebaseInitialized()) {
      setState(s => ({ ...s, error: 'Firebase not available' }));
      return false;
    }

    setState(s => ({ ...s, isLoading: true, error: null }));
    const result = await signInWithGoogle();

    if (result.error) {
      setState(s => ({ ...s, isLoading: false, error: result.error }));
      return false;
    }

    return true;
  }, []);

  const handleSignInWithEmail = useCallback(async (email: string, password: string): Promise<boolean> => {
    if (!isFirebaseInitialized()) {
      setState(s => ({ ...s, error: 'Firebase not available' }));
      return false;
    }

    setState(s => ({ ...s, isLoading: true, error: null }));
    const result = await signInWithEmail(email, password);

    if (result.error) {
      setState(s => ({ ...s, isLoading: false, error: result.error }));
      return false;
    }

    return true;
  }, []);

  const handleCreateAccount = useCallback(async (email: string, password: string): Promise<boolean> => {
    if (!isFirebaseInitialized()) {
      setState(s => ({ ...s, error: 'Firebase not available' }));
      return false;
    }

    setState(s => ({ ...s, isLoading: true, error: null }));
    const result = await createAccountWithEmail(email, password);

    if (result.error) {
      setState(s => ({ ...s, isLoading: false, error: result.error }));
      return false;
    }

    return true;
  }, []);

  const handleLinkToGoogle = useCallback(async (): Promise<boolean> => {
    if (!isFirebaseInitialized()) {
      setState(s => ({ ...s, error: 'Firebase not available' }));
      return false;
    }

    if (!isAnonymousUser()) {
      setState(s => ({ ...s, error: 'Only anonymous users can link accounts' }));
      return false;
    }

    setState(s => ({ ...s, isLoading: true, error: null }));
    const result = await linkAnonymousToGoogle();

    if (result.error) {
      setState(s => ({ ...s, isLoading: false, error: result.error }));
      return false;
    }

    // Update state to reflect non-anonymous status
    const user = getCurrentUser();
    setState(s => ({
      ...s,
      user,
      isAnonymous: false,
      isLoading: false,
    }));

    return true;
  }, []);

  const handleLinkToEmail = useCallback(async (email: string, password: string): Promise<boolean> => {
    if (!isFirebaseInitialized()) {
      setState(s => ({ ...s, error: 'Firebase not available' }));
      return false;
    }

    if (!isAnonymousUser()) {
      setState(s => ({ ...s, error: 'Only anonymous users can link accounts' }));
      return false;
    }

    setState(s => ({ ...s, isLoading: true, error: null }));
    const result = await linkAnonymousToEmail(email, password);

    if (result.error) {
      setState(s => ({ ...s, isLoading: false, error: result.error }));
      return false;
    }

    // Update state to reflect non-anonymous status
    const user = getCurrentUser();
    setState(s => ({
      ...s,
      user,
      isAnonymous: false,
      isLoading: false,
    }));

    return true;
  }, []);

  const handleSignOut = useCallback(async (): Promise<void> => {
    if (!isFirebaseInitialized()) {
      return;
    }

    setState(s => ({ ...s, isLoading: true, error: null }));
    const result = await signOut();

    if (result.error) {
      setState(s => ({ ...s, isLoading: false, error: result.error }));
    }
    // Auth state change listener will update the state
  }, []);

  const clearError = useCallback(() => {
    setState(s => ({ ...s, error: null }));
  }, []);

  // ─────────────────────────────────────────────────────────────────
  // Context Values
  // ─────────────────────────────────────────────────────────────────

  const stateValue: FirebaseAuthState = useMemo(() => ({
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isAnonymous: state.isAnonymous,
    isLoading: state.isLoading,
    error: state.error,
    isFirebaseAvailable: state.isFirebaseAvailable,
  }), [state]);

  const apiValue: FirebaseAuthAPI = useMemo(() => ({
    signInAnonymously: handleSignInAnonymously,
    signInWithGoogle: handleSignInWithGoogle,
    signInWithEmail: handleSignInWithEmail,
    createAccount: handleCreateAccount,
    linkToGoogle: handleLinkToGoogle,
    linkToEmail: handleLinkToEmail,
    signOut: handleSignOut,
    clearError,
  }), [
    handleSignInAnonymously,
    handleSignInWithGoogle,
    handleSignInWithEmail,
    handleCreateAccount,
    handleLinkToGoogle,
    handleLinkToEmail,
    handleSignOut,
    clearError,
  ]);

  return (
    <FirebaseAuthStateContext.Provider value={stateValue}>
      <FirebaseAuthAPIContext.Provider value={apiValue}>
        {children}
      </FirebaseAuthAPIContext.Provider>
    </FirebaseAuthStateContext.Provider>
  );
}
