/**
 * useGameRewards Hook
 * Handles stats updates, achievement checking, and reward display for game completions
 *
 * Key behavior:
 * - Practice mode = ZERO tracking (no stats, no achievements)
 * - Timed mode = full tracking (stats update, achievements check)
 */

import { useCallback, useState } from 'react';
import { usePlayer } from '@/shared/contexts';
import type { Achievement, AchievementContext, GameId } from '@/shared/services/achievements';
import type { PlayerRank } from '@/shared/services/rank';
import {
  completeLevelWithPB,
  type PersonalBestResult,
} from '@/shared/utils';

export interface GameCompletionParams {
  gameId: GameId;
  levelId: string;
  difficulty: string;
  timeSeconds: number;
  practiceMode: boolean;
  nextLevelId?: string;
  // Game-specific params
  isOptimalSolution?: boolean;  // MagicGraph grandmaster
  wasWinner?: boolean;          // SequenceRace
}

export interface CompletionRewards {
  statsUpdated: boolean;
  rankedUp: boolean;
  previousRank: PlayerRank | null;
  newRank: PlayerRank | null;
  newAchievements: Achievement[];
  /** Personal best tracking result (null in practice mode) */
  personalBest: PersonalBestResult | null;
}

export interface UseGameRewardsReturn {
  handleCompletion: (params: GameCompletionParams) => CompletionRewards;
  rewards: CompletionRewards | null;
  clearRewards: () => void;
  showingRankUp: boolean;
  setShowingRankUp: (show: boolean) => void;
  toastQueue: Achievement[];
  dismissToast: (id: string) => void;
}

export function useGameRewards(): UseGameRewardsReturn {
  const {
    updateStats,
    checkAndUnlockAchievements,
    recordPlay,
  } = usePlayer();

  const [rewards, setRewards] = useState<CompletionRewards | null>(null);
  const [showingRankUp, setShowingRankUp] = useState(false);
  const [toastQueue, setToastQueue] = useState<Achievement[]>([]);

  const handleCompletion = useCallback((params: GameCompletionParams): CompletionRewards => {
    const {
      gameId,
      levelId,
      difficulty,
      timeSeconds,
      practiceMode,
      nextLevelId,
      isOptimalSolution = false,
      wasWinner = true,
    } = params;

    // ═══════════════════════════════════════════════════════════════════
    // PRACTICE MODE: Zero tracking
    // ═══════════════════════════════════════════════════════════════════
    if (practiceMode) {
      // Still save to level storage for UI continuity (shows level as completed)
      completeLevelWithPB(gameId, levelId, timeSeconds, nextLevelId);

      const noRewards: CompletionRewards = {
        statsUpdated: false,
        rankedUp: false,
        previousRank: null,
        newRank: null,
        newAchievements: [],
        personalBest: null, // No PB tracking in practice mode
      };

      setRewards(noRewards);
      return noRewards;
    }

    // ═══════════════════════════════════════════════════════════════════
    // TIMED MODE: Full tracking
    // ═══════════════════════════════════════════════════════════════════

    // Update stats based on game type
    const statsUpdate = getStatsUpdate(gameId, wasWinner);
    const { rankedUp, previousRank, newRank } = updateStats(statsUpdate);

    // Build achievement context
    const achievementContext: AchievementContext = {
      gameId,
      difficulty,
      isOptimalSolution,
      wasWinner,
    };

    // Check and unlock achievements
    const { newAchievements } = checkAndUnlockAchievements(achievementContext);

    // Save to game storage and get personal best info
    const { personalBest } = completeLevelWithPB(gameId, levelId, timeSeconds, nextLevelId);

    // Record play session (for streak tracking)
    recordPlay();

    // Build rewards object
    const completionRewards: CompletionRewards = {
      statsUpdated: true,
      rankedUp,
      previousRank,
      newRank,
      newAchievements,
      personalBest,
    };

    // Update state
    setRewards(completionRewards);

    // Show rank up overlay if ranked up
    if (rankedUp) {
      setShowingRankUp(true);
    }

    // Queue achievement toasts
    if (newAchievements.length > 0) {
      setToastQueue(newAchievements);
    }

    return completionRewards;
  }, [
    updateStats,
    checkAndUnlockAchievements,
    recordPlay,
  ]);

  const clearRewards = useCallback(() => {
    setRewards(null);
    setShowingRankUp(false);
    setToastQueue([]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToastQueue((prev) => prev.filter((a) => a.id !== id));
  }, []);

  return {
    handleCompletion,
    rewards,
    clearRewards,
    showingRankUp,
    setShowingRankUp,
    toastQueue,
    dismissToast,
  };
}

/**
 * Get the stats update object based on game type
 */
function getStatsUpdate(gameId: GameId, wasWinner: boolean) {
  const base = { totalGamesPlayed: 1 };

  switch (gameId) {
    case 'magic-graph':
      return {
        ...base,
        totalPuzzlesSolved: 1,
        magicGraphSolved: 1,
      };

    case 'sequence-race':
      if (wasWinner) {
        return {
          ...base,
          totalWins: 1,
          sequenceRaceWins: 1,
        };
      }
      return base; // No win, just count the game

    case 'shape-architect':
      return {
        ...base,
        totalPuzzlesSolved: 1,
        shapeArchitectBuilt: 1,
      };

    default:
      return base;
  }
}

export default useGameRewards;
