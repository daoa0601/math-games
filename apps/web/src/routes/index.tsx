import { createFileRoute, Link } from '@tanstack/react-router'

import {
  formatDifficulty,
  formatGameDescription,
  formatGameTitle,
  formatLevelName,
} from '@/i18n-format'
import {
  buttonVariants,
  type GameGlyphId,
  LanguageToggle,
  MechanicCard,
  PlayerAvatar,
  Progress,
  ThemeToggle,
  useLocale,
  useT,
  Wordmark,
} from '@math-games/ui'
import { getDailyChallenge } from '@/daily/daily.functions'
import { gameModules, registry } from '@/games/registry'
import { getPlayerProfileOverview } from '@/player/profile.functions'
import type { PlayerProgressSummary } from '@/player/profile.server'
import { RouteErrorFallback } from '@/routes/-route-error'
import { RoutePending } from '@/routes/-route-pending'

export const Route = createFileRoute('/')({
  loader: async () => {
    const [overview, dailyChallenge] = await Promise.all([
      getPlayerProfileOverview(),
      getDailyChallenge(),
    ])

    return {
      dailyChallenge,
      games: gameModules.map((module) => ({
        description: module.description,
        gameId: module.id,
        levelCount: module.levelCount,
        title: module.title,
        to: module.route,
      })),
      overview,
    }
  },
  component: Home,
  errorComponent: RouteErrorFallback,
  pendingComponent: RoutePending,
})

function summarizeProgress(
  progressRows: PlayerProgressSummary[],
  gameId: string,
) {
  const rows = progressRows.filter((row) => row.gameId === gameId)
  const completed = rows.filter((row) => row.completedAt !== null).length

  return { completed }
}

function Home() {
  const { dailyChallenge, games, overview } = Route.useLoaderData()
  const t = useT()
  const { locale } = useLocale()
  const progressRows = overview.progress as PlayerProgressSummary[]
  const completedCount = progressRows.filter(
    (row) => row.completedAt !== null,
  ).length
  const dailyGameId = dailyChallenge.gameId as GameGlyphId
  const dailyModule = registry[dailyChallenge.gameId as keyof typeof registry]
  const dailyTo = dailyModule?.route ?? `/games/${dailyChallenge.gameId}`

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col px-5 py-8 md:px-8 md:py-12">
      <header className="flex items-center justify-between gap-4">
        <Wordmark label={t('app.title')} />
        <div className="flex items-center gap-2">
          <Link
            className="group/profile flex items-center gap-2 rounded-full border border-transparent px-1.5 py-1 text-sm text-muted-foreground transition-colors hover:border-border hover:text-foreground"
            to="/profile"
          >
            <PlayerAvatar
              seed={overview.profile.displayName}
              className="size-7"
            />
            <span className="hidden tabular-nums sm:inline">
              {overview.profile.displayName}
            </span>
          </Link>
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </header>

      <MechanicCard game={dailyGameId} tone="hero" className="mt-8">
        <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {t('daily.title')}
        </p>
        <h2 className="font-display mt-2 text-3xl font-medium tracking-tight md:text-4xl">
          {formatLevelName(locale, dailyChallenge.title)}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {formatGameTitle(locale, dailyChallenge.gameId)} ·{' '}
          {formatDifficulty(locale, dailyChallenge.difficulty)} ·{' '}
          <span className="tabular-nums">{dailyChallenge.challengeDate}</span>
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            className={buttonVariants()}
            search={{ level: dailyChallenge.levelId }}
            to={dailyTo}
          >
            {t('daily.start')}
          </Link>
          <Link
            className={buttonVariants({ variant: 'ghost' })}
            to="/daily"
          >
            {t('daily.play')}
          </Link>
        </div>
      </MechanicCard>

      <div className="mt-8 flex flex-wrap items-baseline gap-x-5 gap-y-1 text-sm text-muted-foreground">
        <span>
          <strong className="font-medium tabular-nums text-foreground">
            {completedCount}
          </strong>{' '}
          {t('stats.completed')}
        </span>
        <span aria-hidden className="text-border">
          ·
        </span>
        <span>
          <strong className="font-medium tabular-nums text-foreground">
            {progressRows.length}
          </strong>{' '}
          {t('stats.progress')}
        </span>
        <span aria-hidden className="text-border">
          ·
        </span>
        <Link
          to="/achievements"
          className="transition-colors hover:text-foreground"
        >
          <strong className="font-medium tabular-nums text-foreground">
            {overview.achievements.length}
          </strong>{' '}
          {t('stats.achievements')} &rarr;
        </Link>
      </div>

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        {games.map((game, index) => {
          const progress = summarizeProgress(progressRows, game.gameId)
          const pct =
            game.levelCount > 0
              ? Math.round((progress.completed / game.levelCount) * 100)
              : 0

          return (
            <MechanicCard
              key={game.gameId}
              game={game.gameId as GameGlyphId}
              className="animate-slide-up-fade hover:-translate-y-0.5"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <h3 className="font-display text-xl font-medium tracking-tight md:text-2xl">
                {formatGameTitle(locale, game.gameId)}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {formatGameDescription(locale, game.gameId) || game.description}
              </p>
              <div className="mt-auto pt-6">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="tabular-nums">
                    {progress.completed}/{game.levelCount}
                  </span>
                  <span className="tabular-nums">{pct}%</span>
                </div>
                <Progress
                  value={pct}
                  className="mt-1.5 h-2 bg-primary/15"
                />
                <Link
                  className={`${buttonVariants({
                    size: 'sm',
                    variant: 'outline',
                  })} mt-4`}
                  search={{ level: undefined }}
                  to={game.to}
                >
                  {t('game.play')}
                </Link>
              </div>
            </MechanicCard>
          )
        })}
      </section>
    </div>
  )
}
