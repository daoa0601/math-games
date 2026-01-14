import { memo } from 'react';
import { Link } from 'react-router-dom';
import { MagicGraphIcon, SequenceRaceIcon, ShapeArchitectIcon } from '@/shared/components/icons';
import { Progress } from '@/shared/components/ui/shadcn';

type GameId = 'magicGraph' | 'sequenceRace' | 'shapeArchitect';

export interface GameCardProps {
  id: GameId;
  title: string;
  description: string;
  icon: string;
  tags: string[];
  to: string;
  disabled?: boolean;
  progress?: {
    completed: number;
    total: number;
  };
  isNew?: boolean;
  showPattern?: boolean;
}

const iconMap: Record<GameId, React.ComponentType<{ size?: number; className?: string }>> = {
  magicGraph: MagicGraphIcon,
  sequenceRace: SequenceRaceIcon,
  shapeArchitect: ShapeArchitectIcon,
};

// Number glyphs for editorial style
const GAME_NUMBERS: Record<GameId, string> = {
  magicGraph: '01',
  sequenceRace: '02',
  shapeArchitect: '03',
};

export const GameCard = memo(function GameCard({
  id,
  title,
  description,
  tags,
  to,
  disabled,
  progress,
  showPattern = false,
}: GameCardProps) {
  const IconComponent = iconMap[id];
  const gameNumber = GAME_NUMBERS[id];

  const cardClasses = disabled
    ? 'slab slab--disabled'
    : 'slab glow-emerald border-gold-accent';

  const patternClasses = showPattern ? 'pattern-lacquer' : '';

  const content = (
    <>
      {/* Icon (left) */}
      <div className="slab__glyph">
        {IconComponent ? <IconComponent size={32} /> : '◆'}
      </div>

      {/* Content (middle) */}
      <div className="slab__content">
        <h3 className="slab__title">{title}</h3>
        <div className="slab__meta">
          {tags.join(' · ')} {description && `· ${description}`}
        </div>
      </div>

      {/* Progress (optional) */}
      {progress && progress.total > 0 && (
        <div className="slab__progress">
          <div className="slab__progress-indicator">
            <Progress
              value={(progress.completed / progress.total) * 100}
              showLabel
              className="slab__progress-bar"
            />
            <span className="slab__progress-fraction">
              {progress.completed}/{progress.total}
            </span>
          </div>
        </div>
      )}

      {/* Number (right) */}
      <span className="slab__number">{gameNumber}</span>

      {/* Vietnamese corner decorations */}
      <div className="slab__corner slab__corner--tl"></div>
      <div className="slab__corner slab__corner--tr"></div>
      <div className="slab__corner slab__corner--bl"></div>
      <div className="slab__corner slab__corner--br"></div>
    </>
  );

  // Convert camelCase id to kebab-case for data-game attribute
  const gameSlug = id.replace(/([A-Z])/g, '-$1').toLowerCase();

  if (disabled) {
    return (
      <div className={`${cardClasses} ${patternClasses}`} data-testid={`game-card-${id}`} data-game={gameSlug}>
        {content}
      </div>
    );
  }

  return (
    <Link to={to} className={`${cardClasses} ${patternClasses}`} data-testid={`game-card-${id}`} data-game={gameSlug}>
      {content}
    </Link>
  );
});
