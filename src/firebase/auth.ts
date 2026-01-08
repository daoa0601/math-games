/**
 * Firebase Auth Helper Functions
 *
 * Provides authentication utilities for:
 * - Anonymous authentication (auto-created for guests)
 * - Google Sign-In
 * - Email/Password authentication
 * - Account linking (anonymous → permanent)
 */

import {
  signInAnonymously,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  linkWithCredential,
  GoogleAuthProvider,
  EmailAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  type User,
  type Unsubscribe,
  type AuthCredential,
} from 'firebase/auth';
import { getFirebaseAuth } from './index';

// Google provider instance (reused)
const googleProvider = new GoogleAuthProvider();

export interface AuthResult {
  user: User | null;
  error: string | null;
  isNewUser: boolean;
}

/**
 * Sign in anonymously.
 * Creates a new anonymous account that can be upgraded later.
 */
export async function signInAnonymous(): Promise<AuthResult> {
  const auth = getFirebaseAuth();
  if (!auth) {
    return { user: null, error: 'Firebase not initialized', isNewUser: false };
  }

  try {
    const result = await signInAnonymously(auth);
    return {
      user: result.user,
      error: null,
      isNewUser: result.user.metadata.creationTime === result.user.metadata.lastSignInTime,
    };
  } catch (error) {
    return {
      user: null,
      error: getErrorMessage(error),
      isNewUser: false,
    };
  }
}

/**
 * Sign in with Google popup.
 */
export async function signInWithGoogle(): Promise<AuthResult> {
  const auth = getFirebaseAuth();
  if (!auth) {
    return { user: null, error: 'Firebase not initialized', isNewUser: false };
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    return {
      user: result.user,
      error: null,
      isNewUser: result.user.metadata.creationTime === result.user.metadata.lastSignInTime,
    };
  } catch (error) {
    return {
      user: null,
      error: getErrorMessage(error),
      isNewUser: false,
    };
  }
}

/**
 * Sign in with email and password.
 */
export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  const auth = getFirebaseAuth();
  if (!auth) {
    return { user: null, error: 'Firebase not initialized', isNewUser: false };
  }

  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return {
      user: result.user,
      error: null,
      isNewUser: false,
    };
  } catch (error) {
    return {
      user: null,
      error: getErrorMessage(error),
      isNewUser: false,
    };
  }
}

/**
 * Create a new account with email and password.
 */
export async function createAccountWithEmail(email: string, password: string): Promise<AuthResult> {
  const auth = getFirebaseAuth();
  if (!auth) {
    return { user: null, error: 'Firebase not initialized', isNewUser: false };
  }

  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return {
      user: result.user,
      error: null,
      isNewUser: true,
    };
  } catch (error) {
    return {
      user: null,
      error: getErrorMessage(error),
      isNewUser: false,
    };
  }
}

/**
 * Link anonymous account to Google.
 * Preserves existing data when upgrading from anonymous to permanent account.
 */
export async function linkAnonymousToGoogle(): Promise<AuthResult> {
  const auth = getFirebaseAuth();
  if (!auth || !auth.currentUser) {
    return { user: null, error: 'No user signed in', isNewUser: false };
  }

  if (!auth.currentUser.isAnonymous) {
    return { user: null, error: 'User is not anonymous', isNewUser: false };
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential) {
      await linkWithCredential(auth.currentUser, credential);
    }
    return {
      user: auth.currentUser,
      error: null,
      isNewUser: false,
    };
  } catch (error) {
    return {
      user: null,
      error: getErrorMessage(error),
      isNewUser: false,
    };
  }
}

/**
 * Link anonymous account to email/password.
 */
export async function linkAnonymousToEmail(email: string, password: string): Promise<AuthResult> {
  const auth = getFirebaseAuth();
  if (!auth || !auth.currentUser) {
    return { user: null, error: 'No user signed in', isNewUser: false };
  }

  if (!auth.currentUser.isAnonymous) {
    return { user: null, error: 'User is not anonymous', isNewUser: false };
  }

  try {
    const credential: AuthCredential = EmailAuthProvider.credential(email, password);
    await linkWithCredential(auth.currentUser, credential);
    return {
      user: auth.currentUser,
      error: null,
      isNewUser: false,
    };
  } catch (error) {
    return {
      user: null,
      error: getErrorMessage(error),
      isNewUser: false,
    };
  }
}

/**
 * Sign out the current user.
 */
export async function signOut(): Promise<{ error: string | null }> {
  const auth = getFirebaseAuth();
  if (!auth) {
    return { error: 'Firebase not initialized' };
  }

  try {
    await firebaseSignOut(auth);
    return { error: null };
  } catch (error) {
    return { error: getErrorMessage(error) };
  }
}

/**
 * Get the current user.
 */
export function getCurrentUser(): User | null {
  const auth = getFirebaseAuth();
  return auth?.currentUser ?? null;
}

/**
 * Subscribe to auth state changes.
 */
export function onAuthStateChanged(callback: (user: User | null) => void): Unsubscribe | null {
  const auth = getFirebaseAuth();
  if (!auth) {
    return null;
  }

  return firebaseOnAuthStateChanged(auth, callback);
}

/**
 * Check if current user is anonymous.
 */
export function isAnonymousUser(): boolean {
  const auth = getFirebaseAuth();
  return auth?.currentUser?.isAnonymous ?? false;
}

/**
 * Convert Firebase auth errors to user-friendly messages.
 */
function getErrorMessage(error: unknown): string {
  const code = (error as { code?: string }).code;

  switch (code) {
    case 'auth/invalid-email':
      return 'Invalid email address';
    case 'auth/user-disabled':
      return 'This account has been disabled';
    case 'auth/user-not-found':
      return 'No account found with this email';
    case 'auth/wrong-password':
      return 'Incorrect password';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters';
    case 'auth/popup-closed-by-user':
      return 'Sign-in was cancelled';
    case 'auth/network-request-failed':
      return 'Network error - please check your connection';
    case 'auth/too-many-requests':
      return 'Too many attempts - please try again later';
    case 'auth/credential-already-in-use':
      return 'This account is already linked to another user';
    default:
      return (error as Error).message || 'An error occurred during authentication';
  }
}
