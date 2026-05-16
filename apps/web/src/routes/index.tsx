import { createFileRoute, Link } from '@tanstack/react-router'

import { AnimatedCounter } from '@math-games/ui'
import { GamePattern } from '@math-games/ui'
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
import { TiltCard } from '@math-games/ui'
import { buttonVariants } from '@math-games/ui'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@math-games/ui'
import { Progress } from '@math-games/ui'
import { getDailyChallenge } from '@/daily/daily.functions'
import { gameModules, registry } from '@/games/registry'
import { getPlayerProfileOverview } from '@/player/profile.functions'
import type { PlayerProgressSummary } from '@/player/profile.server'

const GAME_THEMES: Record<string, string> = Object.fromEntries(
  gameModules.map((m) => [m.id, `theme-${m.id}`]),
)

import type { PatternType } from '@math-games/ui'

const GAME_PATTERNS: Record<string, PatternType> = {
  'magic-graph': 'constellation',
  'sequence-race': 'arrows',
  'shape-architect': 'blueprint',
  'pattern-detective': 'magnifier',
}

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
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-6 md:gap-10 md:px-6 md:py-10">
      <header className="flex items-center justify-between gap-4 border-b border-border/50 pb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            {t('app.title')}
          </h1>
          <Link
            className="rounded-full border border-primary/30 bg-gradient-to-r from-primary/20 to-primary/10 px-3 py-1 text-sm font-bold text-primary transition-colors hover:from-primary/30 hover:to-primary/20"
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

      <main className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card
          className={`${GAME_THEMES[dailyChallenge.gameId]} game-card-bg border-0 shadow-lg ring-1 ring-inset ring-white/10 dark:ring-white/5`}
        >
          <CardContent className="relative z-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary">
                  {t('today')}
                </p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
                  {t('daily.title')}
                </h2>
                <p className="mt-2 text-lg font-semibold">
                  {formatLevelName(locale, dailyChallenge.title)}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {dailyChallenge.challengeDate} ·{' '}
                  {formatDifficulty(locale, dailyChallenge.difficulty)} ·{' '}
                  {formatGameTitle(locale, dailyChallenge.gameId)}
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  className={buttonVariants({ variant: 'outline' })}
                  to="/daily"
                >
                  {t('daily.play')}
                </Link>
                <Link
                  className={buttonVariants({ size: 'lg' })}
                  search={{ level: dailyChallenge.levelId }}
                  to={dailyTo}
                >
                  {t('daily.start')}
                </Link>
              </div>
            </div>
            <dl className="mt-6 hidden gap-3 text-sm sm:grid sm:grid-cols-3">
              <div className="rounded-lg border border-white/10 bg-background/60 p-3 backdrop-blur-sm">
                <dt className="text-xs text-muted-foreground">
                  {t('daily.level')}
                </dt>
                <dd className="mt-1 font-semibold">{dailyChallenge.levelId}</dd>
              </div>
              <div className="rounded-lg border border-white/10 bg-background/60 p-3 backdrop-blur-sm">
                <dt className="text-xs text-muted-foreground">
                  {t('daily.seed')}
                </dt>
                <dd className="mt-1 font-mono text-xs">
                  {dailyChallenge.seed}
                </dd>
              </div>
              <div className="rounded-lg border border-white/10 bg-background/60 p-3 backdrop-blur-sm">
                <dt className="text-xs text-muted-foreground">
                  {t('stats.progress')}
                </dt>
                <dd className="mt-1 font-semibold">
                  {t('daily.savedProgress')}
                </dd>
              </div>
            </dl>
          </CardContent>
          {GAME_PATTERNS[dailyChallenge.gameId] && (
            <GamePattern
              pattern={GAME_PATTERNS[dailyChallenge.gameId]}
              className="text-primary/[0.08] dark:text-primary/[0.12]"
            />
          )}
        </Card>

        <div className="grid content-start gap-4">
          <Card className="border border-border/50 py-0 shadow-md">
            <div className="grid grid-cols-2 text-center">
              <div className="flex flex-col items-center justify-center border-t-2 border-t-primary/40 p-5">
                <AnimatedCounter
                  value={completedCount}
                  className="text-4xl font-extrabold tabular-nums tracking-tight text-primary"
                />
                <div className="mt-1.5 text-xs font-medium text-muted-foreground">
                  {t('stats.completed')}
                </div>
              </div>
              <div className="flex flex-col items-center justify-center border-l border-border/50 border-t-2 border-t-accent/40 p-5">
                <AnimatedCounter
                  value={progressRows.length}
                  className="text-4xl font-extrabold tabular-nums tracking-tight text-foreground"
                />
                <div className="mt-1.5 text-xs font-medium text-muted-foreground">
                  {t('stats.progress')}
                </div>
              </div>
            </div>
          </Card>
          <Link to="/achievements">
            <Card className="border border-border/50 shadow-md transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5">
              <CardContent className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold">
                    {t('stats.achievements')}
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {t('stats.progress')}
                  </p>
                </div>
                <span className="text-4xl font-extrabold tabular-nums tracking-tight text-primary">
                  {overview.achievements.length}
                </span>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>

      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {games.map((game, i) => {
          const progress = summarizeProgress(progressRows, game.gameId)
          const pct =
            game.levelCount > 0
              ? Math.round((progress.completed / game.levelCount) * 100)
              : 0

          return (
            <TiltCard
              key={game.gameId}
              className="animate-slide-up-fade"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <Card
                className={`${GAME_THEMES[game.gameId] ?? ''} game-card-bg relative border border-border/50 shadow-md transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10`}
              >
                {GAME_PATTERNS[game.gameId] && (
                  <GamePattern
                    pattern={GAME_PATTERNS[game.gameId]}
                    className="text-primary/[0.06] dark:text-primary/[0.12]"
                  />
                )}
                <CardHeader className="relative z-10">
                  <CardTitle className="text-xl font-bold">
                    {formatGameTitle(locale, game.gameId)}
                  </CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {formatGameDescription(locale, game.gameId) ||
                      game.description}
                  </p>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="flex items-end justify-between text-sm">
                    <span className="font-medium tabular-nums text-muted-foreground">
                      {progress.completed}/{game.levelCount}
                    </span>
                    <span className="text-xs font-bold tabular-nums text-primary">
                      {pct}%
                    </span>
                  </div>
                  <Progress value={pct} className="mt-2 h-2" />
                </CardContent>
                <CardFooter className="relative z-10">
                  <Link
                    className={buttonVariants()}
                    search={{ level: undefined }}
                    to={game.to}
                  >
                    {t('game.play')}
                  </Link>
                </CardFooter>
              </Card>
            </TiltCard>
          )
        })}
      </section>
    </div>
  )
}
