interface IconProps {
  size?: number;
  className?: string;
}

export function ShapeArchitectIcon({ size = 64, className = '' }: IconProps) {
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
        <linearGradient id="blockPink" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f472b6" />
          <stop offset="100%" stopColor="#db2777" />
        </linearGradient>
        <linearGradient id="blockMint" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <linearGradient id="blockYellow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
        <linearGradient id="blockBlue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
        <linearGradient id="blockPurple" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id="workshopBg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="100%" stopColor="#fde68a" />
        </linearGradient>
      </defs>

      {/* Workshop background */}
      <rect x="2" y="2" width="60" height="60" rx="12" fill="url(#workshopBg)" />

      {/* Blueprint grid pattern */}
      <g stroke="#93c5fd" strokeWidth="0.5" opacity="0.3">
        <line x1="2" y1="12" x2="62" y2="12" />
        <line x1="2" y1="22" x2="62" y2="22" />
        <line x1="2" y1="32" x2="62" y2="32" />
        <line x1="2" y1="42" x2="62" y2="42" />
        <line x1="2" y1="52" x2="62" y2="52" />
        <line x1="12" y1="2" x2="12" y2="62" />
        <line x1="22" y1="2" x2="22" y2="62" />
        <line x1="32" y1="2" x2="32" y2="62" />
        <line x1="42" y1="2" x2="42" y2="62" />
        <line x1="52" y1="2" x2="52" y2="62" />
      </g>

      {/* 3D Block Stack - Isometric view */}

      {/* Bottom row - Pink L-shape */}
      <g>
        {/* Block 1 */}
        <path d="M16 48 L24 44 L24 36 L16 40 Z" fill="url(#blockPink)" />
        <path d="M24 44 L32 48 L32 40 L24 36 Z" fill="#f9a8d4" />
        <path d="M16 48 L24 52 L32 48 L24 44 Z" fill="#fce7f3" />

        {/* Block 2 */}
        <path d="M24 48 L32 44 L32 36 L24 40 Z" fill="url(#blockPink)" />
        <path d="M32 44 L40 48 L40 40 L32 36 Z" fill="#f9a8d4" />
        <path d="M24 48 L32 52 L40 48 L32 44 Z" fill="#fce7f3" />
      </g>

      {/* Middle row - Mint blocks */}
      <g>
        {/* Block on top of pink */}
        <path d="M20 40 L28 36 L28 28 L20 32 Z" fill="url(#blockMint)" />
        <path d="M28 36 L36 40 L36 32 L28 28 Z" fill="#6ee7b7" />
        <path d="M20 40 L28 44 L36 40 L28 36 Z" fill="#d1fae5" />
      </g>

      {/* Yellow block - standalone */}
      <g>
        <path d="M38 44 L46 40 L46 32 L38 36 Z" fill="url(#blockYellow)" />
        <path d="M46 40 L54 44 L54 36 L46 32 Z" fill="#fcd34d" />
        <path d="M38 44 L46 48 L54 44 L46 40 Z" fill="#fef3c7" />
      </g>

      {/* Top blocks - Blue */}
      <g>
        <path d="M24 32 L32 28 L32 20 L24 24 Z" fill="url(#blockBlue)" />
        <path d="M32 28 L40 32 L40 24 L32 20 Z" fill="#93c5fd" />
        <path d="M24 32 L32 36 L40 32 L32 28 Z" fill="#dbeafe" />
      </g>

      {/* Floating block being placed - Purple with animation */}
      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 0; 0 -3; 0 0"
          dur="1.5s"
          repeatCount="indefinite"
        />
        <path d="M40 24 L48 20 L48 12 L40 16 Z" fill="url(#blockPurple)" />
        <path d="M48 20 L56 24 L56 16 L48 12 Z" fill="#c4b5fd" />
        <path d="M40 24 L48 28 L56 24 L48 20 Z" fill="#ede9fe" />

        {/* Sparkle effect */}
        <circle cx="52" cy="10" r="2" fill="#fbbf24">
          <animate attributeName="opacity" values="1;0;1" dur="1s" repeatCount="indefinite" />
          <animate attributeName="r" values="2;3;2" dur="1s" repeatCount="indefinite" />
        </circle>
      </g>

      {/* Small builder character */}
      <g>
        {/* Hard hat */}
        <ellipse cx="10" cy="24" rx="5" ry="2" fill="#fbbf24" />
        <rect x="6" y="22" width="8" height="3" rx="1" fill="#f59e0b" />

        {/* Face */}
        <circle cx="10" cy="28" r="4" fill="#fcd34d" />
        <circle cx="8.5" cy="27" r="0.8" fill="#1e293b" />
        <circle cx="11.5" cy="27" r="0.8" fill="#1e293b" />
        <path d="M8 29.5 Q10 31 12 29.5" stroke="#1e293b" strokeWidth="1" fill="none" />

        {/* Body */}
        <rect x="7" y="32" width="6" height="8" rx="2" fill="#3b82f6" />

        {/* Arm pointing up */}
        <line x1="13" y1="34" x2="18" y2="28" stroke="#fcd34d" strokeWidth="2" strokeLinecap="round" />
      </g>
    </svg>
  );
}
