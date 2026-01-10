import { useState, useEffect, useMemo, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { GameCard } from '@/shared/components/layout/GameCard';
import { DailyChallengeBanner } from '@/shared/components/DailyChallenge/DailyChallengeBanner';
import { getProgress } from '@/shared/utils/storage';
import { getTodayCompletions } from '@/shared/services/daily';
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

/**
 * Isolated countdown component - prevents re-rendering the entire PlayTab every second
 */
const DailyChallengeBannerWithCountdown = memo(function DailyChallengeBannerWithCountdown() {
  const [countdown, setCountdown] = useState(getTimeUntilMidnight());

  // Calculate completion count on each render - cheap operation (single localStorage read)
  // This ensures the banner updates when navigating back after completing a game
  const completions = getTodayCompletions();
  let completionCount = 0;
  completions.forEach((completion) => {
    if (completion !== null) completionCount++;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(getTimeUntilMidnight());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return <DailyChallengeBanner countdown={countdown} completionCount={completionCount} />;
});

/**
 * Memoized games grid - only re-renders when progress actually changes
 */
const GamesGrid = memo(function GamesGrid() {
  const { t } = useTranslation();

  // Get progress for each game - computed once on mount
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
    <div className="grid">
      {gamesWithProgress.map((game) => (
        <GameCard
          key={game.id}
          id={game.id}
          title={t(`games.${game.id}.title`)}
          description={t(`games.${game.id}.description`)}
          icon=""
          tags={game.tags}
          to={game.path}
          progress={game.progress}
          disabled={game.disabled}
        />
      ))}
    </div>
  );
});

export function PlayTab() {
  return (
    <div role="tabpanel" id="panel-home">
      {/* Games Grid - memoized to prevent re-renders from countdown */}
      <GamesGrid />

      {/* Daily Challenge Banner - isolated countdown updates */}
      <DailyChallengeBannerWithCountdown />
    </div>
  );
}
