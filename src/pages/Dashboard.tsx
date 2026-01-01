import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { GameCard, LanguageSwitcher, PlayerProfileCard, AchievementsGallery, DailyChallenge } from '../shared/components';
import { usePlayer } from '../shared/contexts';
import { getProgress, type GameId as StorageGameId } from '../shared/utils';

type GameId = 'magicGraph' | 'sequenceRace' | 'shapeArchitect';

// Map display IDs to storage IDs
const storageIdMap: Record<GameId, StorageGameId> = {
  magicGraph: 'magic-graph',
  sequenceRace: 'sequence-race',
  shapeArchitect: 'shape-architect',
};

// Approximate total levels per game (used for progress display)
const gameTotals: Record<GameId, number> = {
  magicGraph: 15,
  sequenceRace: 12,
  shapeArchitect: 10,
};

interface GameConfig {
  id: GameId;
  to: string;
  isNew?: boolean;
}

const gameConfigs: GameConfig[] = [
  { id: 'magicGraph', to: '/magic-graph' },
  { id: 'sequenceRace', to: '/sequence-race' },
  { id: 'shapeArchitect', to: '/shape-architect', isNew: true },
];

export function Dashboard() {
  const { t } = useTranslation();
  const {
    profile,
    currentRankInfo,
    nextRank,
    rankProgress,
    updateDisplayName,
    getRecentAchievements,
    checkStreak,
  } = usePlayer();

  // State for achievements gallery expansion
  const [isAchievementsExpanded, setIsAchievementsExpanded] = useState(false);

  // Check streak on dashboard load
  useEffect(() => {
    checkStreak();
  }, [checkStreak]);

  // Memoize progress calculations to prevent repeated localStorage reads
  const gameProgress = useMemo(() => {
    const getProgressForGame = (id: GameId) => {
      const storageId = storageIdMap[id];
      const progress = getProgress(storageId);
      return {
        completed: progress.completedLevels.size,
        total: gameTotals[id],
      };
    };
    return {
      magicGraph: getProgressForGame('magicGraph'),
      sequenceRace: getProgressForGame('sequenceRace'),
      shapeArchitect: getProgressForGame('shapeArchitect'),
    };
  }, []); // Only calculate once on mount

  const games = gameConfigs.map((config) => ({
    id: config.id,
    title: t(`games.${config.id}.title`),
    description: t(`games.${config.id}.description`),
    icon: '', // Deprecated, using custom SVG icons now
    tags: t(`games.${config.id}.tags`, { returnObjects: true }) as string[],
    to: config.to,
    disabled: false,
    isNew: config.isNew,
    progress: gameProgress[config.id],
  }));

  const recentAchievements = getRecentAchievements(3);

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <div className="dashboard__header-top">
          <LanguageSwitcher />
        </div>
        <h1 className="dashboard__title">{t('appTitle')}</h1>
        <p className="dashboard__subtitle">{t('appSubtitle')}</p>
      </header>

      {/* Player Profile Section */}
      <PlayerProfileCard
        profile={profile}
        rankInfo={currentRankInfo}
        nextRank={nextRank}
        rankProgress={rankProgress}
        recentAchievements={recentAchievements}
        onUpdateName={updateDisplayName}
        className="dashboard__profile"
      />

      {/* Daily Challenge Section */}
      <DailyChallenge className="dashboard__daily" />

      {/* Achievements Gallery */}
      <AchievementsGallery
        unlockedAchievementIds={profile.achievements}
        isExpanded={isAchievementsExpanded}
        onToggle={() => setIsAchievementsExpanded(!isAchievementsExpanded)}
      />

      <div className="game-grid">
        {games.map((game) => (
          <GameCard key={game.id} {...game} />
        ))}
      </div>
    </div>
  );
}
