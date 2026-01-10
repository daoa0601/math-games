interface IconProps {
  size?: number;
  className?: string;
}

export function SequenceRaceIcon({ size = 64, className = '' }: IconProps) {
  // Vietnamese Premium: Amber track, gold accents, navy background
  const bgColor = '#1b263b';
  const trackColor = '#fbbf24';
  const figureColor = '#f1f5f9';
  const goldColor = '#d4af37';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Background with gold border */}
      <rect width="64" height="64" fill={bgColor} />
      <rect width="64" height="64" fill="none" stroke={goldColor} strokeWidth="1" opacity="0.3" />

      {/* Track line */}
      <rect x="6" y="44" width="52" height="4" fill={goldColor} opacity="0.3" />

      {/* Track markers */}
      <g fill={trackColor}>
        <rect x="10" y="42" width="2" height="8" />
        <rect x="22" y="42" width="2" height="8" />
        <rect x="34" y="42" width="2" height="8" />
        <rect x="46" y="42" width="2" height="8" />
      </g>

      {/* Number labels */}
      <g fill={figureColor} fontSize="7" fontWeight="600" textAnchor="middle">
        <text x="11" y="56">1</text>
        <text x="23" y="56">2</text>
        <text x="35" y="56">3</text>
        <text x="47" y="56">4</text>
      </g>

      {/* Stick figure runner */}
      <g stroke={figureColor} strokeWidth="2" strokeLinecap="round">
        {/* Head */}
        <circle cx="24" cy="18" r="5" fill={figureColor} />

        {/* Body */}
        <line x1="24" y1="23" x2="24" y2="34" />

        {/* Arms - running pose */}
        <line x1="24" y1="26" x2="18" y2="30" />
        <line x1="24" y1="26" x2="30" y2="22" />

        {/* Legs - running pose */}
        <line x1="24" y1="34" x2="18" y2="42" />
        <line x1="24" y1="34" x2="30" y2="42" />
      </g>

      {/* Finish flag */}
      <g>
        <rect x="54" y="22" width="2" height="20" fill={goldColor} opacity="0.5" />
        <rect x="56" y="22" width="6" height="8" fill={figureColor} />
        <rect x="56" y="22" width="3" height="4" fill={bgColor} />
        <rect x="59" y="26" width="3" height="4" fill={bgColor} />
      </g>
    </svg>
  );
}
