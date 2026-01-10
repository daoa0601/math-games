/**
 * Sync Manager
 *
 * Coordinates data synchronization between localStorage and Firestore.
 * Handles online/offline state, retry logic, and rate limiting.
 */

import type { PlayerProfile, PlayerStats } from '@/shared/schemas/playerProfile.schema';
import { savePlayerProfile as saveLocalProfile, getPlayerProfile as getLocalProfile } from '@/shared/services/player';
import { updateFirestoreProfile, subscribeToProfile } from '../services/playerService';
import { migrateLocalToFirestore } from '../services/migrationService';
import { getCurrentUser } from '../auth';
import { isFirebaseInitialized } from '../index';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

export interface SyncState {
  status: SyncStatus;
  lastSyncedAt: Date | null;
  pendingChanges: boolean;
  error: string | null;
}

type SyncListener = (state: SyncState) => void;

// Singleton sync manager state
let syncState: SyncState = {
  status: 'idle',
  lastSyncedAt: null,
  pendingChanges: false,
  error: null,
};

const listeners: Set<SyncListener> = new Set();
let profileUnsubscribe: (() => void) | null = null;
let syncDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

// Rate limiting
const SYNC_DEBOUNCE_MS = 2000; // 2 second debounce
const MIN_SYNC_INTERVAL_MS = 5000; // Minimum 5 seconds between syncs
let lastSyncTime = 0;

// Concurrent sync protection
let ongoingSyncPromise: Promise<boolean> | null = null;

/**
 * Notify all listeners of state change.
 */
function notifyListeners() {
  listeners.forEach(listener => listener({ ...syncState }));
}

/**
 * Update sync state and notify listeners.
 */
function updateState(updates: Partial<SyncState>) {
  syncState = { ...syncState, ...updates };
  notifyListeners();
}

/**
 * Subscribe to sync state changes.
 */
export function subscribeSyncState(listener: SyncListener): () => void {
  listeners.add(listener);
  // Immediately notify with current state
  listener({ ...syncState });

  return () => {
    listeners.delete(listener);
  };
}

/**
 * Get current sync state.
 */
export function getSyncState(): SyncState {
  return { ...syncState };
}

/**
 * Initialize sync manager.
 * Should be called after Firebase auth is ready.
 */
export async function initSyncManager(): Promise<void> {
  // Set up online/offline listeners
  if (typeof window !== 'undefined') {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    isOnline = navigator.onLine;
  }

  if (!isOnline) {
    updateState({ status: 'offline' });
    return;
  }

  if (!isFirebaseInitialized() || !getCurrentUser()) {
    updateState({ status: 'idle' });
    return;
  }

  // Run initial migration
  const migrationResult = await migrateLocalToFirestore();
  if (!migrationResult.success && migrationResult.error) {
    console.warn('[SyncManager] Migration failed:', migrationResult.error);
  }

  // Subscribe to Firestore profile changes
  profileUnsubscribe = subscribeToProfile(handleRemoteProfileChange);

  updateState({ status: 'synced', lastSyncedAt: new Date() });
}

/**
 * Clean up sync manager.
 */
export function destroySyncManager(): void {
  if (typeof window !== 'undefined') {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  }

  if (profileUnsubscribe) {
    profileUnsubscribe();
    profileUnsubscribe = null;
  }

  if (syncDebounceTimer) {
    clearTimeout(syncDebounceTimer);
    syncDebounceTimer = null;
  }

  listeners.clear();
  syncState = {
    status: 'idle',
    lastSyncedAt: null,
    pendingChanges: false,
    error: null,
  };
}

/**
 * Handle coming online.
 */
function handleOnline() {
  isOnline = true;
  updateState({ status: 'idle', error: null });

  // Sync pending changes
  if (syncState.pendingChanges) {
    syncToFirestore(getLocalProfile());
  }
}

/**
 * Handle going offline.
 */
function handleOffline() {
  isOnline = false;
  updateState({ status: 'offline' });
}

/**
 * Handle remote profile changes from Firestore.
 */
function handleRemoteProfileChange(remoteProfile: PlayerProfile | null) {
  if (!remoteProfile) return;

  const localProfile = getLocalProfile();

  // Only update local if remote has newer data
  // This is a simple last-write-wins for most fields
  // Stats use max-value merge
  const shouldUpdate =
    remoteProfile.stats.totalGamesPlayed > localProfile.stats.totalGamesPlayed ||
    remoteProfile.stats.totalPuzzlesSolved > localProfile.stats.totalPuzzlesSolved ||
    remoteProfile.achievements.length > localProfile.achievements.length;

  if (shouldUpdate) {
    // Helper to get latest date (handles null)
    const getLatestDate = (a: string | null, b: string | null): string | null => {
      if (!a) return b;
      if (!b) return a;
      return new Date(a) > new Date(b) ? a : b;
    };

    // Helper to get best time (minimum, non-null)
    const getBestTime = (a: number | null, b: number | null): number | null => {
      if (a === null) return b;
      if (b === null) return a;
      return Math.min(a, b);
    };

    // Merge: take max stats, union achievements, merge all fields
    const merged: PlayerProfile = {
      ...localProfile,
      // Take remote displayName if local is still default
      displayName: localProfile.displayName === 'Player' && remoteProfile.displayName !== 'Player'
        ? remoteProfile.displayName
        : localProfile.displayName,
      // Merge preferences (remote values override local for explicit settings)
      preferences: {
        ...localProfile.preferences,
        ...remoteProfile.preferences,
      },
      // Take the most recent play date
      lastPlayedDate: getLatestDate(localProfile.lastPlayedDate, remoteProfile.lastPlayedDate),
      // Stats: take max values (prevents data loss), merge best times (min is better)
      stats: {
        ...localProfile.stats,
        totalGamesPlayed: Math.max(localProfile.stats.totalGamesPlayed, remoteProfile.stats.totalGamesPlayed),
        totalPuzzlesSolved: Math.max(localProfile.stats.totalPuzzlesSolved, remoteProfile.stats.totalPuzzlesSolved),
        totalWins: Math.max(localProfile.stats.totalWins, remoteProfile.stats.totalWins),
        magicGraphSolved: Math.max(localProfile.stats.magicGraphSolved, remoteProfile.stats.magicGraphSolved),
        sequenceRaceWins: Math.max(localProfile.stats.sequenceRaceWins, remoteProfile.stats.sequenceRaceWins),
        shapeArchitectBuilt: Math.max(localProfile.stats.shapeArchitectBuilt, remoteProfile.stats.shapeArchitectBuilt),
        // Best times: take minimum (faster is better)
        bestTimes: {
          magicGraphFastest: getBestTime(
            localProfile.stats.bestTimes.magicGraphFastest,
            remoteProfile.stats.bestTimes.magicGraphFastest
          ),
          sequenceRaceFastest: getBestTime(
            localProfile.stats.bestTimes.sequenceRaceFastest,
            remoteProfile.stats.bestTimes.sequenceRaceFastest
          ),
          shapeArchitectFastest: getBestTime(
            localProfile.stats.bestTimes.shapeArchitectFastest,
            remoteProfile.stats.bestTimes.shapeArchitectFastest
          ),
        },
      },
      // Achievements: union (never lose an achievement)
      achievements: [...new Set([...localProfile.achievements, ...remoteProfile.achievements])],
      // Streak: take max
      streak: Math.max(localProfile.streak, remoteProfile.streak),
    };

    saveLocalProfile(merged);
  }
}

/**
 * Sync local profile changes to Firestore.
 * Debounced to prevent excessive writes.
 */
export function syncToFirestore(profile: PlayerProfile): void {
  if (!isOnline) {
    updateState({ pendingChanges: true });
    return;
  }

  if (!isFirebaseInitialized() || !getCurrentUser()) {
    return;
  }

  // Clear existing debounce timer
  if (syncDebounceTimer) {
    clearTimeout(syncDebounceTimer);
  }

  // Debounce the sync
  syncDebounceTimer = setTimeout(async () => {
    // Rate limiting check
    const now = Date.now();
    if (now - lastSyncTime < MIN_SYNC_INTERVAL_MS) {
      // Schedule for later
      syncDebounceTimer = setTimeout(() => syncToFirestore(profile), MIN_SYNC_INTERVAL_MS - (now - lastSyncTime));
      return;
    }

    // Wait for any ongoing sync to complete first
    if (ongoingSyncPromise) {
      await ongoingSyncPromise;
    }

    updateState({ status: 'syncing' });

    // Track this sync operation
    ongoingSyncPromise = (async (): Promise<boolean> => {
      try {
        const success = await updateFirestoreProfile(profile);

        if (success) {
          lastSyncTime = Date.now();
          updateState({
            status: 'synced',
            lastSyncedAt: new Date(),
            pendingChanges: false,
            error: null,
          });
          return true;
        } else {
          updateState({
            status: 'error',
            error: 'Failed to sync',
            pendingChanges: true,
          });
          return false;
        }
      } catch (error) {
        updateState({
          status: 'error',
          error: (error as Error).message,
          pendingChanges: true,
        });
        return false;
      } finally {
        ongoingSyncPromise = null;
      }
    })();

    await ongoingSyncPromise;
  }, SYNC_DEBOUNCE_MS);
}

/**
 * Sync specific stats update to Firestore.
 */
export function syncStats(stats: PlayerStats): void {
  const profile = getLocalProfile();
  syncToFirestore({ ...profile, stats });
}

/**
 * Sync achievement unlock to Firestore.
 */
export function syncAchievement(achievementId: string): void {
  const profile = getLocalProfile();
  if (!profile.achievements.includes(achievementId)) {
    syncToFirestore({
      ...profile,
      achievements: [...profile.achievements, achievementId],
    });
  }
}

/**
 * Force immediate sync (bypasses debounce).
 */
export async function forceSync(): Promise<boolean> {
  if (!isOnline || !isFirebaseInitialized() || !getCurrentUser()) {
    return false;
  }

  // Clear debounce timer
  if (syncDebounceTimer) {
    clearTimeout(syncDebounceTimer);
    syncDebounceTimer = null;
  }

  updateState({ status: 'syncing' });

  try {
    const profile = getLocalProfile();
    const success = await updateFirestoreProfile(profile);

    if (success) {
      lastSyncTime = Date.now();
      updateState({
        status: 'synced',
        lastSyncedAt: new Date(),
        pendingChanges: false,
        error: null,
      });
      return true;
    }

    updateState({
      status: 'error',
      error: 'Failed to sync',
    });
    return false;
  } catch (error) {
    updateState({
      status: 'error',
      error: (error as Error).message,
    });
    return false;
  }
}
