/**
 * Firebase Dynamic Loader
 *
 * Dynamically imports Firebase SDK modules to reduce initial bundle size.
 * Firebase is only loaded when actually needed (when user attempts to sync).
 *
 * This saves ~104KB (brotli) from the initial bundle.
 */

import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

// Module cache - loaded once, reused forever
let firebaseAppModule: typeof import('firebase/app') | null = null;
let firebaseAuthModule: typeof import('firebase/auth') | null = null;
let firebaseFirestoreModule: typeof import('firebase/firestore') | null = null;

// Instance cache
let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

/**
 * Dynamically load the Firebase App module.
 */
export async function loadFirebaseApp(): Promise<typeof import('firebase/app')> {
  if (!firebaseAppModule) {
    firebaseAppModule = await import('firebase/app');
  }
  return firebaseAppModule;
}

/**
 * Dynamically load the Firebase Auth module.
 */
export async function loadFirebaseAuth(): Promise<typeof import('firebase/auth')> {
  if (!firebaseAuthModule) {
    firebaseAuthModule = await import('firebase/auth');
  }
  return firebaseAuthModule;
}

/**
 * Dynamically load the Firebase Firestore module.
 */
export async function loadFirebaseFirestore(): Promise<typeof import('firebase/firestore')> {
  if (!firebaseFirestoreModule) {
    firebaseFirestoreModule = await import('firebase/firestore');
  }
  return firebaseFirestoreModule;
}

/**
 * Load all Firebase modules in parallel.
 */
export async function loadAllFirebaseModules(): Promise<{
  app: typeof import('firebase/app');
  auth: typeof import('firebase/auth');
  firestore: typeof import('firebase/firestore');
}> {
  const [app, auth, firestore] = await Promise.all([
    loadFirebaseApp(),
    loadFirebaseAuth(),
    loadFirebaseFirestore(),
  ]);
  return { app, auth, firestore };
}

/**
 * Check if Firebase modules are loaded.
 */
export function isFirebaseLoaded(): boolean {
  return firebaseAppModule !== null;
}

/**
 * Get the cached Auth module (must be loaded first).
 */
export function getCachedAuthModule(): typeof import('firebase/auth') | null {
  return firebaseAuthModule;
}

/**
 * Get the cached Firestore module (must be loaded first).
 */
export function getCachedFirestoreModule(): typeof import('firebase/firestore') | null {
  return firebaseFirestoreModule;
}

// Instance management
export function setAppInstance(app: FirebaseApp): void {
  appInstance = app;
}

export function setAuthInstance(auth: Auth): void {
  authInstance = auth;
}

export function setDbInstance(db: Firestore): void {
  dbInstance = db;
}

export function getAppInstance(): FirebaseApp | null {
  return appInstance;
}

export function getAuthInstance(): Auth | null {
  return authInstance;
}

export function getDbInstance(): Firestore | null {
  return dbInstance;
}

export function clearInstances(): void {
  appInstance = null;
  authInstance = null;
  dbInstance = null;
}
