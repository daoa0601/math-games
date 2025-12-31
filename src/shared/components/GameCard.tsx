import { Link } from 'react-router-dom';

interface GameCardProps {
  title: string;
  description: string;
  icon: string;
  tags: string[];
  to: string;
  disabled?: boolean;
}

export function GameCard({ title, description, icon, tags, to, disabled }: GameCardProps) {
  const content = (
    <>
      <div className="game-card__icon">{icon}</div>
      <h3 className="game-card__title">{title}</h3>
      <p className="game-card__description">{description}</p>
      <div className="game-card__tags">
        {tags.map((tag) => (
          <span key={tag} className="tag">{tag}</span>
        ))}
      </div>
      {disabled && (
        <span className="tag" style={{ marginTop: '0.5rem', background: 'hsla(0,0%,50%,0.2)' }}>
          Coming Soon
        </span>
      )}
    </>
  );

  if (disabled) {
    return <div className="game-card" style={{ opacity: 0.6, cursor: 'not-allowed' }}>{content}</div>;
  }

  return (
    <Link to={to} className="game-card" style={{ textDecoration: 'none' }}>
      {content}
    </Link>
  );
}
