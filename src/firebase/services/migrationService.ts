/**
 * Migration Service
 *
 * Handles migration of data between localStorage and Firestore.
 * Implements merge strategies for different data types.
 */

import type { PlayerProfile, PlayerStats } from '@/shared/schemas/playerProfile.schema';
import { getPlayerProfile as getLocalProfile, savePlayerProfile as saveLocalProfile } from '@/shared/services/player';
import { getFirestoreProfile, saveFirestoreProfile } from './playerService';
import { getCurrentUser } from '../auth';

const MIGRATION_KEY = 'firebase_migration_completed';

export interface MigrationResult {
  success: boolean;
  action: 'uploaded' | 'merged' | 'downloaded' | 'skipped';
  error?: string;
}

/**
 * Check if migration has been completed.
 */
export function isMigrationCompleted(): boolean {
  return localStorage.getItem(MIGRATION_KEY) === 'true';
}

/**
 * Mark migration as completed.
 */
export function markMigrationCompleted(): void {
  localStorage.setItem(MIGRATION_KEY, 'true');
}

/**
 * Clear migration flag (for testing or re-migration).
 */
export function clearMigrationFlag(): void {
  localStorage.removeItem(MIGRATION_KEY);
}

/**
 * Merge two PlayerStats objects, taking the maximum values.
 */
export function mergeStats(local: PlayerStats, remote: PlayerStats): PlayerStats {
  return {
    totalGamesPlayed: Math.max(local.totalGamesPlayed, remote.totalGamesPlayed),
    totalPuzzlesSolved: Math.max(local.totalPuzzlesSolved, remote.totalPuzzlesSolved),
    totalWins: Math.max(local.totalWins, remote.totalWins),
    magicGraphSolved: Math.max(local.magicGraphSolved, remote.magicGraphSolved),
    sequenceRaceWins: Math.max(local.sequenceRaceWins, remote.sequenceRaceWins),
    shapeArchitectBuilt: Math.max(local.shapeArchitectBuilt, remote.shapeArchitectBuilt),
    bestTimes: {
      magicGraphFastest: mergeBestTime(local.bestTimes.magicGraphFastest, remote.bestTimes.magicGraphFastest),
      sequenceRaceFastest: mergeBestTime(local.bestTimes.sequenceRaceFastest, remote.bestTimes.sequenceRaceFastest),
      shapeArchitectFastest: mergeBestTime(local.bestTimes.shapeArchitectFastest, remote.bestTimes.shapeArchitectFastest),
    },
  };
}

/**
 * Merge best times - take the lower (better) time if both exist.
 */
function mergeBestTime(local: number | null, remote: number | null): number | null {
  if (local === null) return remote;
  if (remote === null) return local;
  return Math.min(local, remote);
}

/**
 * Merge achievements - union of both lists.
 */
export function mergeAchievements(local: string[], remote: string[]): string[] {
  const merged = new Set([...local, ...remote]);
  return Array.from(merged);
}

/**
 * Merge two player profiles.
 * - Stats: Take max values (prevents cheating)
 * - Achievements: Union (never lose achievements)
 * - Streak: Take max
 * - Preferences: Take local (user's current device)
 * - Display name: Prefer non-empty, then local
 */
export function mergeProfiles(local: PlayerProfile, remote: PlayerProfile): PlayerProfile {
  return {
    // Keep remote ID since it's the Firebase UID
    id: remote.id || local.id,
    // Prefer non-empty display name
    displayName: local.displayName || remote.displayName,
    // Merge stats taking max values
    stats: mergeStats(local.stats, remote.stats),
    // Rank will be recalculated from stats
    rank: local.rank, // Will be recalculated on save
    // Take the higher streak
    streak: Math.max(local.streak, remote.streak),
    // Take the most recent play date
    lastPlayedDate: getMostRecentDate(local.lastPlayedDate, remote.lastPlayedDate),
    // Union of achievements
    achievements: mergeAchievements(local.achievements, remote.achievements),
    // Keep local preferences (user's current device settings)
    preferences: local.preferences,
    // Keep earliest creation date
    createdAt: getEarliestDate(local.createdAt, remote.createdAt),
    // Use latest version
    version: Math.max(local.version, remote.version),
  };
}

/**
 * Get the most recent date string.
 */
function getMostRecentDate(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  return new Date(a) > new Date(b) ? a : b;
}

/**
 * Get the earliest date string.
 */
function getEarliestDate(a: string, b: string): string {
  return new Date(a) < new Date(b) ? a : b;
}

/**
 * Migrate localStorage data to Firestore.
 * Called on first authenticated session.
 */
export async function migrateLocalToFirestore(): Promise<MigrationResult> {
  const user = getCurrentUser();
  if (!user) {
    return { success: false, action: 'skipped', error: 'Not authenticated' };
  }

  // Check if already migrated
  if (isMigrationCompleted()) {
    return { success: true, action: 'skipped' };
  }

  try {
    const localProfile = getLocalProfile();
    const firestoreProfile = await getFirestoreProfile();

    if (!firestoreProfile) {
      // No Firestore data - upload local data
      const profileWithFirebaseId = {
        ...localProfile,
        id: user.uid,
      };
      const success = await saveFirestoreProfile(profileWithFirebaseId);

      if (success) {
        // Update local with Firebase UID
        saveLocalProfile(profileWithFirebaseId);
        markMigrationCompleted();
        return { success: true, action: 'uploaded' };
      }

      return { success: false, action: 'uploaded', error: 'Failed to upload profile' };
    }

    // Firestore data exists - merge
    const merged = mergeProfiles(localProfile, firestoreProfile);

    // Save merged profile to both
    const firestoreSuccess = await saveFirestoreProfile(merged);
    if (firestoreSuccess) {
      saveLocalProfile(merged);
      markMigrationCompleted();
      return { success: true, action: 'merged' };
    }

    return { success: false, action: 'merged', error: 'Failed to save merged profile' };
  } catch (error) {
    return {
      success: false,
      action: 'skipped',
      error: (error as Error).message,
    };
  }
}

/**
 * Download Firestore profile to localStorage (for new device).
 */
export async function downloadFirestoreToLocal(): Promise<MigrationResult> {
  try {
    const firestoreProfile = await getFirestoreProfile();

    if (!firestoreProfile) {
      return { success: false, action: 'downloaded', error: 'No Firestore profile found' };
    }

    saveLocalProfile(firestoreProfile);
    markMigrationCompleted();
    return { success: true, action: 'downloaded' };
  } catch (error) {
    return {
      success: false,
      action: 'downloaded',
      error: (error as Error).message,
    };
  }
}
