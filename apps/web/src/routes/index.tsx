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

  return {
    completed,
  }
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
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-5 py-8 md:px-6 md:py-12">
      <header className="flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
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

      <hr className="my-6 border-border/60" />

      <section className={GAME_THEMES[dailyChallenge.gameId]}>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {t('daily.title')}
        </p>
        <h2 className="font-display mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
          {formatLevelName(locale, dailyChallenge.title)}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {formatGameTitle(locale, dailyChallenge.gameId)} ·{' '}
          {formatDifficulty(locale, dailyChallenge.difficulty)} ·{' '}
          {dailyChallenge.challengeDate}
        </p>
        <div className="mt-5 flex gap-3">
          <Link className={buttonVariants()} search={{ level: dailyChallenge.levelId }} to={dailyTo}>
            {t('daily.start')}
          </Link>
          <Link className={buttonVariants({ variant: 'ghost' })} to="/daily">
            {t('daily.play')}
          </Link>
        </div>
      </section>

      <hr className="my-8 border-border/60" />

      <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1 text-sm text-muted-foreground">
        <span>
          <strong className="font-semibold tabular-nums text-foreground">
            {completedCount}
          </strong>{' '}
          {t('stats.completed')}
        </span>
        <span>
          <strong className="font-semibold tabular-nums text-foreground">
            {progressRows.length}
          </strong>{' '}
          {t('stats.progress')}
        </span>
        <Link
          to="/achievements"
          className="transition-colors hover:text-foreground"
        >
          <strong className="font-semibold tabular-nums text-foreground">
            {overview.achievements.length}
          </strong>{' '}
          {t('stats.achievements')} &rarr;
        </Link>
      </div>

      <section className="mt-10 grid gap-px overflow-hidden rounded-xl border border-border/60 bg-border/60 sm:grid-cols-2">
        {games.map((game) => {
          const progress = summarizeProgress(progressRows, game.gameId)
          const pct =
            game.levelCount > 0
              ? Math.round((progress.completed / game.levelCount) * 100)
              : 0

          return (
            <div
              key={game.gameId}
              className={`${GAME_THEMES[game.gameId] ?? ''} flex flex-col bg-card p-5`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5">
                    <span className="inline-block size-2.5 shrink-0 rounded-full bg-primary" />
                    <h3 className="font-display text-base font-semibold tracking-tight">
                      {formatGameTitle(locale, game.gameId)}
                    </h3>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground line-clamp-2">
                    {formatGameDescription(locale, game.gameId) ||
                      game.description}
                  </p>
                </div>
              </div>
              <div className="mt-auto pt-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="tabular-nums">
                    {progress.completed}/{game.levelCount}
                  </span>
                  <span className="tabular-nums">{pct}%</span>
                </div>
                <Progress value={pct} className="mt-1.5 h-1" />
              </div>
              <Link
                className={buttonVariants({ size: 'sm', variant: 'outline' }) + ' mt-4 self-start'}
                search={{ level: undefined }}
                to={game.to}
              >
                {t('game.play')}
              </Link>
            </div>
          )
        })}
      </section>
    </div>
  )
}
