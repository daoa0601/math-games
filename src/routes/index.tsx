import { createFileRoute, Link } from '@tanstack/react-router'

import { AnimatedCounter } from '@/components/animated-counter'
import {
  formatDifficulty,
  formatGameDescription,
  formatGameTitle,
  formatLevelName,
} from '@/components/i18n-format'
import { LanguageToggle } from '@/components/language-toggle'
import { useLocale } from '@/components/locale-context'
import { ThemeToggle } from '@/components/theme-toggle'
import { useT } from '@/components/use-t'
import { TiltCard } from '@/components/tilt-card'
import { buttonVariants } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { getDailyChallenge } from '@/daily/daily.functions'
import { gameModules, registry } from '@/games/registry'
import { getPlayerProfileOverview } from '@/player/profile.functions'
import type { PlayerProgressSummary } from '@/player/profile.server'

const GAME_THEMES: Record<string, string> = {
  'magic-graph': 'theme-magic-graph',
  'sequence-race': 'theme-sequence-race',
  'shape-architect': 'theme-shape-architect',
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
  const dailyTo = registry[dailyChallenge.gameId].route

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-5 px-4 py-6 md:gap-8 md:px-6 md:py-8">
      <header className="flex items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold md:text-3xl">
            {t('app.title')}
          </h1>
          <Link
            className="rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
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

      <main className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className={GAME_THEMES[dailyChallenge.gameId]}>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase text-muted-foreground">
                  {t('today')}
                </p>
                <h2 className="mt-2 text-3xl font-semibold">
                  {t('daily.title')}
                </h2>
                <p className="mt-2 text-xl font-semibold">
                  {formatLevelName(locale, dailyChallenge.title)}
                </p>
                <p className="mt-2 text-muted-foreground">
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
                  className={buttonVariants()}
                  search={{ level: dailyChallenge.levelId }}
                  to={dailyTo}
                >
                  {t('daily.start')}
                </Link>
              </div>
            </div>
            <dl className="mt-6 hidden gap-3 text-sm sm:grid sm:grid-cols-3">
              <div className="border-t border-border pt-3">
                <dt className="text-muted-foreground">{t('daily.level')}</dt>
                <dd className="mt-1 font-semibold">{dailyChallenge.levelId}</dd>
              </div>
              <div className="border-t border-border pt-3">
                <dt className="text-muted-foreground">{t('daily.seed')}</dt>
                <dd className="mt-1 font-mono text-xs">
                  {dailyChallenge.seed}
                </dd>
              </div>
              <div className="border-t border-border pt-3">
                <dt className="text-muted-foreground">{t('stats.progress')}</dt>
                <dd className="mt-1 font-semibold">
                  {t('daily.savedProgress')}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card className="py-0">
          <div className="grid h-full grid-cols-3 text-center">
            <div className="flex flex-col items-center justify-center p-5">
              <AnimatedCounter
                value={completedCount}
                className="text-3xl font-semibold"
              />
              <div className="mt-2 text-sm text-muted-foreground">
                {t('stats.completed')}
              </div>
            </div>
            <div className="flex flex-col items-center justify-center border-x border-border p-5">
              <AnimatedCounter
                value={progressRows.length}
                className="text-3xl font-semibold"
              />
              <div className="mt-2 text-sm text-muted-foreground">
                {t('stats.progress')}
              </div>
            </div>
            <Link
              className="flex flex-col items-center justify-center p-5 transition-colors hover:bg-muted/50"
              to="/profile"
            >
              <AnimatedCounter
                value={overview.achievements.length}
                className="text-3xl font-semibold"
              />
              <div className="mt-2 text-sm text-muted-foreground">
                {t('stats.achievements')}
              </div>
            </Link>
          </div>
        </Card>
      </main>

      <section className="grid gap-5 md:grid-cols-3">
        {games.map((game) => {
          const progress = summarizeProgress(progressRows, game.gameId)

          return (
            <TiltCard key={game.gameId}>
              <Card
                className={`${GAME_THEMES[game.gameId] ?? ''} border-l-4 border-l-primary`}
              >
                <CardHeader>
                  <CardTitle className="text-2xl">
                    {formatGameTitle(locale, game.gameId)}
                  </CardTitle>
                  <p className="mt-1 text-muted-foreground">
                    {formatGameDescription(locale, game.gameId) ||
                      game.description}
                  </p>
                </CardHeader>
                <CardContent>
                  <dl className="grid gap-2 text-sm">
                    <div className="flex justify-between pb-2">
                      <dt className="text-muted-foreground">
                        {t('stats.levels')}
                      </dt>
                      <dd className="font-medium">{game.levelCount}</dd>
                    </div>
                    <Separator />
                    <div className="flex justify-between pt-2">
                      <dt className="text-muted-foreground">
                        {t('stats.completed')}
                      </dt>
                      <dd className="font-medium">
                        {progress.completed} / {game.levelCount}
                      </dd>
                    </div>
                  </dl>
                </CardContent>
                <CardFooter>
                  <Link
                    className={buttonVariants({ variant: 'outline' })}
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
