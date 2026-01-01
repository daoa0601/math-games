/**
 * DailyChallenge Component
 *
 * Dashboard widget showing today's daily challenges with completion status,
 * per-game streaks, and countdown timer to next reset.
 */

import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  getTodayCompletions,
  getGameStreak,
  isAllGamesCompletedToday,
} from '../../services';
import {
  getMillisecondsUntilTomorrow,
  formatCountdown,
  type StorageGameId,
} from '../../utils';
import './DailyChallenge.css';

// ============================================================================
// Types
// ============================================================================

interface DailyChallengeProps {
  className?: string;
}

interface GameInfo {
  id: StorageGameId;
  path: string;
  icon: string;
  nameKey: string;
}

// ============================================================================
// Constants
// ============================================================================

const GAMES: GameInfo[] = [
  { id: 'magic-graph', path: '/magic-graph', icon: '✨', nameKey: 'games.magicGraph.title' },
  { id: 'sequence-race', path: '/sequence-race', icon: '🏃', nameKey: 'games.sequenceRace.title' },
  { id: 'shape-architect', path: '/shape-architect', icon: '🧱', nameKey: 'games.shapeArchitect.title' },
];

// ============================================================================
// Component
// ============================================================================

export function DailyChallenge({ className = '' }: DailyChallengeProps) {
  const { t } = useTranslation();
  const [countdown, setCountdown] = useState(() => getMillisecondsUntilTomorrow());

  // Update countdown every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(getMillisecondsUntilTomorrow());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Get completion status for all games
  const completions = useMemo(() => getTodayCompletions(), []);
  const allCompleted = useMemo(() => isAllGamesCompletedToday(), []);

  return (
    <section className={`daily-challenge ${className}`}>
      <header className="daily-challenge__header">
        <div className="daily-challenge__title-row">
          <h2 className="daily-challenge__title">
            <span className="daily-challenge__icon">📅</span>
            {t('daily.title', 'Daily Challenge')}
          </h2>
          {allCompleted && (
            <span className="daily-challenge__all-complete">
              {t('daily.allComplete', 'All Done!')}
            </span>
          )}
        </div>
        <div className="daily-challenge__countdown">
          <span className="daily-challenge__countdown-label">
            {t('daily.resetsIn', 'Resets in')}
          </span>
          <span className="daily-challenge__countdown-time">
            {formatCountdown(countdown)}
          </span>
        </div>
      </header>

      <div className="daily-challenge__games">
        {GAMES.map((game) => {
          const completion = completions.get(game.id);
          const isCompleted = completion?.completed ?? false;
          const timeSeconds = completion?.timeSeconds;
          const streak = getGameStreak(game.id);

          return (
            <Link
              key={game.id}
              to={`${game.path}?daily=true`}
              className={`daily-challenge__game ${isCompleted ? 'daily-challenge__game--completed' : ''}`}
            >
              <span className="daily-challenge__game-icon">{game.icon}</span>
              <div className="daily-challenge__game-info">
                <span className="daily-challenge__game-name">
                  {t(game.nameKey)}
                </span>
                {isCompleted && timeSeconds != null && (
                  <span className="daily-challenge__game-time">
                    {timeSeconds}s
                  </span>
                )}
              </div>
              <div className="daily-challenge__game-status">
                {isCompleted ? (
                  <span className="daily-challenge__check" aria-label={t('daily.completed', 'Completed')}>
                    ✓
                  </span>
                ) : (
                  <span className="daily-challenge__arrow" aria-label={t('daily.play', 'Play')}>
                    →
                  </span>
                )}
              </div>
              {streak.currentStreak > 0 && (
                <div className="daily-challenge__streak" title={t('daily.streak', 'Day streak')}>
                  <span className="daily-challenge__streak-icon">🔥</span>
                  <span className="daily-challenge__streak-count">{streak.currentStreak}</span>
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default DailyChallenge;
