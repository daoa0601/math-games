import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LearnModal, type GameId } from '@/shared/components/LearnModal';
import './LearnTab.css';

interface GameCardConfig {
  id: GameId;
  icon: string;
  color: string;
  taglineKey: string;
}

const GAMES: GameCardConfig[] = [
  {
    id: 'magic-graph',
    icon: '✨',
    color: 'var(--color-magic)',
    taglineKey: 'learn.magicGraph.tagline',
  },
  {
    id: 'sequence-race',
    icon: '🏃',
    color: 'var(--color-primary)',
    taglineKey: 'learn.sequenceRace.tagline',
  },
  {
    id: 'shape-architect',
    icon: '🏗️',
    color: 'var(--game-build-primary)',
    taglineKey: 'learn.shapeArchitect.tagline',
  },
];

/**
 * LearnTab
 *
 * Dashboard tab that displays game cards for learning about
 * the mathematical concepts behind each game.
 */
export function LearnTab() {
  const { t } = useTranslation();
  const [selectedGame, setSelectedGame] = useState<GameId | null>(null);

  return (
    <div
      role="tabpanel"
      id="tabpanel-learn"
      aria-labelledby="tab-learn"
      className="learn-tab"
    >
      <p className="learn-tab__intro">{t('learn.intro')}</p>

      <div className="learn-tab__grid">
        {GAMES.map((game) => (
          <button
            key={game.id}
            className="learn-card"
            onClick={() => setSelectedGame(game.id)}
            style={{ '--card-accent': game.color } as React.CSSProperties}
            aria-label={`${t(`games.${game.id.replace('-', '')}.title`)} - ${t(game.taglineKey)}`}
          >
            <span className="learn-card__icon" aria-hidden="true">
              {game.icon}
            </span>
            <span className="learn-card__title">
              {t(`games.${game.id.replace('-', '')}.title`)}
            </span>
            <span className="learn-card__tagline">{t(game.taglineKey)}</span>
          </button>
        ))}
      </div>

      <LearnModal
        gameId={selectedGame}
        isOpen={!!selectedGame}
        onClose={() => setSelectedGame(null)}
      />
    </div>
  );
}

export default LearnTab;
