interface IconProps {
  size?: number;
  className?: string;
}

export function MagicGraphIcon({ size = 64, className = '' }: IconProps) {
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
      {/* Background glow */}
      <defs>
        <radialGradient id="magicGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#a855f7" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="nodeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.3" />
          <stop offset="50%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.3" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background circle */}
      <circle cx="32" cy="32" r="30" fill="url(#magicGlow)" />

      {/* Connection lines */}
      <g stroke="url(#lineGradient)" strokeWidth="2" strokeLinecap="round">
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

      {/* Nodes with glow */}
      <g filter="url(#glow)">
        {/* Top node */}
        <circle cx="32" cy="12" r="6" fill="url(#nodeGradient)" />
        <text x="32" y="15" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">3</text>

        {/* Left top node */}
        <circle cx="16" cy="20" r="6" fill="url(#nodeGradient)" />
        <text x="16" y="23" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">5</text>

        {/* Right top node */}
        <circle cx="48" cy="20" r="6" fill="url(#nodeGradient)" />
        <text x="48" y="23" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">1</text>

        {/* Center node */}
        <circle cx="32" cy="32" r="7" fill="#fbbf24" />
        <text x="32" y="35" textAnchor="middle" fill="#7c3aed" fontSize="9" fontWeight="bold">4</text>

        {/* Left bottom node */}
        <circle cx="16" cy="44" r="6" fill="url(#nodeGradient)" />
        <text x="16" y="47" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">2</text>

        {/* Right bottom node */}
        <circle cx="48" cy="44" r="6" fill="url(#nodeGradient)" />
        <text x="48" y="47" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">6</text>

        {/* Bottom node */}
        <circle cx="32" cy="52" r="6" fill="url(#nodeGradient)" />
        <text x="32" y="55" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">7</text>
      </g>

      {/* Sparkles */}
      <g fill="#fbbf24">
        <circle cx="8" cy="8" r="1.5">
          <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="56" cy="10" r="1">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="54" cy="54" r="1.5">
          <animate attributeName="opacity" values="1;0.5;1" dur="2.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="10" cy="52" r="1">
          <animate attributeName="opacity" values="0.5;1;0.5" dur="1.8s" repeatCount="indefinite" />
        </circle>
      </g>
    </svg>
  );
}
