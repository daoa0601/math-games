import type { ReactNode } from 'react'

import { cn } from './cn'
import { PlayerAvatar } from './player-avatar'
import { Wordmark } from './wordmark'
import { useT } from './use-t'

interface MobileAppHeaderProps {
  subtitle?: string
  playerName?: string
  right?: ReactNode
  className?: string
}

export function MobileAppHeader({
  subtitle,
  playerName,
  right,
  className,
}: MobileAppHeaderProps) {
  const t = useT()

  return (
    <header
      className={cn(
        'flex items-center justify-between px-5 pb-2.5 pt-3',
        className,
      )}
    >
      <div className="flex items-center gap-2.5">
        <Wordmark label={t('app.title')} compact />
        {subtitle ? (
          <span className="eyebrow ml-1" style={{ fontSize: '0.625rem' }}>
            {subtitle}
          </span>
        ) : null}
      </div>
      {right ?? (
        <div className="flex items-center gap-1">
          <PlayerAvatar seed={playerName ?? 'guest'} className="size-7" />
        </div>
      )}
    </header>
  )
}
