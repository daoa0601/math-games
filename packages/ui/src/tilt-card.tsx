import { useCallback, useRef } from 'react'
import type { CSSProperties, MouseEvent, ReactNode } from 'react'

import { cn } from './cn'

interface TiltCardProps {
  children: ReactNode
  className?: string
  intensity?: number
  style?: CSSProperties
}

export function TiltCard({
  children,
  className,
  intensity = 8,
  style,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null)

  const handleMove = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      const el = ref.current
      if (!el) return

      const rect = el.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width - 0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5

      el.style.transform = `perspective(600px) rotateX(${-y * intensity}deg) rotateY(${x * intensity}deg) scale(1.02)`
    },
    [intensity],
  )

  const handleLeave = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.style.transform = ''
  }, [])

  return (
    <div
      ref={ref}
      className={cn('transition-transform duration-200 ease-out', className)}
      style={style}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      {children}
    </div>
  )
}
