/**
 * Firebase Player Service
 *
 * Handles player profile CRUD operations with Firestore.
 * Mirrors the localStorage player service but syncs to cloud.
 *
 * Uses dynamic imports via the loader module to defer Firebase SDK loading.
 */

import type { Unsubscribe } from 'firebase/firestore';
import { getFirebaseDb } from '../index';
import { getCurrentUser } from '../auth';
import { getCachedFirestoreModule } from '../loader';
import type { PlayerProfile, PlayerStats, PlayerPreferences } from '@/shared/schemas/playerProfile.schema';
import { calculateRank } from '@/shared/services/rank';
import { createDefaultProfile, createDefaultStats } from '@/shared/services/player';

const USERS_COLLECTION = 'users';

/**
 * Convert app PlayerProfile to Firestore format.
 */
function toFirestoreProfile(profile: PlayerProfile) {
  return {
    displayName: profile.displayName,
    stats: profile.stats,
    rank: profile.rank,
    streak: profile.streak,
    lastPlayedDate: profile.lastPlayedDate,
    achievements: profile.achievements,
    preferences: profile.preferences,
    version: profile.version,
  };
}

/**
 * Convert Firestore data to app PlayerProfile.
 */
function fromFirestoreProfile(data: Record<string, unknown>, id: string, createdAt: string): PlayerProfile {
  const defaultProfile = createDefaultProfile();

  return {
    id,
    displayName: (data.displayName as string) || '',
    stats: {
      ...createDefaultStats(),
      ...(data.stats as Partial<PlayerStats>),
    },
    rank: (data.rank as PlayerProfile['rank']) || defaultProfile.rank,
    streak: (data.streak as number) || 0,
    lastPlayedDate: (data.lastPlayedDate as string | null) || null,
    achievements: (data.achievements as string[]) || [],
    preferences: {
      ...defaultProfile.preferences,
      ...(data.preferences as Partial<PlayerPreferences>),
    },
    createdAt,
    version: (data.version as number) || defaultProfile.version,
  };
}

/**
 * Get player profile from Firestore.
 */
export async function getFirestoreProfile(): Promise<PlayerProfile | null> {
  const user = getCurrentUser();
  if (!user) return null;

  const db = getFirebaseDb();
  const firestoreModule = getCachedFirestoreModule();
  if (!db || !firestoreModule) return null;

  try {
    const docRef = firestoreModule.doc(db, USERS_COLLECTION, user.uid);
    const snapshot = await firestoreModule.getDoc(docRef);

    if (!snapshot.exists()) {
      return null;
    }

    const data = snapshot.data();
    const createdAt = data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString();
    return fromFirestoreProfile(data, user.uid, createdAt);
  } catch (error) {
    console.error('[Firebase] Failed to get profile:', error);
    return null;
  }
}

/**
 * Save player profile to Firestore.
 * Uses setDoc with merge to avoid extra read operation.
 */
export async function saveFirestoreProfile(profile: PlayerProfile): Promise<boolean> {
  const user = getCurrentUser();
  if (!user) return false;

  const db = getFirebaseDb();
  const firestoreModule = getCachedFirestoreModule();
  if (!db || !firestoreModule) return false;

  try {
    const docRef = firestoreModule.doc(db, USERS_COLLECTION, user.uid);
    const firestoreData = toFirestoreProfile(profile);

    // Use setDoc with merge to avoid extra network round-trip
    // This handles both insert and update cases without reading first
    await firestoreModule.setDoc(docRef, {
      ...firestoreData,
      updatedAt: firestoreModule.serverTimestamp(),
    }, { merge: true });

    return true;
  } catch (error) {
    console.error('[Firebase] Failed to save profile:', error);
    return false;
  }
}

/**
 * Update specific fields in Firestore profile.
 */
export async function updateFirestoreProfile(updates: Partial<PlayerProfile>): Promise<boolean> {
  const user = getCurrentUser();
  if (!user) return false;

  const db = getFirebaseDb();
  const firestoreModule = getCachedFirestoreModule();
  if (!db || !firestoreModule) return false;

  // Declare variables before try block so they're accessible in catch
  const docRef = firestoreModule.doc(db, USERS_COLLECTION, user.uid);
  const firestoreUpdates: Record<string, unknown> = {
    updatedAt: firestoreModule.serverTimestamp(),
  };

  // Build firestoreUpdates object
  if (updates.displayName !== undefined) {
    firestoreUpdates.displayName = updates.displayName;
  }
  if (updates.stats !== undefined) {
    firestoreUpdates.stats = updates.stats;
    // Recalculate rank
    firestoreUpdates.rank = calculateRank(updates.stats);
  }
  if (updates.streak !== undefined) {
    firestoreUpdates.streak = updates.streak;
  }
  if (updates.lastPlayedDate !== undefined) {
    firestoreUpdates.lastPlayedDate = updates.lastPlayedDate;
  }
  if (updates.achievements !== undefined) {
    firestoreUpdates.achievements = updates.achievements;
  }
  if (updates.preferences !== undefined) {
    firestoreUpdates.preferences = updates.preferences;
  }

  try {
    await firestoreModule.updateDoc(docRef, firestoreUpdates);
    return true;
  } catch (error) {
    // Check if this is a "document not found" error - can happen when:
    // 1. Migration failed silently
    // 2. Document was deleted from Firebase console
    // 3. Race condition: auth completed but migration hasn't finished
    if (error instanceof Error && error.message.includes('No document to update')) {
      console.warn('[Firebase] Document missing, creating with setDoc...');
      try {
        await firestoreModule.setDoc(docRef, firestoreUpdates, { merge: true });
        return true;
      } catch (setError) {
        console.error('[Firebase] Failed to create profile:', setError);
        return false;
      }
    }
    console.error('[Firebase] Failed to update profile:', error);
    return false;
  }
}

/**
 * Subscribe to profile changes in Firestore.
 */
export function subscribeToProfile(
  callback: (profile: PlayerProfile | null) => void
): Unsubscribe | null {
  const user = getCurrentUser();
  if (!user) return null;

  const db = getFirebaseDb();
  const firestoreModule = getCachedFirestoreModule();
  if (!db || !firestoreModule) return null;

  const docRef = firestoreModule.doc(db, USERS_COLLECTION, user.uid);

  return firestoreModule.onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const createdAt = data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString();
        callback(fromFirestoreProfile(data, user.uid, createdAt));
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error('[Firebase] Profile subscription error:', error);
      callback(null);
    }
  );
}

/**
 * Update player stats in Firestore.
 */
export async function updateFirestoreStats(stats: PlayerStats): Promise<boolean> {
  return updateFirestoreProfile({ stats });
}

/**
 * Unlock achievement in Firestore.
 * Uses atomic arrayUnion to prevent race conditions between devices.
 */
export async function unlockFirestoreAchievement(achievementId: string): Promise<boolean> {
  const user = getCurrentUser();
  if (!user) return false;

  const db = getFirebaseDb();
  const firestoreModule = getCachedFirestoreModule();
  if (!db || !firestoreModule) return false;

  // Declare docRef before try block so it's accessible in catch
  const docRef = firestoreModule.doc(db, USERS_COLLECTION, user.uid);

  try {
    // Use arrayUnion for atomic, idempotent achievement unlock
    // This prevents duplicates and race conditions
    await firestoreModule.updateDoc(docRef, {
      achievements: firestoreModule.arrayUnion(achievementId),
      updatedAt: firestoreModule.serverTimestamp(),
    });

    return true;
  } catch (error) {
    // Handle missing document - create it with the achievement
    if (error instanceof Error && error.message.includes('No document to update')) {
      console.warn('[Firebase] Document missing for achievement, creating...');
      try {
        // Can't use arrayUnion with setDoc on missing doc, set array directly
        // Since doc doesn't exist, there are no existing achievements to preserve
        await firestoreModule.setDoc(docRef, {
          achievements: [achievementId],
          updatedAt: firestoreModule.serverTimestamp(),
        }, { merge: true });
        return true;
      } catch (setError) {
        console.error('[Firebase] Failed to create profile with achievement:', setError);
        return false;
      }
    }
    console.error('[Firebase] Failed to unlock achievement:', error);
    return false;
  }
}
