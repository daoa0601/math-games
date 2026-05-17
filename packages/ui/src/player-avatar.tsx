import { cn } from './cn'

interface PlayerAvatarProps {
  seed: string
  className?: string
  title?: string
}

const PALETTE = [
  'oklch(0.55 0.15 25)',
  'oklch(0.48 0.1 170)',
  'oklch(0.45 0.15 290)',
  'oklch(0.58 0.14 70)',
  'oklch(0.5 0.08 130)',
  'oklch(0.55 0.12 340)',
] as const

const SHAPES = ['circle', 'square', 'triangle', 'diamond'] as const
type ShapeKind = (typeof SHAPES)[number]

function hashSeed(seed: string): number {
  let h = 5381
  for (let i = 0; i < seed.length; i += 1) {
    h = ((h << 5) + h) ^ seed.charCodeAt(i)
  }
  return h >>> 0
}

function Shape({
  kind,
  cx,
  cy,
  size,
  color,
  rotate,
  opacity = 1,
}: {
  kind: ShapeKind
  cx: number
  cy: number
  size: number
  color: string
  rotate: number
  opacity?: number
}) {
  const r = size / 2
  const transform = `rotate(${rotate} ${cx} ${cy})`

  if (kind === 'circle') {
    return <circle cx={cx} cy={cy} r={r} fill={color} opacity={opacity} />
  }
  if (kind === 'square') {
    return (
      <rect
        x={cx - r}
        y={cy - r}
        width={size}
        height={size}
        rx={size * 0.15}
        fill={color}
        opacity={opacity}
        transform={transform}
      />
    )
  }
  if (kind === 'triangle') {
    const h = size * 0.92
    return (
      <path
        d={`M ${cx} ${cy - h / 2} L ${cx + r} ${cy + h / 2} L ${cx - r} ${
          cy + h / 2
        } Z`}
        fill={color}
        opacity={opacity}
        transform={transform}
      />
    )
  }
  return (
    <path
      d={`M ${cx} ${cy - r} L ${cx + r} ${cy} L ${cx} ${cy + r} L ${cx - r} ${cy} Z`}
      fill={color}
      opacity={opacity}
      transform={transform}
    />
  )
}

export function PlayerAvatar({ seed, className, title }: PlayerAvatarProps) {
  const h = hashSeed(seed || 'guest')

  const shapeA = SHAPES[h & 0x3]!
  const shapeB = SHAPES[(h >> 2) & 0x3]!
  const colorA = PALETTE[(h >> 4) % PALETTE.length]!
  const colorB = PALETTE[(h >> 10) % PALETTE.length]!
  const rotateA = ((h >> 14) & 0x3f) * 6
  const rotateB = ((h >> 20) & 0x3f) * 6
  const offsetX = (((h >> 26) & 0x7) - 3.5) * 1.5
  const offsetY = ((h >> 5) & 0x7) - 3.5

  return (
    <svg
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      viewBox="0 0 32 32"
      className={cn(
        'overflow-hidden rounded-md bg-muted text-foreground',
        className,
      )}
    >
      {title ? <title>{title}</title> : null}
      <Shape
        kind={shapeA}
        cx={14 + offsetX * 0.5}
        cy={15}
        size={17}
        color={colorA}
        rotate={rotateA}
        opacity={0.9}
      />
      <Shape
        kind={shapeB}
        cx={20 + offsetX * 0.3}
        cy={19 + offsetY * 0.4}
        size={11}
        color={colorB}
        rotate={rotateB}
        opacity={0.92}
      />
    </svg>
  )
}
