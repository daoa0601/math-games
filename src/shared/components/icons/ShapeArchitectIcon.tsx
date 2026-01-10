interface IconProps {
  size?: number;
  className?: string;
}

export function ShapeArchitectIcon({ size = 64, className = '' }: IconProps) {
  // Vietnamese Premium: Teal blocks, gold accents, navy background
  const bgColor = '#1b263b';
  const blockColor = '#2dd4bf';
  const blockDark = '#0f766e';
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

      {/* Grid pattern with gold */}
      <g stroke={goldColor} strokeWidth="1" opacity="0.2">
        <line x1="0" y1="16" x2="64" y2="16" />
        <line x1="0" y1="32" x2="64" y2="32" />
        <line x1="0" y1="48" x2="64" y2="48" />
        <line x1="16" y1="0" x2="16" y2="64" />
        <line x1="32" y1="0" x2="32" y2="64" />
        <line x1="48" y1="0" x2="48" y2="64" />
      </g>

      {/* Isometric block stack */}

      {/* Bottom row - 2 blocks */}
      <g>
        {/* Block 1 - bottom left */}
        <polygon points="16,48 28,42 28,34 16,40" fill={blockDark} />
        <polygon points="28,42 40,48 40,40 28,34" fill={blockColor} />
        <polygon points="16,48 28,54 40,48 28,42" fill={goldColor} fillOpacity="0.2" />
        <polygon points="16,48 28,54 40,48 28,42" stroke={goldColor} strokeWidth="1" fill="none" opacity="0.5" />

        {/* Block 2 - bottom right */}
        <polygon points="28,48 40,42 40,34 28,40" fill={blockDark} />
        <polygon points="40,42 52,48 52,40 40,34" fill={blockColor} />
        <polygon points="28,48 40,54 52,48 40,42" fill={goldColor} fillOpacity="0.2" />
        <polygon points="28,48 40,54 52,48 40,42" stroke={goldColor} strokeWidth="1" fill="none" opacity="0.5" />
      </g>

      {/* Middle row - 1 block */}
      <g>
        <polygon points="22,40 34,34 34,26 22,32" fill={blockDark} />
        <polygon points="34,34 46,40 46,32 34,26" fill={blockColor} />
        <polygon points="22,40 34,46 46,40 34,34" fill={goldColor} fillOpacity="0.2" />
        <polygon points="22,40 34,46 46,40 34,34" stroke={goldColor} strokeWidth="1" fill="none" opacity="0.5" />
      </g>

      {/* Top row - 1 block */}
      <g>
        <polygon points="28,32 40,26 40,18 28,24" fill={blockDark} />
        <polygon points="40,26 52,32 52,24 40,18" fill={blockColor} />
        <polygon points="28,32 40,38 52,32 40,26" fill={goldColor} fillOpacity="0.2" />
        <polygon points="28,32 40,38 52,32 40,26" stroke={goldColor} strokeWidth="1" fill="none" opacity="0.5" />
      </g>

      {/* Target outline - where next block goes */}
      <polygon
        points="10,40 22,34 22,26 10,32"
        stroke={goldColor}
        strokeWidth="1"
        strokeDasharray="2 2"
        fill="none"
        opacity="0.7"
      />
    </svg>
  );
}
