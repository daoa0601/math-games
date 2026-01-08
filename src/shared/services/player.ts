/**
 * Player Profile Service
 * Manages player data persistence, streak tracking, and profile operations
 */

import { calculateRank } from './rank';
import { PLAYER_KEY, LANGUAGE_KEY, SOUND_ENABLED_KEY } from '../constants';
import { getTodayDate, daysBetween } from '../utils/dateUtils';
import type {
  PlayerProfile,
  PlayerStats,
  PlayerPreferences,
  PlayerRank,
} from '../schemas/playerProfile.schema';

// Re-export for backwards compatibility
export type { PlayerProfile, PlayerStats, PlayerPreferences };
export { getTodayDate }; // Re-export from dateUtils for backward compat

const STORAGE_VERSION = 2; // Increment when data structure changes

/**
 * Generate a unique player ID
 */
function generatePlayerId(): string {
  return `player_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// getTodayDate and daysBetween imported from '@/shared/utils/dateUtils'

/**
 * Create default player stats
 */
export function createDefaultStats(): PlayerStats {
  return {
    totalGamesPlayed: 0,
    totalPuzzlesSolved: 0,
    totalWins: 0,
    magicGraphSolved: 0,
    sequenceRaceWins: 0,
    shapeArchitectBuilt: 0,
    bestTimes: {
      magicGraphFastest: null,
      sequenceRaceFastest: null,
      shapeArchitectFastest: null,
    },
  };
}

/**
 * Create a new player profile with default values
 */
export function createDefaultProfile(): PlayerProfile {
  const savedLanguage = localStorage.getItem(LANGUAGE_KEY) as 'en' | 'vi' | null;
  const savedSound = localStorage.getItem(SOUND_ENABLED_KEY);
  const stats = createDefaultStats();

  return {
    id: generatePlayerId(),
    displayName: '',
    stats,
    rank: calculateRank(stats),
    streak: 0,
    lastPlayedDate: null,
    achievements: [],
    preferences: {
      soundEnabled: savedSound !== 'false',
      practiceMode: false,
      language: savedLanguage || 'vi',
    },
    createdAt: new Date().toISOString(),
    version: STORAGE_VERSION,
  };
}

/**
 * Load player profile from localStorage
 * Creates a new profile if none exists
 */
export function getPlayerProfile(): PlayerProfile {
  try {
    const stored = localStorage.getItem(PLAYER_KEY);
    if (stored) {
      const profile = JSON.parse(stored);

      // Check if migration is needed
      if (!profile.version || profile.version < STORAGE_VERSION) {
        return migrateProfile(profile);
      }

      // Ensure all fields exist (defensive)
      return {
        ...createDefaultProfile(),
        ...profile,
      };
    }
  } catch (error) {
    console.error('Failed to load player profile:', error);
  }

  // Create and save new profile
  const newProfile = createDefaultProfile();
  savePlayerProfile(newProfile);
  return newProfile;
}

/**
 * Migrate old profile format to new format
 */
function migrateProfile(oldProfile: Record<string, unknown>): PlayerProfile {
  const defaultProfile = createDefaultProfile();

  // Estimate games from XP if XP exists (old format)
  const oldXP = typeof oldProfile.xp === 'number' ? oldProfile.xp : 0;
  const estimatedGames = Math.floor(oldXP / 25); // ~25 XP per game average

  // Create new stats from estimates
  const stats: PlayerStats = {
    totalGamesPlayed: estimatedGames,
    totalPuzzlesSolved: 0, // Can't estimate, start fresh
    totalWins: 0,
    magicGraphSolved: 0,
    sequenceRaceWins: 0,
    shapeArchitectBuilt: 0,
    bestTimes: {
      magicGraphFastest: null,
      sequenceRaceFastest: null,
      shapeArchitectFastest: null,
    },
  };

  // Filter achievements to only keep the 10 core ones
  const coreAchievements = [
    'global_first_steps',
    'global_all_games',
    'global_streak_30',
    'global_grandmaster',
    'mg_first_solve',
    'mg_grandmaster',
    'sr_first_victory',
    'sr_hard_winner',
    'sa_first_build',
    'sa_master_architect',
  ];

  const oldAchievements = Array.isArray(oldProfile.achievements) ? oldProfile.achievements : [];
  const filteredAchievements = oldAchievements.filter((id) =>
    typeof id === 'string' && coreAchievements.includes(id)
  );

  const migratedProfile: PlayerProfile = {
    id: typeof oldProfile.id === 'string' ? oldProfile.id : defaultProfile.id,
    displayName: typeof oldProfile.displayName === 'string' ? oldProfile.displayName : '',
    stats,
    rank: calculateRank(stats),
    streak: typeof oldProfile.streak === 'number' ? oldProfile.streak : 0,
    lastPlayedDate: typeof oldProfile.lastPlayedDate === 'string' ? oldProfile.lastPlayedDate : null,
    achievements: filteredAchievements,
    preferences: {
      ...defaultProfile.preferences,
      ...(typeof oldProfile.preferences === 'object' && oldProfile.preferences !== null
        ? oldProfile.preferences as Partial<PlayerPreferences>
        : {}),
    },
    createdAt: typeof oldProfile.createdAt === 'string' ? oldProfile.createdAt : defaultProfile.createdAt,
    version: STORAGE_VERSION,
  };

  savePlayerProfile(migratedProfile);
  return migratedProfile;
}

/**
 * Save player profile to localStorage
 */
export function savePlayerProfile(profile: PlayerProfile): void {
  try {
    localStorage.setItem(PLAYER_KEY, JSON.stringify(profile));
  } catch (error) {
    console.error('Failed to save player profile:', error);
  }
}

/**
 * Update specific fields in the player profile.
 * Optionally accepts an existing profile to avoid re-reading from storage.
 */
export function updatePlayerProfile(
  updates: Partial<PlayerProfile>,
  existingProfile?: PlayerProfile
): PlayerProfile {
  const profile = existingProfile ?? getPlayerProfile();
  const updated = { ...profile, ...updates };

  // Recalculate rank if stats changed
  if (updates.stats) {
    updated.rank = calculateRank(updated.stats);
  }

  savePlayerProfile(updated);
  return updated;
}

/**
 * Update player's display name
 */
export function updateDisplayName(name: string): PlayerProfile {
  const trimmed = name.trim().substring(0, 20); // Max 20 characters
  const profile = getPlayerProfile();
  return updatePlayerProfile({ displayName: trimmed }, profile);
}

/**
 * Update player preferences
 */
export function updatePreferences(preferences: Partial<PlayerPreferences>): PlayerProfile {
  const profile = getPlayerProfile();
  return updatePlayerProfile({
    preferences: { ...profile.preferences, ...preferences },
  }, profile);
}

/**
 * Update player stats and recalculate rank
 */
export function updateStats(updates: Partial<PlayerStats>): {
  profile: PlayerProfile;
  rankedUp: boolean;
  previousRank: PlayerRank;
  newRank: PlayerRank;
} {
  const profile = getPlayerProfile();
  const previousRank = profile.rank;

  const newStats: PlayerStats = {
    ...profile.stats,
    ...updates,
    bestTimes: {
      ...profile.stats.bestTimes,
      ...(updates.bestTimes || {}),
    },
  };

  const newRank = calculateRank(newStats);
  const rankedUp = newRank !== previousRank;

  // Pass existing profile to avoid re-reading
  const updated = updatePlayerProfile({
    stats: newStats,
    rank: newRank,
  }, profile);

  return { profile: updated, rankedUp, previousRank, newRank };
}

/**
 * Check and update the player's streak
 * Call this when starting a play session
 */
export function updateStreak(): { profile: PlayerProfile; streakMaintained: boolean; isNewStreak: boolean } {
  const profile = getPlayerProfile();
  const today = getTodayDate();

  // First play ever
  if (!profile.lastPlayedDate) {
    // Pass existing profile to avoid re-reading
    const updated = updatePlayerProfile({
      streak: 1,
      lastPlayedDate: today,
    }, profile);
    return { profile: updated, streakMaintained: true, isNewStreak: true };
  }

  const daysSinceLastPlay = daysBetween(profile.lastPlayedDate, today);

  // Same day - no change
  if (daysSinceLastPlay === 0) {
    return { profile, streakMaintained: true, isNewStreak: false };
  }

  // Next day - increment streak
  if (daysSinceLastPlay === 1) {
    // Pass existing profile to avoid re-reading
    const updated = updatePlayerProfile({
      streak: profile.streak + 1,
      lastPlayedDate: today,
    }, profile);
    return { profile: updated, streakMaintained: true, isNewStreak: false };
  }

  // Gap in days - reset streak
  // Pass existing profile to avoid re-reading
  const updated = updatePlayerProfile({
    streak: 1,
    lastPlayedDate: today,
  }, profile);
  return { profile: updated, streakMaintained: false, isNewStreak: true };
}

/**
 * Record that the player played today
 */
export function recordPlaySession(): PlayerProfile {
  const profile = getPlayerProfile();
  const today = getTodayDate();
  return updatePlayerProfile({ lastPlayedDate: today }, profile);
}

/**
 * Add an achievement to the player's profile
 * Returns false if already unlocked
 */
export function unlockAchievement(achievementId: string): { profile: PlayerProfile; isNew: boolean } {
  const profile = getPlayerProfile();

  if (profile.achievements.includes(achievementId)) {
    return { profile, isNew: false };
  }

  // Pass existing profile to avoid re-reading
  const updated = updatePlayerProfile({
    achievements: [...profile.achievements, achievementId],
  }, profile);

  return { profile: updated, isNew: true };
}

/**
 * Check if an achievement is unlocked
 */
export function hasAchievement(achievementId: string): boolean {
  const profile = getPlayerProfile();
  return profile.achievements.includes(achievementId);
}

/**
 * Get the count of unlocked achievements
 */
export function getAchievementCount(): number {
  const profile = getPlayerProfile();
  return profile.achievements.length;
}

/**
 * Check if this is the player's first play of the day
 */
export function isFirstPlayToday(): boolean {
  const profile = getPlayerProfile();
  const today = getTodayDate();
  return profile.lastPlayedDate !== today;
}

/**
 * Reset player profile (for testing or user request)
 */
export function resetPlayerProfile(): PlayerProfile {
  const newProfile = createDefaultProfile();
  savePlayerProfile(newProfile);
  return newProfile;
}
