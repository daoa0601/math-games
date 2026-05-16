import { cn } from './cn'

export type PatternType =
  | 'triangles'
  | 'constellation'
  | 'arrows'
  | 'grid'
  | 'blueprint'
  | 'magnifier'

interface GamePatternProps {
  pattern: PatternType
  className?: string
}

function TrianglePattern() {
  return (
    <pattern
      id="pat-triangles"
      width="40"
      height="35"
      patternUnits="userSpaceOnUse"
    >
      <polygon
        points="20,0 40,35 0,35"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.5"
      />
    </pattern>
  )
}

function ConstellationPattern() {
  return (
    <pattern
      id="pat-constellation"
      width="60"
      height="60"
      patternUnits="userSpaceOnUse"
    >
      <circle cx="10" cy="10" r="1.5" fill="currentColor" />
      <circle cx="45" cy="15" r="1" fill="currentColor" />
      <circle cx="30" cy="40" r="1.5" fill="currentColor" />
      <circle cx="55" cy="50" r="1" fill="currentColor" />
      <line x1="10" y1="10" x2="45" y2="15" stroke="currentColor" strokeWidth="0.3" />
      <line x1="45" y1="15" x2="30" y2="40" stroke="currentColor" strokeWidth="0.3" />
      <line x1="30" y1="40" x2="55" y2="50" stroke="currentColor" strokeWidth="0.3" />
      <line x1="10" y1="10" x2="30" y2="40" stroke="currentColor" strokeWidth="0.2" strokeDasharray="2 3" />
    </pattern>
  )
}

function ArrowPattern() {
  return (
    <pattern
      id="pat-arrows"
      width="30"
      height="30"
      patternUnits="userSpaceOnUse"
    >
      <polyline
        points="8,15 22,15"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.5"
        strokeLinecap="round"
      />
      <polyline
        points="17,10 22,15 17,20"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </pattern>
  )
}

function GridPattern() {
  return (
    <pattern id="pat-grid" width="24" height="24" patternUnits="userSpaceOnUse">
      <rect
        x="2"
        y="2"
        width="20"
        height="20"
        rx="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.5"
      />
    </pattern>
  )
}

function BlueprintPattern() {
  return (
    <pattern
      id="pat-blueprint"
      width="20"
      height="20"
      patternUnits="userSpaceOnUse"
    >
      <line x1="0" y1="0" x2="0" y2="20" stroke="currentColor" strokeWidth="0.3" />
      <line x1="0" y1="0" x2="20" y2="0" stroke="currentColor" strokeWidth="0.3" />
      <line x1="10" y1="0" x2="10" y2="20" stroke="currentColor" strokeWidth="0.15" />
      <line x1="0" y1="10" x2="20" y2="10" stroke="currentColor" strokeWidth="0.15" />
    </pattern>
  )
}

function MagnifierPattern() {
  return (
    <pattern
      id="pat-magnifier"
      width="50"
      height="50"
      patternUnits="userSpaceOnUse"
    >
      <circle cx="22" cy="22" r="10" fill="none" stroke="currentColor" strokeWidth="0.5" />
      <circle cx="22" cy="22" r="6" fill="none" stroke="currentColor" strokeWidth="0.3" />
      <line x1="29" y1="29" x2="40" y2="40" stroke="currentColor" strokeWidth="0.6" strokeLinecap="round" />
    </pattern>
  )
}

const patterns: Record<
  PatternType,
  { Pattern: () => React.JSX.Element; id: string }
> = {
  triangles: { Pattern: TrianglePattern, id: 'pat-triangles' },
  constellation: { Pattern: ConstellationPattern, id: 'pat-constellation' },
  arrows: { Pattern: ArrowPattern, id: 'pat-arrows' },
  grid: { Pattern: GridPattern, id: 'pat-grid' },
  blueprint: { Pattern: BlueprintPattern, id: 'pat-blueprint' },
  magnifier: { Pattern: MagnifierPattern, id: 'pat-magnifier' },
}

export function GamePattern({ pattern, className }: GamePatternProps) {
  const { Pattern, id } = patterns[pattern]

  return (
    <svg
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-0 h-full w-full text-primary/[0.06] dark:text-primary/[0.10]',
        className,
      )}
    >
      <defs>
        <Pattern />
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  )
}
