/**
 * Firebase App Initialization
 *
 * Initializes Firebase app and exports core services.
 * Firebase is optional - the app works without it using localStorage.
 */

import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth, connectAuthEmulator } from 'firebase/auth';
import {
  getFirestore,
  type Firestore,
  connectFirestoreEmulator,
  enableIndexedDbPersistence,
} from 'firebase/firestore';
import { getFirebaseConfig, isFirebaseEnabled } from './config';

// Singleton instances
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let initialized = false;

/**
 * Initialize Firebase app and services.
 * Safe to call multiple times - only initializes once.
 * Returns false if Firebase is not configured.
 */
export async function initializeFirebase(): Promise<boolean> {
  if (initialized) {
    return app !== null;
  }

  initialized = true;

  if (!isFirebaseEnabled()) {
    console.info('[Firebase] Not configured - using localStorage only');
    return false;
  }

  const config = getFirebaseConfig();
  if (!config) {
    return false;
  }

  try {
    // Initialize Firebase app
    app = initializeApp(config);
    auth = getAuth(app);
    db = getFirestore(app);

    // Connect to emulators in development
    if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      connectFirestoreEmulator(db, 'localhost', 8080);
      console.info('[Firebase] Connected to emulators');
    }

    // Enable offline persistence for Firestore
    try {
      await enableIndexedDbPersistence(db);
      console.info('[Firebase] Offline persistence enabled');
    } catch (err) {
      if ((err as { code?: string }).code === 'failed-precondition') {
        // Multiple tabs open - persistence can only be enabled in one tab
        console.warn('[Firebase] Persistence unavailable - multiple tabs open');
      } else if ((err as { code?: string }).code === 'unimplemented') {
        // Browser doesn't support required features
        console.warn('[Firebase] Persistence unavailable - browser not supported');
      }
    }

    console.info('[Firebase] Initialized successfully');
    return true;
  } catch (error) {
    console.error('[Firebase] Initialization failed:', error);
    app = null;
    auth = null;
    db = null;
    return false;
  }
}

/**
 * Get Firebase Auth instance.
 * Returns null if Firebase is not initialized.
 */
export function getFirebaseAuth(): Auth | null {
  return auth;
}

/**
 * Get Firestore instance.
 * Returns null if Firebase is not initialized.
 */
export function getFirebaseDb(): Firestore | null {
  return db;
}

/**
 * Get Firebase App instance.
 * Returns null if Firebase is not initialized.
 */
export function getFirebaseApp(): FirebaseApp | null {
  return app;
}

/**
 * Check if Firebase is currently available.
 */
export function isFirebaseInitialized(): boolean {
  return app !== null && auth !== null && db !== null;
}

// Re-export config utilities
export { isFirebaseEnabled, getFirebaseConfig } from './config';

// Re-export auth context (provider and types)
export {
  FirebaseAuthProvider,
  type FirebaseAuthState,
  type FirebaseAuthAPI,
} from './FirebaseAuthContext';

// Re-export auth hooks (from separate file for Fast Refresh)
export {
  useFirebaseAuth,
  useFirebaseAuthState,
  useFirebaseAuthAPI,
} from './useFirebaseAuthHooks';

// Re-export services
export * from './services';

// Re-export sync
export * from './sync';
