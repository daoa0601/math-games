import { createFileRoute, Link } from '@tanstack/react-router'

import {
  formatDifficulty,
  formatGameTitle,
  formatLevelName,
} from '@/i18n-format'
import { LanguageToggle } from '@math-games/ui'
import { useLocale } from '@math-games/ui'
import { ThemeToggle } from '@math-games/ui'
import { useT } from '@math-games/ui'
import { buttonVariants } from '@math-games/ui'
import { Card, CardContent } from '@math-games/ui'
import { Separator } from '@math-games/ui'
import { getDailyChallenge } from '@/daily/daily.functions'
import { gameModules, registry } from '@/games/registry'

const GAME_THEMES: Record<string, string> = Object.fromEntries(
  gameModules.map((m) => [m.id, `theme-${m.id}`]),
)

export const Route = createFileRoute('/daily')({
  loader: () => getDailyChallenge(),
  component: DailyRoute,
})

function DailyRoute() {
  const challenge = Route.useLoaderData()
  const t = useT()
  const { locale } = useLocale()
  const playSearch = { level: challenge.levelId }
  const module = registry[challenge.gameId as keyof typeof registry]
  const playRoute = module?.route ?? `/games/${challenge.gameId}`

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 py-6 md:gap-10 md:px-6 md:py-10">
      <header className="sticky top-0 z-40 -mx-4 flex items-center justify-between gap-3 border-b border-border/50 bg-background/95 px-4 py-3 backdrop-blur-sm md:-mx-6 md:px-6">
        <div className="flex items-center gap-3">
          <Link
            className="text-sm text-muted-foreground transition-colors hover:text-primary"
            to="/"
          >
            {t('app.title')}
          </Link>
          <span className="text-muted-foreground/50">/</span>
          <h1 className="text-xl font-bold tracking-tight md:text-2xl">
            {t('daily.title')}
          </h1>
        </div>
        <div className="flex items-center gap-1">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </header>

      <Card className={`${GAME_THEMES[challenge.gameId]} game-card-bg border border-primary/15 shadow-xl shadow-primary/5 ring-1 ring-inset ring-white/10 dark:ring-white/5`}>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <p className="text-sm font-semibold uppercase text-muted-foreground">
                {challenge.challengeDate}
              </p>
              <h2 className="mt-2 text-3xl font-semibold">
                {formatLevelName(locale, challenge.title)}
              </h2>
              <dl className="mt-5 grid gap-3 text-sm">
                <div className="flex justify-between gap-6 pb-2">
                  <dt className="text-muted-foreground">{t('daily.game')}</dt>
                  <dd className="font-medium">
                    {formatGameTitle(locale, challenge.gameId)}
                  </dd>
                </div>
                <Separator />
                <div className="flex justify-between gap-6 pt-1 pb-2">
                  <dt className="text-muted-foreground">{t('daily.level')}</dt>
                  <dd className="font-medium">{challenge.levelId}</dd>
                </div>
                <Separator />
                <div className="flex justify-between gap-6 pt-1 pb-2">
                  <dt className="text-muted-foreground">
                    {t('daily.difficulty')}
                  </dt>
                  <dd className="font-medium capitalize">
                    {formatDifficulty(locale, challenge.difficulty)}
                  </dd>
                </div>
                <Separator />
                <div className="flex justify-between gap-6 pt-1">
                  <dt className="text-muted-foreground">{t('daily.seed')}</dt>
                  <dd className="font-mono text-xs">{challenge.seed}</dd>
                </div>
              </dl>
            </div>

            <Link
              className={buttonVariants({ variant: 'outline' })}
              search={playSearch}
              to={playRoute}
            >
              {t('daily.play')}
            </Link>
          </div>
        </CardContent>
      </Card>
      <span hidden>D1-backed daily challenge row</span>
    </main>
  )
}
