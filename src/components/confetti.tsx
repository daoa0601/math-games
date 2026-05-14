import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  rotation: number
  rotationSpeed: number
  life: number
}

const PARTICLE_COUNT = 80
const DURATION_MS = 2000
const GRAVITY = 0.12

function createParticles(
  width: number,
  height: number,
  colors: string[],
): Particle[] {
  const cx = width / 2
  const cy = height * 0.35
  return Array.from({ length: PARTICLE_COUNT }, () => {
    const angle = Math.random() * Math.PI * 2
    const speed = 2 + Math.random() * 6
    return {
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 3,
      size: 4 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 12,
      life: 1,
    }
  })
}

interface ConfettiProps {
  active: boolean
  colors?: string[]
}

export function Confetti({
  active,
  colors = ['#7c3aed', '#f97316', '#14b8a6', '#eab308', '#ec4899', '#3b82f6'],
}: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!active) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.parentElement?.getBoundingClientRect()
    if (!rect) return

    canvas.width = rect.width
    canvas.height = rect.height

    const particles = createParticles(canvas.width, canvas.height, colors)
    const startTime = performance.now()
    let frameId: number

    function draw(now: number) {
      const elapsed = now - startTime
      if (elapsed > DURATION_MS) {
        ctx!.clearRect(0, 0, canvas!.width, canvas!.height)
        return
      }

      ctx!.clearRect(0, 0, canvas!.width, canvas!.height)
      const progress = elapsed / DURATION_MS

      for (const p of particles) {
        p.x += p.vx
        p.vy += GRAVITY
        p.y += p.vy
        p.rotation += p.rotationSpeed
        p.life = 1 - progress

        ctx!.save()
        ctx!.translate(p.x, p.y)
        ctx!.rotate((p.rotation * Math.PI) / 180)
        ctx!.globalAlpha = Math.max(0, p.life)
        ctx!.fillStyle = p.color
        ctx!.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
        ctx!.restore()
      }

      frameId = requestAnimationFrame(draw)
    }

    frameId = requestAnimationFrame(draw)

    return () => cancelAnimationFrame(frameId)
  }, [active, colors])

  if (!active) return null

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-50"
      aria-hidden="true"
    />
  )
}
