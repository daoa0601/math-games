export {
    getProgress,
    saveProgress,
    completeLevel,
    isLevelUnlocked,
    isLevelCompleted,
    getBestTime,
    getTotalScore,
    resetProgress,
    getGlobalStats,
    // Personal Best functions
    checkPersonalBest,
    completeLevelWithPB,
    getAllBestTimes,
    getGameFastestTime,
    getGameAverageTime,
} from './storage';

export type { LevelProgress, GameProgress, PersonalBestResult } from './storage';
// GameId is deprecated - use StorageGameId from '../types' instead

export {
    playSound,
    toggleSound,
    isSoundEnabled,
    preloadSounds,
    initSoundPreference,
    setSoundVolume,
    setGlobalVolume,
} from './audio';

export type { SoundName } from './audio';

export { showConfetti, showConfettiBurst } from './confetti';

// TypedStorage with Zod validation
export { TypedStorage, createSimpleStorage } from './TypedStorage';
export type { TypedStorageOptions } from './TypedStorage';

// Zod schemas for stored data
export {
    PlayerPreferencesSchema,
    BestTimesSchema,
    PlayerStatsSchema,
    PlayerRankSchema,
    PlayerProfileSchema,
    GameProgressSchema,
    // Daily Challenge schemas
    StorageGameIdSchema,
    GameStreakSchema,
    DailyChallengeCompletionSchema,
    DailyChallengeStateSchema,
    // Leaderboard schemas
    LeaderboardEntrySchema,
    LeaderboardStateSchema,
} from './schemas';

export type {
    PlayerPreferences,
    BestTimes,
    PlayerStats,
    PlayerRank,
    PlayerProfile,
    // Daily Challenge types
    StorageGameId,
    GameStreak,
    DailyChallengeCompletion,
    DailyChallengeState,
    // Leaderboard types
    LeaderboardEntry,
    LeaderboardState,
} from './schemas';

// Seeded random for daily challenges
export {
    createSeededRandom,
    createDailyRandom,
    getTodaySeed,
    getMillisecondsUntilTomorrow,
    formatCountdown,
} from './seededRandom';

export type { SeededRandom } from './seededRandom';

// Color patterns for accessibility
export {
    getPatternForColor,
    getPieceStyles,
    getExplicitPattern,
    PIECE_PATTERNS,
} from './colorPatterns';

export type { PatternClass } from './colorPatterns';
