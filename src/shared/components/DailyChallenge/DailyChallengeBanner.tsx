import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getTodayCompletions, isAllGamesCompletedToday } from '@/shared/services/daily';
import type { StorageGameId } from '@/shared/schemas';
import './DailyChallengeBanner.css';

interface GameInfo {
  id: StorageGameId;
  path: string;
  icon: string;
}

const GAMES: GameInfo[] = [
  { id: 'magic-graph', path: '/magic-graph?daily=true', icon: '✨' },
  { id: 'sequence-race', path: '/sequence-race?daily=true', icon: '🏃' },
  // ShapeArchitect removed until fixed
];

interface DailyChallengeBannerProps {
  countdown: string;
  className?: string;
}

export function DailyChallengeBanner({ countdown, className = '' }: DailyChallengeBannerProps) {
  const { t } = useTranslation();

  const completions = useMemo(() => getTodayCompletions(), []);
  const allCompleted = useMemo(() => isAllGamesCompletedToday(), []);

  // Convert Map to Set of completed game IDs
  const completedGames = useMemo(() => {
    const completed: StorageGameId[] = [];
    completions.forEach((completion, gameId) => {
      if (completion !== null) {
        completed.push(gameId);
      }
    });
    return new Set(completed);
  }, [completions]);

  return (
    <div className={`daily-challenge-banner ${allCompleted ? 'daily-challenge-banner--completed' : ''} ${className}`} data-testid="daily-challenge-banner">
      <div className="daily-challenge-banner__header">
        <span className="daily-challenge-banner__icon">📅</span>
        <span className="daily-challenge-banner__title">{t('daily.title')}</span>
        {allCompleted && (
          <span className="daily-challenge-banner__done-badge">{t('daily.allComplete')}</span>
        )}
      </div>
      <div className="daily-challenge-banner__games">
        {GAMES.map((game) => {
          const isCompleted = completedGames.has(game.id);
          return (
            <Link
              key={game.id}
              to={game.path}
              className={`daily-challenge-banner__dot ${isCompleted ? 'daily-challenge-banner__dot--completed' : ''}`}
              title={t(`games.${game.id === 'magic-graph' ? 'magicGraph' : game.id === 'sequence-race' ? 'sequenceRace' : 'shapeArchitect'}.title`)}
              data-testid={`daily-challenge-${game.id}`}
            >
              <span className="daily-challenge-banner__dot-icon">{game.icon}</span>
            </Link>
          );
        })}
      </div>
      <div className="daily-challenge-banner__countdown">
        <span className="daily-challenge-banner__countdown-label">{t('daily.resetsIn')}</span>
        <span className="daily-challenge-banner__countdown-time">{countdown}</span>
      </div>
    </div>
  );
}
