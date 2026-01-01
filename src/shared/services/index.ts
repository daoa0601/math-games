/**
 * Shared Services - Barrel Export
 */

// Player Profile Service
export {
  type PlayerProfile,
  type PlayerPreferences,
  type PlayerStats,
  getPlayerProfile,
  savePlayerProfile,
  updatePlayerProfile,
  updateDisplayName,
  updatePreferences,
  updateStreak,
  updateStats,
  recordPlaySession,
  unlockAchievement,
  hasAchievement,
  getAchievementCount,
  isFirstPlayToday,
  resetPlayerProfile,
  getTodayDate,
  createDefaultProfile,
  createDefaultStats,
} from './player';

// Rank System
export {
  type PlayerRank,
  type RankThreshold,
  RANK_THRESHOLDS,
  calculateRank,
  getRankInfo,
  getNextRank,
  getRankProgress,
  getRankIndex,
  isHigherRank,
} from './rank';

// Achievement System
export {
  type Achievement,
  type AchievementCategory,
  type AchievementRarity,
  type AchievementContext,
  type GameId,
  ACHIEVEMENTS,
  getAchievementById,
  getAchievementsByCategory,
  getAchievementsByRarity,
  checkAchievements,
  getAchievementStats,
  getRarityColor,
} from './achievements';

// Daily Challenge System
export {
  type CompletionResult,
  getDailyChallengeState,
  isDailyCompleted,
  getTodayCompletion,
  getTodayCompletions,
  isAllGamesCompletedToday,
  getGameStreak,
  getDailyBestTime,
  completeDailyChallenge,
  getCompletionHistory,
  resetDailyChallengeState,
} from './daily';

// Tutorial Progress System
export {
  isTutorialCompleted,
  isTutorialSkipped,
  shouldShowTutorial,
  markTutorialCompleted,
  markTutorialSkipped,
  resetTutorialProgress,
} from './tutorialProgress';
