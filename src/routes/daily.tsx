import { createFileRoute, Link } from '@tanstack/react-router'

import { LanguageToggle } from '@/components/language-toggle'
import { ThemeToggle } from '@/components/theme-toggle'
import { useT } from '@/components/use-t'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { getDailyChallenge } from '@/daily/daily.functions'
import { registry } from '@/games/registry'

const GAME_THEMES: Record<string, string> = {
  'magic-graph': 'theme-magic-graph',
  'sequence-race': 'theme-sequence-race',
  'shape-architect': 'theme-shape-architect',
}

export const Route = createFileRoute('/daily')({
  loader: () => getDailyChallenge(),
  component: DailyRoute,
})

function DailyRoute() {
  const challenge = Route.useLoaderData()
  const t = useT()
  const playSearch = { level: challenge.levelId }
  const playRoute = registry[challenge.gameId].route

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-5 px-4 py-6 md:gap-8 md:px-6 md:py-8">
      <header className="flex items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Link
            className="text-sm text-muted-foreground hover:text-foreground"
            to="/"
          >
            {t('app.title')}
          </Link>
          <span className="text-muted-foreground">/</span>
          <h1 className="text-lg font-semibold md:text-2xl">
            {t('daily.title')}
          </h1>
        </div>
        <div className="flex items-center gap-1">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </header>

      <Card className={GAME_THEMES[challenge.gameId]}>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <p className="text-sm font-semibold uppercase text-muted-foreground">
                {challenge.challengeDate}
              </p>
              <h2 className="mt-2 text-3xl font-semibold">
                {challenge.title}
              </h2>
              <dl className="mt-5 grid gap-3 text-sm">
                <div className="flex justify-between gap-6 pb-2">
                  <dt className="text-muted-foreground">{t('daily.game')}</dt>
                  <dd className="font-medium">{challenge.gameId}</dd>
                </div>
                <Separator />
                <div className="flex justify-between gap-6 pt-1 pb-2">
                  <dt className="text-muted-foreground">{t('daily.level')}</dt>
                  <dd className="font-medium">{challenge.levelId}</dd>
                </div>
                <Separator />
                <div className="flex justify-between gap-6 pt-1 pb-2">
                  <dt className="text-muted-foreground">{t('daily.difficulty')}</dt>
                  <dd className="font-medium capitalize">
                    {challenge.difficulty}
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
