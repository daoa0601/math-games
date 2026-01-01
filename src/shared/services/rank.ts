/**
 * Rank System
 * Defines player ranks based on games played and puzzles solved
 */

import type { PlayerStats } from './player';

export type PlayerRank =
  | 'beginner'
  | 'learner'
  | 'apprentice'
  | 'intermediate'
  | 'advanced'
  | 'expert'
  | 'master'
  | 'grandmaster';

export interface RankThreshold {
  rank: PlayerRank;
  requiredGames: number;
  requiredSolves: number;
  displayNameKey: string;
  icon: string;
}

/**
 * Rank thresholds - ordered from lowest to highest
 * A player must meet BOTH requirements to achieve a rank
 */
export const RANK_THRESHOLDS: RankThreshold[] = [
  { rank: 'beginner', requiredGames: 0, requiredSolves: 0, displayNameKey: 'ranks.beginner', icon: '🌱' },
  { rank: 'learner', requiredGames: 5, requiredSolves: 3, displayNameKey: 'ranks.learner', icon: '📚' },
  { rank: 'apprentice', requiredGames: 15, requiredSolves: 10, displayNameKey: 'ranks.apprentice', icon: '🎓' },
  { rank: 'intermediate', requiredGames: 30, requiredSolves: 20, displayNameKey: 'ranks.intermediate', icon: '⭐' },
  { rank: 'advanced', requiredGames: 60, requiredSolves: 40, displayNameKey: 'ranks.advanced', icon: '💫' },
  { rank: 'expert', requiredGames: 100, requiredSolves: 75, displayNameKey: 'ranks.expert', icon: '🏆' },
  { rank: 'master', requiredGames: 200, requiredSolves: 150, displayNameKey: 'ranks.master', icon: '👑' },
  { rank: 'grandmaster', requiredGames: 500, requiredSolves: 300, displayNameKey: 'ranks.grandmaster', icon: '🌟' },
];

/**
 * Calculate the player's rank based on their stats
 */
export function calculateRank(stats: PlayerStats): PlayerRank {
  // Find the highest rank the player qualifies for
  for (let i = RANK_THRESHOLDS.length - 1; i >= 0; i--) {
    const threshold = RANK_THRESHOLDS[i];
    if (
      stats.totalGamesPlayed >= threshold.requiredGames &&
      stats.totalPuzzlesSolved >= threshold.requiredSolves
    ) {
      return threshold.rank;
    }
  }
  return 'beginner';
}

/**
 * Get the rank info for a given rank
 */
export function getRankInfo(rank: PlayerRank): RankThreshold {
  return RANK_THRESHOLDS.find((r) => r.rank === rank) || RANK_THRESHOLDS[0];
}

/**
 * Get the next rank threshold, or null if at max rank
 */
export function getNextRank(currentRank: PlayerRank): RankThreshold | null {
  const currentIndex = RANK_THRESHOLDS.findIndex((r) => r.rank === currentRank);
  if (currentIndex === -1 || currentIndex >= RANK_THRESHOLDS.length - 1) {
    return null;
  }
  return RANK_THRESHOLDS[currentIndex + 1];
}

/**
 * Get progress towards the next rank
 */
export function getRankProgress(
  stats: PlayerStats,
  currentRank: PlayerRank
): { gamesNeeded: number; solvesNeeded: number; progressPercent: number } | null {
  const nextRank = getNextRank(currentRank);
  if (!nextRank) {
    return null; // Already at max rank
  }

  const currentRankInfo = getRankInfo(currentRank);

  // Calculate games progress
  const gamesRange = nextRank.requiredGames - currentRankInfo.requiredGames;
  const gamesProgress = stats.totalGamesPlayed - currentRankInfo.requiredGames;
  const gamesPercent = gamesRange > 0 ? Math.min(100, (gamesProgress / gamesRange) * 100) : 100;

  // Calculate solves progress
  const solvesRange = nextRank.requiredSolves - currentRankInfo.requiredSolves;
  const solvesProgress = stats.totalPuzzlesSolved - currentRankInfo.requiredSolves;
  const solvesPercent = solvesRange > 0 ? Math.min(100, (solvesProgress / solvesRange) * 100) : 100;

  // Overall progress is the minimum of both (need to meet both requirements)
  const progressPercent = Math.min(gamesPercent, solvesPercent);

  return {
    gamesNeeded: Math.max(0, nextRank.requiredGames - stats.totalGamesPlayed),
    solvesNeeded: Math.max(0, nextRank.requiredSolves - stats.totalPuzzlesSolved),
    progressPercent,
  };
}

/**
 * Get the rank index (0-based) for comparison
 */
export function getRankIndex(rank: PlayerRank): number {
  return RANK_THRESHOLDS.findIndex((r) => r.rank === rank);
}

/**
 * Check if rank1 is higher than rank2
 */
export function isHigherRank(rank1: PlayerRank, rank2: PlayerRank): boolean {
  return getRankIndex(rank1) > getRankIndex(rank2);
}
