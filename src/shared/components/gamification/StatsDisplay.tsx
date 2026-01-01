/**
 * Stats Display Component
 * Shows player stats (games played, puzzles solved, wins) and rank
 */

import { useTranslation } from 'react-i18next';
import type { PlayerStats } from '../../services/player';
import type { PlayerRank } from '../../services/rank';
import { getRankInfo, getNextRank, getRankProgress } from '../../services/rank';
import './StatsDisplay.css';

interface StatsDisplayProps {
  stats: PlayerStats;
  rank: PlayerRank;
  showRank?: boolean;
  showProgress?: boolean;
  variant?: 'compact' | 'detailed';
  className?: string;
}

export function StatsDisplay({
  stats,
  rank,
  showRank = true,
  showProgress = true,
  variant = 'compact',
  className = '',
}: StatsDisplayProps) {
  const { t } = useTranslation();
  const rankInfo = getRankInfo(rank);
  const nextRank = getNextRank(rank);
  const progress = getRankProgress(stats, rank);

  return (
    <div className={`stats-display stats-display--${variant} ${className}`}>
      {/* Rank Badge */}
      {showRank && (
        <div className="stats-display__rank">
          <span className="stats-display__rank-icon">{rankInfo.icon}</span>
          <span className="stats-display__rank-name">
            {t(rankInfo.displayNameKey)}
          </span>
        </div>
      )}

      {/* Stats */}
      {variant === 'detailed' ? (
        <div className="stats-display__detailed">
          <div className="stats-display__stat">
            <span className="stats-display__stat-value">{stats.totalGamesPlayed}</span>
            <span className="stats-display__stat-label">{t('stats.gamesPlayed')}</span>
          </div>
          <div className="stats-display__stat">
            <span className="stats-display__stat-value">{stats.totalPuzzlesSolved}</span>
            <span className="stats-display__stat-label">{t('stats.puzzlesSolved')}</span>
          </div>
          <div className="stats-display__stat">
            <span className="stats-display__stat-value">{stats.totalWins}</span>
            <span className="stats-display__stat-label">{t('stats.wins')}</span>
          </div>
        </div>
      ) : (
        <div className="stats-display__compact">
          <span className="stats-display__compact-stat">
            {stats.totalGamesPlayed} {t('stats.games')}
          </span>
          <span className="stats-display__separator">•</span>
          <span className="stats-display__compact-stat">
            {stats.totalPuzzlesSolved} {t('stats.solved')}
          </span>
        </div>
      )}

      {/* Progress to Next Rank */}
      {showProgress && nextRank && progress && (
        <div className="stats-display__progress">
          <div className="stats-display__progress-header">
            <span className="stats-display__progress-label">
              {t('stats.nextRank')}
            </span>
            <span className="stats-display__progress-target">
              {nextRank.icon} {t(nextRank.displayNameKey)}
            </span>
          </div>

          <div className="stats-display__progress-bar">
            <div
              className="stats-display__progress-fill"
              style={{ width: `${progress.progressPercent}%` }}
            />
          </div>

          <div className="stats-display__progress-detail">
            {progress.gamesNeeded > 0 && (
              <span>
                {t('stats.gamesNeeded', { count: progress.gamesNeeded })}
              </span>
            )}
            {progress.gamesNeeded > 0 && progress.solvesNeeded > 0 && (
              <span className="stats-display__separator">•</span>
            )}
            {progress.solvesNeeded > 0 && (
              <span>
                {t('stats.solvesNeeded', { count: progress.solvesNeeded })}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default StatsDisplay;
