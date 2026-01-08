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
 */
export async function saveFirestoreProfile(profile: PlayerProfile): Promise<boolean> {
  const user = getCurrentUser();
  if (!user) return false;

  const db = getFirebaseDb();
  const firestoreModule = getCachedFirestoreModule();
  if (!db || !firestoreModule) return false;

  try {
    const docRef = firestoreModule.doc(db, USERS_COLLECTION, user.uid);
    const existingDoc = await firestoreModule.getDoc(docRef);

    const firestoreData = toFirestoreProfile(profile);

    if (existingDoc.exists()) {
      await firestoreModule.updateDoc(docRef, {
        ...firestoreData,
        updatedAt: firestoreModule.serverTimestamp(),
      });
    } else {
      await firestoreModule.setDoc(docRef, {
        ...firestoreData,
        createdAt: firestoreModule.serverTimestamp(),
        updatedAt: firestoreModule.serverTimestamp(),
      });
    }

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

  try {
    const docRef = firestoreModule.doc(db, USERS_COLLECTION, user.uid);

    // Convert updates to Firestore format
    const firestoreUpdates: Record<string, unknown> = {
      updatedAt: firestoreModule.serverTimestamp(),
    };

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

    await firestoreModule.updateDoc(docRef, firestoreUpdates);
    return true;
  } catch (error) {
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
 */
export async function unlockFirestoreAchievement(achievementId: string): Promise<boolean> {
  const profile = await getFirestoreProfile();
  if (!profile) return false;

  if (profile.achievements.includes(achievementId)) {
    return true; // Already unlocked
  }

  return updateFirestoreProfile({
    achievements: [...profile.achievements, achievementId],
  });
}
