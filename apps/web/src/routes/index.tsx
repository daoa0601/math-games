import { createFileRoute, Link } from '@tanstack/react-router'

import {
  formatDifficulty,
  formatGameDescription,
  formatGameTitle,
  formatLevelName,
} from '@/i18n-format'
import { LanguageToggle } from '@math-games/ui'
import { useLocale } from '@math-games/ui'
import { ThemeToggle } from '@math-games/ui'
import { useT } from '@math-games/ui'
import { buttonVariants } from '@math-games/ui'
import { Card, CardContent } from '@math-games/ui'
import { Progress } from '@math-games/ui'
import { getDailyChallenge } from '@/daily/daily.functions'
import { gameModules, registry } from '@/games/registry'
import { getPlayerProfileOverview } from '@/player/profile.functions'
import type { PlayerProgressSummary } from '@/player/profile.server'
import { RouteErrorFallback } from '@/routes/-route-error'
import { RoutePending } from '@/routes/-route-pending'

const GAME_THEMES: Record<string, string> = Object.fromEntries(
  gameModules.map((m) => [m.id, `theme-${m.id}`]),
)

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
  const dailyModule = registry[dailyChallenge.gameId as keyof typeof registry]
  const dailyTo = dailyModule?.route ?? `/games/${dailyChallenge.gameId}`

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col px-5 py-8 md:px-8 md:py-12">
      <header className="flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <h1 className="font-display text-2xl font-medium tracking-tight md:text-3xl">
            {t('app.title')}
          </h1>
          <Link
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            to="/profile"
          >
            {overview.profile.displayName}
          </Link>
          <span hidden>D1-backed profile state</span>
        </div>
        <div className="flex items-center gap-1">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </header>

      <section className={`${GAME_THEMES[dailyChallenge.gameId]} mt-8`}>
        <Card className="border-l-4 border-l-primary shadow-sm">
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {t('daily.title')}
                </h2>
                <p className="font-display mt-1.5 text-2xl font-medium tracking-tight md:text-3xl">
                  {formatLevelName(locale, dailyChallenge.title)}
                </p>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {formatGameTitle(locale, dailyChallenge.gameId)} ·{' '}
                  {formatDifficulty(locale, dailyChallenge.difficulty)} ·{' '}
                  {dailyChallenge.challengeDate}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
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
            </div>
          </CardContent>
        </Card>
      </section>

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
        {games.map((game) => {
          const progress = summarizeProgress(progressRows, game.gameId)
          const pct =
            game.levelCount > 0
              ? Math.round((progress.completed / game.levelCount) * 100)
              : 0

          return (
            <div key={game.gameId} className={GAME_THEMES[game.gameId] ?? ''}>
              <Card className="group border-l-4 border-l-primary shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md">
                <CardContent className="flex flex-col gap-4">
                  <div>
                    <h3 className="font-display text-lg font-medium tracking-tight">
                      {formatGameTitle(locale, game.gameId)}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground line-clamp-2">
                      {formatGameDescription(locale, game.gameId) ||
                        game.description}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="tabular-nums">
                        {progress.completed}/{game.levelCount}
                      </span>
                      <span className="tabular-nums">{pct}%</span>
                    </div>
                    <Progress value={pct} className="mt-1.5 h-1.5" />
                  </div>
                  <Link
                    className={buttonVariants({
                      size: 'sm',
                      variant: 'outline',
                    })}
                    search={{ level: undefined }}
                    to={game.to}
                  >
                    {t('game.play')}
                  </Link>
                </CardContent>
              </Card>
            </div>
          )
        })}
      </section>
    </div>
  )
}
