import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'

import {
  formatDifficulty,
  formatGameTitle,
  formatLevelName,
} from '@/i18n-format'
import {
  buttonVariants,
  type GameGlyphId,
  GamePattern,
  type PatternType,
  LanguageToggle,
  MechanicCard,
  MobileAppHeader,
  MobileTabBar,
  ThemeToggle,
  useLocale,
  useT,
  Wordmark,
} from '@math-games/ui'
import { getDailyChallenge } from '@/daily/daily.functions'
import { registry } from '@/games/registry'
import { getPlayerProfileOverview } from '@/player/profile.functions'
import { RouteErrorFallback } from '@/routes/-route-error'
import { RoutePending } from '@/routes/-route-pending'

const GAME_PATTERN: Record<string, PatternType> = {
  'magic-graph': 'constellation',
  'sequence-race': 'arrows',
  'shape-architect': 'blueprint',
  'pattern-detective': 'magnifier',
}

export const Route = createFileRoute('/daily')({
  loader: async () => {
    const [challenge, overview] = await Promise.all([
      getDailyChallenge(),
      getPlayerProfileOverview(),
    ])
    return { challenge, overview }
  },
  component: DailyRoute,
  errorComponent: RouteErrorFallback,
  pendingComponent: RoutePending,
})

function DailyRoute() {
  const { challenge, overview } = Route.useLoaderData()
  const t = useT()
  const { locale } = useLocale()
  const navigate = useNavigate()
  const playSearch = { level: challenge.levelId }
  const module = registry[challenge.gameId as keyof typeof registry]
  const playRoute = module?.route ?? `/games/${challenge.gameId}`
  const gameId = challenge.gameId as GameGlyphId
  const displayName = overview.profile.displayName

  return (
    <div className="flex min-h-screen flex-col">
      {/* ── DESKTOP LAYOUT (≥ md) ────────────────────────────── */}
      <main className="mx-auto hidden min-h-screen w-full max-w-4xl flex-col px-5 py-8 md:flex md:px-8 md:py-12">
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
          <p className="eyebrow text-muted-foreground">
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

      {/* ── MOBILE LAYOUT (< md) ─────────────────────────────── */}
      <div className={`theme-${gameId} flex min-h-screen flex-col md:hidden`}>
        <MobileAppHeader playerName={displayName} />

        <main className="flex-1 overflow-auto px-4 pb-4 pt-1">
          {/* Large display title */}
          <div className="px-1 pb-5 pt-2">
            <p className="eyebrow tabular-nums text-primary">
              ● {challenge.challengeDate}
            </p>
            <h1 className="font-display mt-3 text-[3.25rem] font-medium leading-[0.94] tracking-tighter">
              {formatLevelName(locale, challenge.title)}
            </h1>
            <div className="mt-4 flex items-baseline gap-4">
              <div>
                <p className="eyebrow" style={{ fontSize: '0.5625rem' }}>
                  {t('daily.number')}
                </p>
                <p className="font-display text-[1.375rem] font-medium tracking-tight tabular-nums">
                  {challenge.challengeDate.replace(/-/g, '').slice(-3)}
                </p>
              </div>
              <div
                className="h-5.5 w-px bg-border"
                style={{ height: '1.375rem' }}
              />
              <div>
                <p className="eyebrow" style={{ fontSize: '0.5625rem' }}>
                  {t('home.streak')}
                </p>
                <p className="font-display text-[1.375rem] font-medium tracking-tight tabular-nums text-chart-1">
                  —
                  <span className="ml-0.5 text-[0.6875rem] text-muted-foreground">
                    {t('home.days')}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Main challenge card */}
          <article className="relative isolate overflow-hidden rounded-[1.375rem] border border-border/70 bg-card p-[1.375rem] shadow-(--card-shadow-long)">
            <div
              className="absolute inset-0 -z-20 opacity-90"
              style={{ backgroundImage: 'var(--game-gradient)' }}
            />
            <GamePattern
              pattern={GAME_PATTERN[gameId] ?? 'constellation'}
              className="text-primary/[0.04]"
            />

            <p className="eyebrow">{t('daily.todaysGame')}</p>
            <h2 className="font-display mt-2.5 text-[1.625rem] font-medium tracking-tight">
              {formatGameTitle(locale, challenge.gameId)}
            </h2>

            {/* Metadata grid */}
            <dl className="mt-4 grid grid-cols-2 gap-x-3.5">
              {[
                [
                  t('daily.difficulty'),
                  formatDifficulty(locale, challenge.difficulty),
                ],
                [t('daily.level'), challenge.levelId],
                [t('daily.seed'), challenge.seed],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex justify-between py-3"
                  style={{
                    borderTop: '1px solid oklch(0.91 0.005 70 / 0.4)',
                  }}
                >
                  <dt className="eyebrow" style={{ fontSize: '0.5625rem' }}>
                    {label}
                  </dt>
                  <dd className="text-[0.8125rem] font-medium tabular-nums">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>

            <Link
              to={playRoute}
              search={playSearch}
              className={buttonVariants({ size: 'lg' })}
              style={{
                width: '100%',
                minHeight: '3.25rem',
                marginTop: '1.125rem',
                fontSize: '1rem',
              }}
            >
              {t('daily.start')} →
            </Link>
          </article>
        </main>

        <MobileTabBar
          active="daily"
          onNavigate={(tab) => {
            if (tab === 'home') void navigate({ to: '/' })
            else if (tab === 'profile') void navigate({ to: '/profile' })
          }}
        />
      </div>
    </div>
  )
}
