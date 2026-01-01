// ========================================
// Shared Storage Service for Cross-Game Persistence
// ========================================

import { getGameProgressKey } from '../constants';
import { type StorageGameId, STORAGE_GAME_IDS } from '../types';

// Re-export for backwards compatibility
export type GameId = StorageGameId;

export interface LevelProgress {
    levelId: string;
    completed: boolean;
    bestTime: number | null; // seconds
    completedAt: string | null; // ISO date
}

export interface GameProgress {
    gameId: GameId;
    unlockedLevels: string[]; // Level IDs that are unlocked
    completedLevels: Map<string, LevelProgress>;
    totalScore: number;
    lastPlayed: string | null; // ISO date
}

interface StoredGameProgress {
    gameId: GameId;
    unlockedLevels: string[];
    completedLevels: [string, LevelProgress][]; // Map serialized as entries
    totalScore: number;
    lastPlayed: string | null;
}

/**
 * Get storage key for a game
 */
function getStorageKey(gameId: GameId): string {
    return getGameProgressKey(gameId);
}

/**
 * Get default progress for a game
 */
function getDefaultProgress(gameId: GameId): GameProgress {
    return {
        gameId,
        unlockedLevels: [], // First level is always unlocked by default
        completedLevels: new Map(),
        totalScore: 0,
        lastPlayed: null,
    };
}

/**
 * Load game progress from localStorage
 */
export function getProgress(gameId: GameId): GameProgress {
    try {
        const key = getStorageKey(gameId);
        const stored = localStorage.getItem(key);

        if (!stored) {
            return getDefaultProgress(gameId);
        }

        const parsed: StoredGameProgress = JSON.parse(stored);

        return {
            gameId: parsed.gameId,
            unlockedLevels: parsed.unlockedLevels,
            completedLevels: new Map(parsed.completedLevels),
            totalScore: parsed.totalScore,
            lastPlayed: parsed.lastPlayed,
        };
    } catch (error) {
        console.error(`Failed to load progress for ${gameId}:`, error);
        return getDefaultProgress(gameId);
    }
}

/**
 * Save game progress to localStorage
 */
export function saveProgress(progress: GameProgress): void {
    try {
        const key = getStorageKey(progress.gameId);

        const toStore: StoredGameProgress = {
            gameId: progress.gameId,
            unlockedLevels: progress.unlockedLevels,
            completedLevels: Array.from(progress.completedLevels.entries()),
            totalScore: progress.totalScore,
            lastPlayed: progress.lastPlayed,
        };

        localStorage.setItem(key, JSON.stringify(toStore));
    } catch (error) {
        console.error(`Failed to save progress for ${progress.gameId}:`, error);
    }
}

/**
 * Mark a level as completed and optionally update best time
 */
export function completeLevel(
    gameId: GameId,
    levelId: string,
    timeSeconds: number,
    nextLevelId?: string
): GameProgress {
    const progress = getProgress(gameId);

    const existing = progress.completedLevels.get(levelId);
    const isNewBest = !existing?.bestTime || timeSeconds < existing.bestTime;

    // Update level progress
    progress.completedLevels.set(levelId, {
        levelId,
        completed: true,
        bestTime: isNewBest ? timeSeconds : (existing?.bestTime ?? timeSeconds),
        completedAt: existing?.completedAt ?? new Date().toISOString(),
    });

    // Unlock next level if provided
    if (nextLevelId && !progress.unlockedLevels.includes(nextLevelId)) {
        progress.unlockedLevels.push(nextLevelId);
    }

    // Update score (10 points per completion, bonus for fast times)
    const timeBonus = Math.max(0, Math.floor((60 - timeSeconds) / 10));
    progress.totalScore += 10 + timeBonus;

    // Update last played
    progress.lastPlayed = new Date().toISOString();

    saveProgress(progress);
    return progress;
}

/**
 * Check if a level is unlocked
 */
export function isLevelUnlocked(gameId: GameId, levelId: string, firstLevelId: string): boolean {
    // First level is always unlocked
    if (levelId === firstLevelId) {
        return true;
    }

    const progress = getProgress(gameId);
    return progress.unlockedLevels.includes(levelId);
}

/**
 * Check if a level is completed
 */
export function isLevelCompleted(gameId: GameId, levelId: string): boolean {
    const progress = getProgress(gameId);
    return progress.completedLevels.get(levelId)?.completed ?? false;
}

/**
 * Get best time for a level
 */
export function getBestTime(gameId: GameId, levelId: string): number | null {
    const progress = getProgress(gameId);
    return progress.completedLevels.get(levelId)?.bestTime ?? null;
}

/**
 * Get total score for a game
 */
export function getTotalScore(gameId: GameId): number {
    const progress = getProgress(gameId);
    return progress.totalScore;
}

/**
 * Reset all progress for a game
 */
export function resetProgress(gameId: GameId): void {
    try {
        const key = getStorageKey(gameId);
        localStorage.removeItem(key);
    } catch (error) {
        console.error(`Failed to reset progress for ${gameId}:`, error);
    }
}

/**
 * Get aggregate stats across all games
 */
export function getGlobalStats(): {
    totalScore: number;
    gamesPlayed: number;
    levelsCompleted: number;
} {
    const gameIds = STORAGE_GAME_IDS;

    let totalScore = 0;
    let gamesPlayed = 0;
    let levelsCompleted = 0;

    for (const gameId of gameIds) {
        const progress = getProgress(gameId);
        totalScore += progress.totalScore;
        if (progress.lastPlayed) {
            gamesPlayed++;
        }
        levelsCompleted += progress.completedLevels.size;
    }

    return { totalScore, gamesPlayed, levelsCompleted };
}

// ============================================================================
// Personal Best Detection
// ============================================================================

export interface PersonalBestResult {
    /** Whether this is a new personal best time */
    isNewBest: boolean;
    /** Previous best time (null if first completion) */
    previousBest: number | null;
    /** Current completion time */
    currentTime: number;
    /** Time improvement in seconds (positive = faster, negative = slower) */
    improvement: number | null;
}

/**
 * Check if a time would be a personal best for a level.
 * Use this before completing to show preview, or after completing for result.
 */
export function checkPersonalBest(
    gameId: GameId,
    levelId: string,
    timeSeconds: number
): PersonalBestResult {
    const previousBest = getBestTime(gameId, levelId);
    const isNewBest = previousBest === null || timeSeconds < previousBest;
    const improvement = previousBest !== null ? previousBest - timeSeconds : null;

    return {
        isNewBest,
        previousBest,
        currentTime: timeSeconds,
        improvement,
    };
}

/**
 * Complete a level and return personal best information.
 * This is a wrapper around completeLevel that includes PB detection.
 */
export function completeLevelWithPB(
    gameId: GameId,
    levelId: string,
    timeSeconds: number,
    nextLevelId?: string
): { progress: GameProgress; personalBest: PersonalBestResult } {
    // Check PB before updating (to get previous best)
    const personalBest = checkPersonalBest(gameId, levelId, timeSeconds);

    // Complete the level (updates storage)
    const progress = completeLevel(gameId, levelId, timeSeconds, nextLevelId);

    return { progress, personalBest };
}

/**
 * Get all personal bests for a game (for leaderboard display)
 */
export function getAllBestTimes(gameId: GameId): Array<{
    levelId: string;
    bestTime: number;
    completedAt: string | null;
}> {
    const progress = getProgress(gameId);
    const results: Array<{ levelId: string; bestTime: number; completedAt: string | null }> = [];

    progress.completedLevels.forEach((level) => {
        if (level.bestTime !== null) {
            results.push({
                levelId: level.levelId,
                bestTime: level.bestTime,
                completedAt: level.completedAt,
            });
        }
    });

    // Sort by best time (fastest first)
    return results.sort((a, b) => a.bestTime - b.bestTime);
}

/**
 * Get game-wide best time (fastest across all levels)
 */
export function getGameFastestTime(gameId: GameId): number | null {
    const allTimes = getAllBestTimes(gameId);
    return allTimes.length > 0 ? allTimes[0].bestTime : null;
}

/**
 * Get average best time across all completed levels
 */
export function getGameAverageTime(gameId: GameId): number | null {
    const allTimes = getAllBestTimes(gameId);
    if (allTimes.length === 0) return null;

    const total = allTimes.reduce((sum, t) => sum + t.bestTime, 0);
    return Math.round(total / allTimes.length);
}
