/**
 * Player Context
 *
 * Provides global player state and actions across the app.
 * Internally split into two contexts for performance:
 * - PlayerStateContext: State that changes frequently
 * - PlayerAPIContext: Stable action functions
 *
 * @see docs/adr/0003-context-splitting.md
 */

import { useState, useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react';
import {
  type PlayerProfile,
  type PlayerPreferences,
  type PlayerStats,
  getPlayerProfile,
  savePlayerProfile,
  updateDisplayName as updateDisplayNameService,
  updatePreferences as updatePreferencesService,
  updateStreak as updateStreakService,
  updateStats as updateStatsService,
  recordPlaySession,
  unlockAchievementsBatch,
  isFirstPlayToday,
} from '../services/player';
import {
  getRankInfo,
  getNextRank,
  getRankProgress,
} from '../services/rank';
import {
  type Achievement,
  type AchievementContext,
  checkAchievements,
  getAchievementById,
} from '../services/achievements';
import {
  updateStatsApi,
  updateDisplayNameApi,
  updatePreferencesApi,
  recordPlaySessionApi,
  unlockAchievementApi,
} from '../services/api';
import { syncToFirestore, syncAchievement as syncAchievementToFirebase } from '../../firebase/sync';

// Import split contexts (hooks are exported from usePlayerHooks.ts)
import { PlayerStateContext, type PlayerState } from './PlayerStateContext';
import {
  PlayerAPIContext,
  type PlayerAPI,
  type StatsUpdateResult,
  type AchievementResult,
  type StreakResult,
} from './PlayerAPIContext';

// Hooks are exported from ./usePlayerHooks.ts for Fast Refresh compatibility
// Re-export types for convenience
export type { PlayerState } from './PlayerStateContext';
export type { PlayerAPI, StatsUpdateResult, AchievementResult, StreakResult } from './PlayerAPIContext';
export type { PlayerContextValue } from './usePlayerHooks';

// ═══════════════════════════════════════════════════════════════════
// PROVIDER
// ═══════════════════════════════════════════════════════════════════

interface PlayerProviderProps {
  children: ReactNode;
  initialProfile?: PlayerProfile | null;
}

export function PlayerProvider({ children, initialProfile }: PlayerProviderProps) {
  // ─────────────────────────────────────────────────────────────────
  // State
  // ─────────────────────────────────────────────────────────────────

  const [profile, setProfile] = useState<PlayerProfile>(() => {
    // If we have a server profile, use that and cache it locally
    if (initialProfile) {
      savePlayerProfile(initialProfile);
      return initialProfile;
    }
    return getPlayerProfile();
  });
  const [loading, setLoading] = useState(true);

  // Use ref to access latest profile in stable callbacks
  const profileRef = useRef(profile);
  profileRef.current = profile;

  // Sync initial profile from server when it changes (after login)
  useEffect(() => {
    if (initialProfile) {
      savePlayerProfile(initialProfile);
      setProfile(initialProfile);
    }
  }, [initialProfile]);

  useEffect(() => {
    setLoading(false);
  }, []);

  // ─────────────────────────────────────────────────────────────────
  // Derived state (memoized)
  // ─────────────────────────────────────────────────────────────────

  const currentRank = profile.rank;
  const currentRankInfo = useMemo(() => getRankInfo(currentRank), [currentRank]);
  const nextRank = useMemo(() => getNextRank(currentRank), [currentRank]);
  const rankProgress = useMemo(
    () => getRankProgress(profile.stats, currentRank),
    [profile.stats, currentRank]
  );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const isFirstPlayOfDay = useMemo(() => isFirstPlayToday(), [profile.lastPlayedDate]);

  // ─────────────────────────────────────────────────────────────────
  // State context value (changes frequently)
  // ─────────────────────────────────────────────────────────────────

  const stateValue: PlayerState = useMemo(() => ({
    profile,
    loading,
    currentRank,
    currentRankInfo,
    nextRank,
    rankProgress,
    isFirstPlayOfDay,
  }), [
    profile,
    loading,
    currentRank,
    currentRankInfo,
    nextRank,
    rankProgress,
    isFirstPlayOfDay,
  ]);

  // ─────────────────────────────────────────────────────────────────
  // API functions (stable references via useCallback)
  // ─────────────────────────────────────────────────────────────────

  const refreshProfile = useCallback(() => {
    setProfile(getPlayerProfile());
  }, []);

  const updateDisplayName = useCallback((name: string) => {
    // Update locally first (optimistic)
    const updated = updateDisplayNameService(name);
    setProfile(updated);
    // Sync to server (fire and forget)
    updateDisplayNameApi(name).catch(console.error);
  }, []);

  const updatePreferences = useCallback((preferences: Partial<PlayerPreferences>) => {
    // Update locally first (optimistic)
    const updated = updatePreferencesService(preferences);
    setProfile(updated);
    // Sync to server (fire and forget)
    updatePreferencesApi(preferences).catch(console.error);
  }, []);

  const checkStreak = useCallback((): StreakResult => {
    const { profile: updated, streakMaintained, isNewStreak } = updateStreakService();
    setProfile(updated);
    return { streakMaintained, isNewStreak };
  }, []);

  const recordPlay = useCallback(() => {
    // Update locally first (optimistic)
    const updated = recordPlaySession();
    setProfile(updated);
    // Sync to server (fire and forget)
    recordPlaySessionApi().catch(console.error);
  }, []);

  const updateStats = useCallback((updates: Partial<PlayerStats>): StatsUpdateResult => {
    // Update locally first (optimistic)
    const { profile: updated, rankedUp, previousRank, newRank } = updateStatsService(updates);
    setProfile(updated);

    // Calculate incremental updates for server
    // The server expects increments, not absolute values
    const increments: Record<string, number> = {};
    if (updates.totalGamesPlayed !== undefined) {
      increments.totalGamesPlayed = 1;
    }
    if (updates.totalPuzzlesSolved !== undefined) {
      increments.totalPuzzlesSolved = 1;
    }
    if (updates.totalWins !== undefined) {
      increments.totalWins = 1;
    }
    if (updates.magicGraphSolved !== undefined) {
      increments.magicGraphSolved = 1;
    }
    if (updates.sequenceRaceWins !== undefined) {
      increments.sequenceRaceWins = 1;
    }
    if (updates.shapeArchitectBuilt !== undefined) {
      increments.shapeArchitectBuilt = 1;
    }

    // Sync to server (fire and forget)
    updateStatsApi({
      ...increments,
      bestTime: updates.bestTimes,
    }).catch(console.error);

    // Sync to Firebase (debounced)
    syncToFirestore(updated);

    return { rankedUp, previousRank, newRank };
  }, []);

  const checkAndUnlockAchievements = useCallback((context: AchievementContext): AchievementResult => {
    // Use ref to get latest profile without dependency
    const currentProfile = profileRef.current;

    const enrichedContext: AchievementContext = {
      ...context,
      streak: currentProfile.streak,
      currentRank: currentProfile.rank,
      gamesPlayedByType: {
        magicGraph: currentProfile.stats.magicGraphSolved,
        sequenceRace: currentProfile.stats.sequenceRaceWins,
        shapeArchitect: currentProfile.stats.shapeArchitectBuilt,
      },
    };

    const newAchievementIds = checkAchievements(enrichedContext, currentProfile.achievements);

    if (newAchievementIds.length === 0) {
      return { newAchievements: [] };
    }

    // Batch unlock all achievements in a single storage operation
    const { profile: updatedProfile, newIds } = unlockAchievementsBatch(newAchievementIds);

    // Map to Achievement objects and sync
    const newAchievements: Achievement[] = [];
    newIds.forEach((id) => {
      const achievement = getAchievementById(id);
      if (achievement) {
        newAchievements.push(achievement);
        // Sync to server (fire and forget)
        unlockAchievementApi(id).catch(console.error);
        // Sync to Firebase (debounced)
        syncAchievementToFirebase(id);
      }
    });

    if (newAchievements.length > 0) {
      setProfile(updatedProfile);
    }

    return { newAchievements };
  }, []);

  const hasAchievement = useCallback((id: string): boolean => {
    return profileRef.current.achievements.includes(id);
  }, []);

  const getRecentAchievements = useCallback((count = 3): Achievement[] => {
    const recentIds = profileRef.current.achievements.slice(-count).reverse();
    return recentIds
      .map((id) => getAchievementById(id))
      .filter((a): a is Achievement => a !== undefined);
  }, []);

  // ─────────────────────────────────────────────────────────────────
  // API context value (stable - never causes re-renders)
  // ─────────────────────────────────────────────────────────────────

  const apiValue: PlayerAPI = useMemo(() => ({
    refreshProfile,
    updateDisplayName,
    updatePreferences,
    checkStreak,
    recordPlay,
    updateStats,
    checkAndUnlockAchievements,
    hasAchievement,
    getRecentAchievements,
  }), [
    refreshProfile,
    updateDisplayName,
    updatePreferences,
    checkStreak,
    recordPlay,
    updateStats,
    checkAndUnlockAchievements,
    hasAchievement,
    getRecentAchievements,
  ]);

  // ─────────────────────────────────────────────────────────────────
  // Render with nested providers
  // ─────────────────────────────────────────────────────────────────

  return (
    <PlayerStateContext.Provider value={stateValue}>
      <PlayerAPIContext.Provider value={apiValue}>
        {children}
      </PlayerAPIContext.Provider>
    </PlayerStateContext.Provider>
  );
}

// usePlayer hook is exported from ./usePlayerHooks.ts for Fast Refresh compatibility
