/**
 * Firebase Initialization Service
 * Provides Firebase app, auth, and Firestore instances for the application.
 *
 * This module handles:
 * - Firebase app initialization with environment variables
 * - Lazy initialization to avoid blocking app startup
 * - Firestore offline persistence configuration
 * - Graceful fallback when Firebase is not configured
 */

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  connectAuthEmulator,
  type Auth,
} from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  connectFirestoreEmulator,
  type Firestore,
} from 'firebase/firestore';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Check if Firebase is enabled via feature flag
function isFirebaseEnabled(): boolean {
  const useFirebase = import.meta.env.VITE_USE_FIREBASE;
  // Default to true if not set, but allow explicit 'false' to disable
  return useFirebase !== 'false';
}

// Check if Firebase is properly configured and enabled
export function isFirebaseConfigured(): boolean {
  if (!isFirebaseEnabled()) {
    return false;
  }
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
  );
}

// Singleton instances
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

/**
 * Initialize Firebase app (singleton pattern)
 * Returns null if Firebase is not configured
 */
export function getFirebaseApp(): FirebaseApp | null {
  if (!isFirebaseConfigured()) {
    if (import.meta.env.DEV) {
      console.warn(
        '[Firebase] Not configured. Running in offline-only mode. ' +
        'Set VITE_FIREBASE_* environment variables to enable cloud sync.'
      );
    }
    return null;
  }

  if (!app) {
    // Check if already initialized (e.g., by another module)
    const existingApps = getApps();
    if (existingApps.length > 0) {
      app = existingApps[0];
    } else {
      app = initializeApp(firebaseConfig);
      if (import.meta.env.DEV) {
        console.log('[Firebase] App initialized:', firebaseConfig.projectId);
      }
    }
  }

  return app;
}

/**
 * Get Firebase Auth instance
 * Returns null if Firebase is not configured
 */
export function getFirebaseAuth(): Auth | null {
  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) return null;

  if (!auth) {
    auth = getAuth(firebaseApp);

    // Connect to emulator in development if configured
    if (import.meta.env.DEV && import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_HOST) {
      connectAuthEmulator(
        auth,
        `http://${import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_HOST}`
      );
      console.log('[Firebase] Connected to Auth emulator');
    }
  }

  return auth;
}

/**
 * Get Firestore instance with offline persistence enabled
 * Returns null if Firebase is not configured
 */
export function getFirestoreDb(): Firestore | null {
  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) return null;

  if (!db) {
    // Initialize Firestore with multi-tab offline persistence
    db = initializeFirestore(firebaseApp, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });

    // Connect to emulator in development if configured
    if (import.meta.env.DEV && import.meta.env.VITE_FIRESTORE_EMULATOR_HOST) {
      const [host, port] = import.meta.env.VITE_FIRESTORE_EMULATOR_HOST.split(':');
      connectFirestoreEmulator(db, host, parseInt(port, 10));
      console.log('[Firebase] Connected to Firestore emulator');
    }

    if (import.meta.env.DEV) {
      console.log('[Firebase] Firestore initialized with offline persistence');
    }
  }

  return db;
}

/**
 * Check if Firebase services are available and ready
 */
export function isFirebaseReady(): boolean {
  return app !== null && auth !== null && db !== null;
}

/**
 * Initialize all Firebase services
 * Call this early in app startup to trigger initialization
 */
export function initializeFirebaseServices(): {
  app: FirebaseApp | null;
  auth: Auth | null;
  db: Firestore | null;
} {
  return {
    app: getFirebaseApp(),
    auth: getFirebaseAuth(),
    db: getFirestoreDb(),
  };
}
