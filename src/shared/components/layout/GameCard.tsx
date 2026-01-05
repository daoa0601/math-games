import { memo } from 'react';
import { Link } from 'react-router-dom';
import { MagicGraphIcon, SequenceRaceIcon, ShapeArchitectIcon } from '@/shared/components/icons';
import { CompactProgressRing } from '@/shared/components/ui/ProgressRing';

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
}: GameCardProps) {
  const IconComponent = iconMap[id];
  const gameNumber = GAME_NUMBERS[id];

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
          <CompactProgressRing
            completed={progress.completed}
            total={progress.total}
            size={36}
          />
        </div>
      )}

      {/* Number (right) */}
      <span className="slab__number">{gameNumber}</span>
    </>
  );

  if (disabled) {
    return (
      <div className="slab slab--disabled">
        {content}
      </div>
    );
  }

  return (
    <Link to={to} className="slab">
      {content}
    </Link>
  );
});
