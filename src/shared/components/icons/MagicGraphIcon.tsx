interface IconProps {
  size?: number;
  className?: string;
}

export function MagicGraphIcon({ size = 64, className = '' }: IconProps) {
  // Linear Editorial: Violet nodes, navy lines, white numbers
  const nodeColor = '#a78bfa';
  const lineColor = '#1e3a5f';
  const textColor = '#f8fafc';
  const bgColor = '#111827';

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
      {/* Background */}
      <rect width="64" height="64" fill={bgColor} />

      {/* Connection lines */}
      <g stroke={lineColor} strokeWidth="2">
        <line x1="16" y1="20" x2="32" y2="12" />
        <line x1="32" y1="12" x2="48" y2="20" />
        <line x1="16" y1="20" x2="16" y2="44" />
        <line x1="48" y1="20" x2="48" y2="44" />
        <line x1="16" y1="44" x2="32" y2="52" />
        <line x1="48" y1="44" x2="32" y2="52" />
        <line x1="16" y1="20" x2="32" y2="32" />
        <line x1="48" y1="20" x2="32" y2="32" />
        <line x1="32" y1="32" x2="32" y2="52" />
      </g>

      {/* Nodes */}
      <g>
        <circle cx="32" cy="12" r="6" fill={nodeColor} />
        <text x="32" y="15" textAnchor="middle" fill={textColor} fontSize="8" fontWeight="600">3</text>

        <circle cx="16" cy="20" r="6" fill={nodeColor} />
        <text x="16" y="23" textAnchor="middle" fill={textColor} fontSize="8" fontWeight="600">5</text>

        <circle cx="48" cy="20" r="6" fill={nodeColor} />
        <text x="48" y="23" textAnchor="middle" fill={textColor} fontSize="8" fontWeight="600">1</text>

        <circle cx="32" cy="32" r="7" fill={textColor} />
        <text x="32" y="35" textAnchor="middle" fill={bgColor} fontSize="9" fontWeight="600">4</text>

        <circle cx="16" cy="44" r="6" fill={nodeColor} />
        <text x="16" y="47" textAnchor="middle" fill={textColor} fontSize="8" fontWeight="600">2</text>

        <circle cx="48" cy="44" r="6" fill={nodeColor} />
        <text x="48" y="47" textAnchor="middle" fill={textColor} fontSize="8" fontWeight="600">6</text>

        <circle cx="32" cy="52" r="6" fill={nodeColor} />
        <text x="32" y="55" textAnchor="middle" fill={textColor} fontSize="8" fontWeight="600">7</text>
      </g>
    </svg>
  );
}
