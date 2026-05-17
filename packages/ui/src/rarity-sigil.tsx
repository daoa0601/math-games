import { cn } from './cn'

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary'

interface RaritySigilProps {
  rarity: Rarity
  locked?: boolean
  className?: string
  title?: string
}

const RARITY_COLOR: Record<Rarity, string> = {
  common: 'text-muted-foreground',
  rare: 'text-(--chart-2)',
  epic: 'text-(--chart-3)',
  legendary: 'text-(--rank-gold)',
}

function Shape({ rarity, locked }: { rarity: Rarity; locked: boolean }) {
  const strokeWidth = 4
  const stroke = 'currentColor'
  const fill = locked ? 'none' : 'currentColor'

  if (rarity === 'common') {
    return (
      <circle
        cx="24"
        cy="24"
        r="14"
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    )
  }

  if (rarity === 'rare') {
    return (
      <rect
        x="10"
        y="10"
        width="28"
        height="28"
        rx="5"
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    )
  }

  if (rarity === 'epic') {
    return (
      <path
        d="M 24 8 L 40 38 L 8 38 Z"
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    )
  }

  return (
    <path
      d="M 24 6 L 39 15 L 39 33 L 24 42 L 9 33 L 9 15 Z"
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
    />
  )
}

export function RaritySigil({
  rarity,
  locked = false,
  className,
  title,
}: RaritySigilProps) {
  return (
    <svg
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      viewBox="0 0 48 48"
      className={cn(RARITY_COLOR[rarity], className)}
    >
      {title ? <title>{title}</title> : null}
      <Shape rarity={rarity} locked={locked} />
    </svg>
  )
}
