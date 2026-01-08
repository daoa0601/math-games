/**
 * Firestore Helper Functions
 *
 * Provides database utilities for:
 * - Player profile CRUD operations
 * - Daily challenge data
 * - Game progress tracking
 * - Real-time listeners
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  type DocumentReference,
  type Unsubscribe,
  type Timestamp,
} from 'firebase/firestore';
import { getFirebaseDb } from './index';
import { getCurrentUser } from './auth';

// Collection paths
const USERS_COLLECTION = 'users';

// Subcollection names
const PROFILE_DOC = 'profile';
const DAILY_CHALLENGES_COLLECTION = 'dailyChallenges';
const GAME_PROGRESS_COLLECTION = 'gameProgress';
const STREAKS_COLLECTION = 'streaks';

/**
 * Firestore player profile document structure.
 * Maps to the PlayerProfile type in the app.
 */
export interface FirestorePlayerProfile {
  displayName: string;
  stats: {
    totalGamesPlayed: number;
    totalPuzzlesSolved: number;
    totalWins: number;
  };
  rank: string;
  streak: number;
  lastPlayedDate: string | null;
  achievements: string[];
  preferences: {
    soundEnabled: boolean;
    musicEnabled: boolean;
    language: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  version: number;
}

export interface FirestoreDailyChallenge {
  completions: Array<{
    gameId: string;
    completedAt: Timestamp;
    score?: number;
    time?: number;
  }>;
  completedAt: Timestamp;
}

export interface FirestoreGameProgress {
  unlockedLevels: string[];
  completedLevels: Record<string, {
    bestTime?: number;
    bestScore?: number;
    completedAt: Timestamp;
  }>;
  totalScore: number;
  lastPlayed: Timestamp;
}

export interface FirestoreResult<T> {
  data: T | null;
  error: string | null;
}

/**
 * Get user profile document reference.
 */
function getProfileDocRef(userId: string): DocumentReference | null {
  const db = getFirebaseDb();
  if (!db) return null;
  return doc(db, USERS_COLLECTION, userId, PROFILE_DOC, 'data');
}

/**
 * Get or create user profile from Firestore.
 */
export async function getPlayerProfileFromFirestore(): Promise<FirestoreResult<FirestorePlayerProfile>> {
  const user = getCurrentUser();
  if (!user) {
    return { data: null, error: 'Not authenticated' };
  }

  const docRef = getProfileDocRef(user.uid);
  if (!docRef) {
    return { data: null, error: 'Firestore not initialized' };
  }

  try {
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return { data: snapshot.data() as FirestorePlayerProfile, error: null };
    }
    return { data: null, error: null }; // No profile yet
  } catch (error) {
    return { data: null, error: (error as Error).message };
  }
}

/**
 * Save player profile to Firestore.
 */
export async function savePlayerProfileToFirestore(
  profile: Omit<FirestorePlayerProfile, 'createdAt' | 'updatedAt'>
): Promise<FirestoreResult<void>> {
  const user = getCurrentUser();
  if (!user) {
    return { data: null, error: 'Not authenticated' };
  }

  const docRef = getProfileDocRef(user.uid);
  if (!docRef) {
    return { data: null, error: 'Firestore not initialized' };
  }

  try {
    const existingDoc = await getDoc(docRef);
    const now = serverTimestamp();

    if (existingDoc.exists()) {
      // Update existing profile
      await updateDoc(docRef, {
        ...profile,
        updatedAt: now,
      });
    } else {
      // Create new profile
      await setDoc(docRef, {
        ...profile,
        createdAt: now,
        updatedAt: now,
      });
    }

    return { data: undefined, error: null };
  } catch (error) {
    return { data: null, error: (error as Error).message };
  }
}

/**
 * Subscribe to player profile changes.
 */
export function subscribeToPlayerProfile(
  callback: (profile: FirestorePlayerProfile | null) => void
): Unsubscribe | null {
  const user = getCurrentUser();
  if (!user) return null;

  const docRef = getProfileDocRef(user.uid);
  if (!docRef) return null;

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as FirestorePlayerProfile);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error('[Firestore] Profile subscription error:', error);
      callback(null);
    }
  );
}

/**
 * Get daily challenge data for a specific date.
 */
export async function getDailyChallenge(
  date: string
): Promise<FirestoreResult<FirestoreDailyChallenge>> {
  const user = getCurrentUser();
  if (!user) {
    return { data: null, error: 'Not authenticated' };
  }

  const db = getFirebaseDb();
  if (!db) {
    return { data: null, error: 'Firestore not initialized' };
  }

  try {
    const docRef = doc(
      db,
      USERS_COLLECTION,
      user.uid,
      DAILY_CHALLENGES_COLLECTION,
      date
    );
    const snapshot = await getDoc(docRef);

    if (snapshot.exists()) {
      return { data: snapshot.data() as FirestoreDailyChallenge, error: null };
    }
    return { data: null, error: null };
  } catch (error) {
    return { data: null, error: (error as Error).message };
  }
}

/**
 * Save daily challenge completion.
 */
export async function saveDailyChallengeCompletion(
  date: string,
  gameId: string,
  score?: number,
  time?: number
): Promise<FirestoreResult<void>> {
  const user = getCurrentUser();
  if (!user) {
    return { data: null, error: 'Not authenticated' };
  }

  const db = getFirebaseDb();
  if (!db) {
    return { data: null, error: 'Firestore not initialized' };
  }

  try {
    const docRef = doc(
      db,
      USERS_COLLECTION,
      user.uid,
      DAILY_CHALLENGES_COLLECTION,
      date
    );

    const existingDoc = await getDoc(docRef);
    const now = serverTimestamp();

    const newCompletion = {
      gameId,
      completedAt: now,
      ...(score !== undefined && { score }),
      ...(time !== undefined && { time }),
    };

    if (existingDoc.exists()) {
      const data = existingDoc.data() as FirestoreDailyChallenge;
      await updateDoc(docRef, {
        completions: [...data.completions, newCompletion],
        completedAt: now,
      });
    } else {
      await setDoc(docRef, {
        completions: [newCompletion],
        completedAt: now,
      });
    }

    return { data: undefined, error: null };
  } catch (error) {
    return { data: null, error: (error as Error).message };
  }
}

/**
 * Get game progress for a specific game.
 */
export async function getGameProgress(
  gameId: string
): Promise<FirestoreResult<FirestoreGameProgress>> {
  const user = getCurrentUser();
  if (!user) {
    return { data: null, error: 'Not authenticated' };
  }

  const db = getFirebaseDb();
  if (!db) {
    return { data: null, error: 'Firestore not initialized' };
  }

  try {
    const docRef = doc(
      db,
      USERS_COLLECTION,
      user.uid,
      GAME_PROGRESS_COLLECTION,
      gameId
    );
    const snapshot = await getDoc(docRef);

    if (snapshot.exists()) {
      return { data: snapshot.data() as FirestoreGameProgress, error: null };
    }
    return { data: null, error: null };
  } catch (error) {
    return { data: null, error: (error as Error).message };
  }
}

/**
 * Update game progress.
 */
export async function updateGameProgress(
  gameId: string,
  updates: Partial<Omit<FirestoreGameProgress, 'lastPlayed'>>
): Promise<FirestoreResult<void>> {
  const user = getCurrentUser();
  if (!user) {
    return { data: null, error: 'Not authenticated' };
  }

  const db = getFirebaseDb();
  if (!db) {
    return { data: null, error: 'Firestore not initialized' };
  }

  try {
    const docRef = doc(
      db,
      USERS_COLLECTION,
      user.uid,
      GAME_PROGRESS_COLLECTION,
      gameId
    );

    const existingDoc = await getDoc(docRef);
    const now = serverTimestamp();

    if (existingDoc.exists()) {
      await updateDoc(docRef, {
        ...updates,
        lastPlayed: now,
      });
    } else {
      await setDoc(docRef, {
        unlockedLevels: [],
        completedLevels: {},
        totalScore: 0,
        ...updates,
        lastPlayed: now,
      });
    }

    return { data: undefined, error: null };
  } catch (error) {
    return { data: null, error: (error as Error).message };
  }
}

/**
 * Get streak data for a specific game.
 */
export async function getGameStreak(
  gameId: string
): Promise<FirestoreResult<{ currentStreak: number; longestStreak: number; lastCompletedDate: string | null }>> {
  const user = getCurrentUser();
  if (!user) {
    return { data: null, error: 'Not authenticated' };
  }

  const db = getFirebaseDb();
  if (!db) {
    return { data: null, error: 'Firestore not initialized' };
  }

  try {
    const docRef = doc(
      db,
      USERS_COLLECTION,
      user.uid,
      STREAKS_COLLECTION,
      gameId
    );
    const snapshot = await getDoc(docRef);

    if (snapshot.exists()) {
      return { data: snapshot.data() as { currentStreak: number; longestStreak: number; lastCompletedDate: string | null }, error: null };
    }
    return { data: { currentStreak: 0, longestStreak: 0, lastCompletedDate: null }, error: null };
  } catch (error) {
    return { data: null, error: (error as Error).message };
  }
}

/**
 * Update streak data for a specific game.
 */
export async function updateGameStreak(
  gameId: string,
  currentStreak: number,
  longestStreak: number,
  lastCompletedDate: string
): Promise<FirestoreResult<void>> {
  const user = getCurrentUser();
  if (!user) {
    return { data: null, error: 'Not authenticated' };
  }

  const db = getFirebaseDb();
  if (!db) {
    return { data: null, error: 'Firestore not initialized' };
  }

  try {
    const docRef = doc(
      db,
      USERS_COLLECTION,
      user.uid,
      STREAKS_COLLECTION,
      gameId
    );

    await setDoc(docRef, {
      currentStreak,
      longestStreak,
      lastCompletedDate,
    });

    return { data: undefined, error: null };
  } catch (error) {
    return { data: null, error: (error as Error).message };
  }
}
