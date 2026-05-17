import * as React from 'react'

import { cn } from './cn'
import { GameGlyph } from './game-glyph'
import type { GameGlyphId } from './game-glyph'
import { LanguageToggle } from './language-toggle'
import { ThemeToggle } from './theme-toggle'
import { useT } from './use-t'
import { Wordmark } from './wordmark'

interface GameChromeProps {
  game: GameGlyphId
  levelTitle: string
  meta?: React.ReactNode
}

export function GameChrome({ game, levelTitle, meta }: GameChromeProps) {
  const t = useT()

  return (
    <header
      className={cn(
        'sticky top-0 z-40 -mx-4 flex items-center justify-between gap-3 border-b border-border/60 bg-background px-4 py-3 md:-mx-6 md:px-6',
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <a
          href="/"
          aria-label={t('app.title')}
          className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
        >
          <Wordmark compact label={t('app.title')} />
        </a>
        <span aria-hidden className="text-border">
          /
        </span>
        <GameGlyph
          game={game}
          className="size-5 shrink-0 text-primary/85"
        />
        <h1 className="font-display truncate text-base font-medium tracking-tight md:text-lg">
          {levelTitle}
        </h1>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {meta}
        <LanguageToggle />
        <ThemeToggle />
      </div>
    </header>
  )
}
