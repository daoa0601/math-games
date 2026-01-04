import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { GameCard } from '@/shared/components/layout/GameCard';
import { DailyChallengeBanner } from '@/shared/components/DailyChallenge/DailyChallengeBanner';
import { getProgress } from '@/shared/utils/storage';
import { toStorageId } from '@/shared/types';
import type { ComponentGameId } from '@/shared/types';

interface GameConfig {
  id: ComponentGameId;
  path: string;
  tags: string[];
  levelCount: number;
  disabled?: boolean;
}

const GAME_CONFIGS: GameConfig[] = [
  {
    id: 'magicGraph',
    path: '/magic-graph',
    tags: ['puzzle', 'logic'],
    levelCount: 15,
  },
  {
    id: 'sequenceRace',
    path: '/sequence-race',
    tags: ['strategy', 'competitive'],
    levelCount: 12,
  },
  {
    id: 'shapeArchitect',
    path: '/shape-architect',
    tags: ['3D', 'spatial'],
    levelCount: 10,
    disabled: true,
  },
];

/**
 * Calculate time until midnight
 * @returns HH:MM:SS formatted string
 */
function getTimeUntilMidnight(): string {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);

  const diff = midnight.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function PlayTab() {
  const { t } = useTranslation();
  const [countdown, setCountdown] = useState(getTimeUntilMidnight());

  // Update countdown every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(getTimeUntilMidnight());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Get progress for each game
  const gamesWithProgress = useMemo(() => {
    return GAME_CONFIGS.map((config) => {
      const storageId = toStorageId[config.id];
      const progress = getProgress(storageId);
      const completed = progress.completedLevels.size;

      return {
        ...config,
        progress: {
          completed,
          total: config.levelCount,
        },
      };
    });
  }, []);

  return (
    <div role="tabpanel" id="tabpanel-play" aria-labelledby="tab-play">
      {/* Games Grid */}
      <div className="games-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 'var(--space-lg)',
        marginBottom: 'var(--space-xl)',
      }}>
        {gamesWithProgress.map((game) => (
          <GameCard
            key={game.id}
            id={game.id}
            title={t(`games.${game.id}.title`)}
            description={t(`games.${game.id}.description`)}
            icon="" // Using custom icons from GameCard component
            tags={game.tags}
            to={game.path}
            progress={game.progress}
            disabled={game.disabled}
          />
        ))}
      </div>

      {/* Daily Challenge Banner */}
      <DailyChallengeBanner countdown={countdown} />
    </div>
  );
}
