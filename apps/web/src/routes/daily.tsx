import { createFileRoute, Link } from '@tanstack/react-router'

import {
  formatDifficulty,
  formatGameTitle,
  formatLevelName,
} from '@/i18n-format'
import {
  buttonVariants,
  type GameGlyphId,
  LanguageToggle,
  MechanicCard,
  ThemeToggle,
  useLocale,
  useT,
  Wordmark,
} from '@math-games/ui'
import { getDailyChallenge } from '@/daily/daily.functions'
import { registry } from '@/games/registry'
import { RouteErrorFallback } from '@/routes/-route-error'
import { RoutePending } from '@/routes/-route-pending'

export const Route = createFileRoute('/daily')({
  loader: () => getDailyChallenge(),
  component: DailyRoute,
  errorComponent: RouteErrorFallback,
  pendingComponent: RoutePending,
})

function DailyRoute() {
  const challenge = Route.useLoaderData()
  const t = useT()
  const { locale } = useLocale()
  const playSearch = { level: challenge.levelId }
  const module = registry[challenge.gameId as keyof typeof registry]
  const playRoute = module?.route ?? `/games/${challenge.gameId}`
  const gameId = challenge.gameId as GameGlyphId

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col px-5 py-8 md:px-8 md:py-12">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <Link
            to="/"
            aria-label={t('app.title')}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <Wordmark compact label={t('app.title')} />
          </Link>
          <span aria-hidden className="text-border">
            /
          </span>
          <h1 className="font-display text-xl font-medium tracking-tight md:text-2xl">
            {t('daily.title')}
          </h1>
        </div>
        <div className="flex items-center gap-1">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </header>

      <MechanicCard game={gameId} tone="hero" className="mt-8">
        <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          <span className="tabular-nums">{challenge.challengeDate}</span>
        </p>
        <h2 className="font-display mt-2 text-3xl font-medium tracking-tight md:text-4xl">
          {formatLevelName(locale, challenge.title)}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {formatGameTitle(locale, challenge.gameId)} ·{' '}
          {formatDifficulty(locale, challenge.difficulty)}
        </p>
        <dl className="mt-5 grid max-w-md gap-1.5 text-sm">
          <div className="flex justify-between gap-6 border-t border-border/60 pt-2">
            <dt className="text-muted-foreground">{t('daily.level')}</dt>
            <dd className="font-medium tabular-nums">{challenge.levelId}</dd>
          </div>
          <div className="flex justify-between gap-6 border-t border-border/60 pt-2">
            <dt className="text-muted-foreground">{t('daily.seed')}</dt>
            <dd className="font-mono text-xs">{challenge.seed}</dd>
          </div>
        </dl>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            className={buttonVariants()}
            search={playSearch}
            to={playRoute}
          >
            {t('daily.play')}
          </Link>
        </div>
      </MechanicCard>
      <span hidden>D1-backed daily challenge row</span>
    </main>
  )
}
