import { memo } from 'react';
import { Link } from 'react-router-dom';
import { MagicGraphIcon, SequenceRaceIcon, ShapeArchitectIcon } from './icons';
import { CompactProgressRing } from './ProgressRing';

type GameId = 'magicGraph' | 'sequenceRace' | 'shapeArchitect';

interface GameCardProps {
  id: GameId;
  title: string;
  description: string;
  icon: string; // Kept for fallback, but we use custom icons
  tags: string[];
  to: string;
  disabled?: boolean;
  progress?: {
    completed: number;
    total: number;
  };
  isNew?: boolean;
}

const iconMap: Record<GameId, React.ComponentType<{ size?: number; className?: string }>> = {
  magicGraph: MagicGraphIcon,
  sequenceRace: SequenceRaceIcon,
  shapeArchitect: ShapeArchitectIcon,
};

// Memoized to prevent re-renders when parent state changes (e.g., achievements gallery toggle)
export const GameCard = memo(function GameCard({
  id,
  title,
  description,
  tags,
  to,
  disabled,
  progress,
  isNew,
}: GameCardProps) {
  const IconComponent = iconMap[id];

  const content = (
    <>
      {/* Progress indicator in corner */}
      {progress && progress.total > 0 && (
        <div className="game-card__progress">
          <CompactProgressRing
            completed={progress.completed}
            total={progress.total}
            size={48}
          />
        </div>
      )}

      {/* Custom SVG Icon */}
      <div className="game-card__icon">
        {IconComponent ? (
          <IconComponent size={56} />
        ) : (
          <span style={{ fontSize: '2.5rem' }}>🎮</span>
        )}
      </div>

      <h3 className="game-card__title">
        {title}
        {isNew && <span className="tag tag--new" style={{ marginLeft: '0.5rem', fontSize: '0.65rem' }}>NEW</span>}
      </h3>

      <p className="game-card__description">{description}</p>

      <div className="game-card__tags">
        {tags.map((tag) => (
          <span key={tag} className="tag">
            {tag}
          </span>
        ))}
      </div>

      {disabled && (
        <div className="game-card__disabled-overlay">
          <span className="tag" style={{ background: 'hsla(220, 10%, 50%, 0.2)', color: 'var(--text-muted)' }}>
            Coming Soon
          </span>
        </div>
      )}
    </>
  );

  if (disabled) {
    return (
      <div
        className="game-card game-card--disabled"
        style={{ opacity: 0.6, cursor: 'not-allowed' }}
      >
        {content}
      </div>
    );
  }

  return (
    <Link to={to} className="game-card">
      {content}
    </Link>
  );
});
