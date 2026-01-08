/**
 * Firebase App Initialization
 *
 * Initializes Firebase app and exports core services.
 * Firebase is optional - the app works without it using localStorage.
 *
 * Uses dynamic imports to defer Firebase SDK loading until actually needed,
 * saving ~104KB (brotli) from the initial bundle.
 */

import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { getFirebaseConfig, isFirebaseEnabled } from './config';
import {
  loadAllFirebaseModules,
  setAppInstance,
  setAuthInstance,
  setDbInstance,
  getAppInstance,
  getAuthInstance,
  getDbInstance,
  clearInstances,
} from './loader';

// Initialization state
let initialized = false;
let initializationPromise: Promise<boolean> | null = null;

/**
 * Initialize Firebase app and services.
 * Safe to call multiple times - only initializes once.
 * Returns false if Firebase is not configured.
 *
 * Uses dynamic imports to load Firebase SDK only when needed.
 */
export async function initializeFirebase(): Promise<boolean> {
  // Return cached result if already initialized
  if (initialized) {
    return getAppInstance() !== null;
  }

  // Return existing promise if initialization is in progress
  if (initializationPromise) {
    return initializationPromise;
  }

  // Start initialization
  initializationPromise = doInitialize();
  return initializationPromise;
}

async function doInitialize(): Promise<boolean> {
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
    // Dynamically load Firebase modules (deferred until now)
    const { app: firebaseApp, auth: firebaseAuth, firestore: firebaseFirestore } =
      await loadAllFirebaseModules();

    // Initialize Firebase app
    const app = firebaseApp.initializeApp(config);
    const auth = firebaseAuth.getAuth(app);
    const db = firebaseFirestore.getFirestore(app);

    // Store instances for access by other modules
    setAppInstance(app);
    setAuthInstance(auth);
    setDbInstance(db);

    // Connect to emulators in development
    if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
      firebaseAuth.connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      firebaseFirestore.connectFirestoreEmulator(db, 'localhost', 8080);
      console.info('[Firebase] Connected to emulators');
    }

    // Enable offline persistence for Firestore
    try {
      await firebaseFirestore.enableIndexedDbPersistence(db);
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
    clearInstances();
    return false;
  }
}

/**
 * Get Firebase Auth instance.
 * Returns null if Firebase is not initialized.
 */
export function getFirebaseAuth(): Auth | null {
  return getAuthInstance();
}

/**
 * Get Firestore instance.
 * Returns null if Firebase is not initialized.
 */
export function getFirebaseDb(): Firestore | null {
  return getDbInstance();
}

/**
 * Get Firebase App instance.
 * Returns null if Firebase is not initialized.
 */
export function getFirebaseApp(): FirebaseApp | null {
  return getAppInstance();
}

/**
 * Check if Firebase is currently available.
 */
export function isFirebaseInitialized(): boolean {
  return getAppInstance() !== null && getAuthInstance() !== null && getDbInstance() !== null;
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
