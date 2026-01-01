interface IconProps {
  size?: number;
  className?: string;
}

export function SequenceRaceIcon({ size = 64, className = '' }: IconProps) {
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
      <defs>
        <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="100%" stopColor="#a7f3d0" />
        </linearGradient>
        <linearGradient id="trackGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#fb923c" />
        </linearGradient>
        <linearGradient id="runnerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>

      {/* Sky background */}
      <rect x="2" y="2" width="60" height="60" rx="12" fill="url(#skyGradient)" />

      {/* Clouds */}
      <g fill="white" opacity="0.8">
        <ellipse cx="12" cy="12" rx="6" ry="3" />
        <ellipse cx="16" cy="10" rx="4" ry="2.5" />
        <ellipse cx="50" cy="15" rx="5" ry="2.5" />
        <ellipse cx="54" cy="13" rx="3" ry="2" />
      </g>

      {/* Track */}
      <rect x="6" y="42" width="52" height="8" rx="4" fill="#d4a574" />
      <g stroke="white" strokeWidth="2" strokeDasharray="4 4" opacity="0.6">
        <line x1="10" y1="46" x2="54" y2="46" />
      </g>

      {/* Stepping stones with numbers */}
      <g>
        <circle cx="14" cy="46" r="5" fill="url(#trackGradient)" />
        <text x="14" y="49" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">1</text>

        <circle cx="26" cy="46" r="5" fill="url(#trackGradient)" />
        <text x="26" y="49" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">2</text>

        <circle cx="38" cy="46" r="5" fill="url(#trackGradient)" />
        <text x="38" y="49" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">3</text>

        <circle cx="50" cy="46" r="5" fill="#22c55e" />
        <text x="50" y="49" textAnchor="middle" fill="white" fontSize="6" fontWeight="bold">GO</text>
      </g>

      {/* Runner character */}
      <g>
        {/* Body */}
        <ellipse cx="22" cy="32" rx="6" ry="8" fill="url(#runnerGradient)" />

        {/* Head */}
        <circle cx="22" cy="22" r="6" fill="#fcd34d" />

        {/* Happy face */}
        <circle cx="20" cy="21" r="1" fill="#1e293b" />
        <circle cx="24" cy="21" r="1" fill="#1e293b" />
        <path d="M19 24 Q22 27 25 24" stroke="#1e293b" strokeWidth="1.5" fill="none" strokeLinecap="round" />

        {/* Arms */}
        <line x1="16" y1="30" x2="10" y2="24" stroke="url(#runnerGradient)" strokeWidth="3" strokeLinecap="round">
          <animate attributeName="y2" values="24;28;24" dur="0.3s" repeatCount="indefinite" />
        </line>
        <line x1="28" y1="30" x2="34" y2="24" stroke="url(#runnerGradient)" strokeWidth="3" strokeLinecap="round">
          <animate attributeName="y2" values="28;24;28" dur="0.3s" repeatCount="indefinite" />
        </line>

        {/* Legs */}
        <line x1="19" y1="38" x2="15" y2="42" stroke="url(#runnerGradient)" strokeWidth="3" strokeLinecap="round">
          <animate attributeName="x2" values="15;19;15" dur="0.3s" repeatCount="indefinite" />
        </line>
        <line x1="25" y1="38" x2="29" y2="42" stroke="url(#runnerGradient)" strokeWidth="3" strokeLinecap="round">
          <animate attributeName="x2" values="29;25;29" dur="0.3s" repeatCount="indefinite" />
        </line>
      </g>

      {/* Motion lines */}
      <g stroke="#f97316" strokeWidth="2" strokeLinecap="round" opacity="0.6">
        <line x1="8" y1="28" x2="4" y2="28">
          <animate attributeName="opacity" values="0.6;0.2;0.6" dur="0.5s" repeatCount="indefinite" />
        </line>
        <line x1="8" y1="32" x2="2" y2="32">
          <animate attributeName="opacity" values="0.2;0.6;0.2" dur="0.5s" repeatCount="indefinite" />
        </line>
        <line x1="8" y1="36" x2="4" y2="36">
          <animate attributeName="opacity" values="0.6;0.2;0.6" dur="0.5s" repeatCount="indefinite" />
        </line>
      </g>

      {/* Finish flag */}
      <g>
        <rect x="54" y="22" width="2" height="20" fill="#64748b" />
        <rect x="56" y="22" width="6" height="8" fill="white" />
        <rect x="56" y="22" width="3" height="4" fill="#1e293b" />
        <rect x="59" y="26" width="3" height="4" fill="#1e293b" />
      </g>
    </svg>
  );
}
