/**
 * Firebase Configuration
 *
 * Configuration values are loaded from environment variables.
 * See .env.example for required variables.
 */

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

/**
 * Get Firebase configuration from environment variables.
 * Returns null if Firebase is not configured.
 */
export function getFirebaseConfig(): FirebaseConfig | null {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  const appId = import.meta.env.VITE_FIREBASE_APP_ID;

  // Firebase is optional - return null if not configured
  if (!apiKey || !projectId || !appId) {
    return null;
  }

  return {
    apiKey,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`,
    projectId,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId,
  };
}

/**
 * Check if Firebase is enabled via feature flag or configuration.
 */
export function isFirebaseEnabled(): boolean {
  // Feature flag takes precedence
  const featureFlag = import.meta.env.VITE_USE_FIREBASE;
  if (featureFlag === 'false') {
    return false;
  }

  // If no explicit flag, check if config exists
  return getFirebaseConfig() !== null;
}
