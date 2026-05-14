import { cn } from '@/lib/utils'

type PatternType = 'triangles' | 'arrows' | 'grid'

interface GamePatternProps {
  pattern: PatternType
  className?: string
}

function TrianglePattern() {
  return (
    <pattern id="pat-triangles" width="40" height="35" patternUnits="userSpaceOnUse">
      <polygon points="20,0 40,35 0,35" fill="none" stroke="currentColor" strokeWidth="0.5" />
    </pattern>
  )
}

function ArrowPattern() {
  return (
    <pattern id="pat-arrows" width="30" height="30" patternUnits="userSpaceOnUse">
      <polyline points="8,22 15,8 22,22" fill="none" stroke="currentColor" strokeWidth="0.6" strokeLinecap="round" />
    </pattern>
  )
}

function GridPattern() {
  return (
    <pattern id="pat-grid" width="24" height="24" patternUnits="userSpaceOnUse">
      <rect x="2" y="2" width="20" height="20" rx="3" fill="none" stroke="currentColor" strokeWidth="0.5" />
    </pattern>
  )
}

const patterns: Record<PatternType, { Pattern: () => React.JSX.Element; id: string }> = {
  triangles: { Pattern: TrianglePattern, id: 'pat-triangles' },
  arrows: { Pattern: ArrowPattern, id: 'pat-arrows' },
  grid: { Pattern: GridPattern, id: 'pat-grid' },
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
