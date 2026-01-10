import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getDailyChallengeState } from '@/shared/services/daily';
import { getTodaySeed } from '@/shared/utils/seededRandom';
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
  { id: 'shape-architect', path: '/shape-architect?daily=true', icon: '🧱' },
];

interface DailyChallengeBannerProps {
  countdown: string;
  className?: string;
  /** Pass completion count to trigger re-render when games are completed */
  completionCount?: number;
}

export function DailyChallengeBanner({ countdown, className = '', completionCount = 0 }: DailyChallengeBannerProps) {
  const { t } = useTranslation();

  // Get all daily state in a single storage read and derive all values
  // This avoids N+1 pattern of calling getDailyChallengeState multiple times
  const { allCompleted, completedGames } = useMemo(() => {
    const state = getDailyChallengeState();
    const today = getTodaySeed();

    // Build completed games set from single state read
    const completed = new Set<StorageGameId>();
    for (const completion of state.completions) {
      if (completion.date === today && completion.completed) {
        completed.add(completion.gameId);
      }
    }

    // Check if all 3 games are completed
    const allDone = completed.size === 3;

    return {
      allCompleted: allDone,
      completedGames: completed,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completionCount]);

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
