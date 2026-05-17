import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'

import { formatGameTag, formatGameTitle, formatLevelName } from '@/i18n-format'
import {
  buttonVariants,
  GameGlyph,
  type GameGlyphId,
  GamePattern,
  type PatternType,
  LanguageToggle,
  MechanicCard,
  MobileAppHeader,
  MobileTabBar,
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

const GAME_PATTERN: Record<string, PatternType> = {
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
      games: gameModules.map((module, index) => ({
        description: module.description,
        gameId: module.id,
        index: String(index + 1).padStart(2, '0'),
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
  const navigate = useNavigate()
  const progressRows = overview.progress as PlayerProgressSummary[]
  const completedCount = progressRows.filter(
    (row) => row.completedAt !== null,
  ).length
  const dailyGameId = dailyChallenge.gameId as GameGlyphId
  const dailyModule = registry[dailyChallenge.gameId as keyof typeof registry]
  const dailyTo = dailyModule?.route ?? `/games/${dailyChallenge.gameId}`
  const displayName = overview.profile.displayName

  return (
    <div className="flex min-h-screen flex-col">
      {/* ── MOBILE LAYOUT (< md) ─────────────────────────────── */}
      <div className="flex min-h-screen flex-col md:hidden">
        <MobileAppHeader playerName={displayName} />

        <main className="flex-1 overflow-auto px-4 pb-4 pt-1">
          {/* Greeting */}
          <div className="px-1 pb-3.5 pt-1.5">
            <p
              className="eyebrow tabular-nums"
              style={{ fontSize: '0.625rem' }}
            >
              {new Date()
                .toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
                  weekday: 'long',
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })
                .toUpperCase()}
            </p>
            <h1 className="font-display mt-2 text-[1.875rem] font-medium leading-[1.05] tracking-tight">
              {t('home.greeting').replace('{name}', displayName.split(' ')[0])}{' '}
              <span className="text-muted-foreground">
                {t('home.greetingCta')}
              </span>
            </h1>
          </div>

          {/* Daily Hero */}
          <DailyHeroCard
            gameId={dailyGameId}
            title={formatLevelName(locale, dailyChallenge.title)}
            to={dailyTo}
            levelId={dailyChallenge.levelId}
          />

          {/* Quick Stats */}
          <div className="mt-4 grid grid-cols-3 overflow-hidden rounded-[0.875rem] border border-border bg-card">
            {[
              {
                label: t('home.solved'),
                value: String(completedCount).padStart(2, '0'),
                sub: t('home.levels'),
              },
              {
                label: t('home.badges'),
                value: String(overview.achievements.length).padStart(2, '0'),
                sub: `/ ${games.reduce((sum, g) => sum + g.levelCount, 0)}`,
              },
              {
                label: t('home.record'),
                value: '—',
                sub: t('home.streak'),
              },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className="py-3.5 text-center"
                style={{
                  borderLeft: i > 0 ? '1px solid var(--border)' : 'none',
                  padding: '0.875rem 0.75rem',
                }}
              >
                <p className="eyebrow" style={{ fontSize: '0.5625rem' }}>
                  {stat.label}
                </p>
                <p className="font-display mt-1.5 text-[1.375rem] font-medium leading-none tracking-tight tabular-nums">
                  {stat.value}
                </p>
                <p className="mt-0.5 text-[0.625rem] text-muted-foreground">
                  {stat.sub}
                </p>
              </div>
            ))}
          </div>

          {/* Game Index */}
          <div className="mt-6 flex items-baseline justify-between px-1 pb-3">
            <h3 className="font-display text-[1.0625rem] font-medium tracking-tight">
              {t('home.fourGames')}
            </h3>
            <span className="eyebrow" style={{ fontSize: '0.5625rem' }}>
              {t('home.selectPractice')}
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {games.map((game) => {
              const progress = summarizeProgress(progressRows, game.gameId)
              const pct =
                game.levelCount > 0
                  ? Math.round((progress.completed / game.levelCount) * 100)
                  : 0

              return (
                <GameIndexCard
                  key={game.gameId}
                  gameId={game.gameId as GameGlyphId}
                  index={game.index}
                  completed={progress.completed}
                  total={game.levelCount}
                  pct={pct}
                  to={game.to}
                />
              )
            })}
          </div>
        </main>

        <MobileTabBar
          active="home"
          onNavigate={(tab) => {
            if (tab === 'daily') void navigate({ to: '/daily' })
            else if (tab === 'profile') void navigate({ to: '/profile' })
          }}
        />
      </div>

      {/* ── DESKTOP LAYOUT (≥ md) ────────────────────────────── */}
      <div className="mx-auto hidden min-h-screen w-full max-w-4xl flex-col px-5 py-8 md:flex md:px-8 md:py-12">
        <header className="flex items-center justify-between gap-4">
          <Wordmark label={t('app.title')} />
          <div className="flex items-center gap-2">
            <Link
              className="group/profile flex items-center gap-2 rounded-full border border-transparent px-1.5 py-1 text-sm text-muted-foreground transition-colors hover:border-border hover:text-foreground"
              to="/profile"
            >
              <PlayerAvatar seed={displayName} className="size-7" />
              <span className="tabular-nums">{displayName}</span>
            </Link>
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </header>

        <MechanicCard game={dailyGameId} tone="hero" className="mt-8">
          <p className="eyebrow text-muted-foreground">
            {t('home.todayChallenge')}
          </p>
          <h2 className="font-display mt-2 text-3xl font-medium tracking-tight md:text-4xl">
            {formatLevelName(locale, dailyChallenge.title)}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {formatGameTitle(locale, dailyChallenge.gameId)} ·{' '}
            <span className="tabular-nums">{dailyChallenge.challengeDate}</span>
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              className={buttonVariants()}
              search={{ level: dailyChallenge.levelId }}
              to={dailyTo}
            >
              {t('home.start')} →
            </Link>
            <Link className={buttonVariants({ variant: 'ghost' })} to="/daily">
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
            {t('stats.achievements')} →
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
                  {game.description}
                </p>
                <div className="mt-auto pt-6">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="tabular-nums">
                      {progress.completed}/{game.levelCount}
                    </span>
                    <span className="tabular-nums">{pct}%</span>
                  </div>
                  <Progress value={pct} className="mt-1.5 h-2 bg-primary/15" />
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
      <span hidden>D1-backed profile state</span>
    </div>
  )
}

/* ── Daily Hero Card (mobile) ─────────────────────────────────── */

function DailyHeroCard({
  gameId,
  title,
  to,
  levelId,
}: {
  gameId: GameGlyphId
  title: string
  to: string
  levelId: string
}) {
  const t = useT()

  return (
    <Link
      to={to}
      search={{ level: levelId }}
      className={`theme-${gameId} block`}
    >
      <article
        className="relative isolate overflow-hidden rounded-[1.375rem] border border-border/60 bg-card shadow-(--card-shadow-long)"
        style={{ minHeight: '16rem', padding: '1.375rem' }}
      >
        {/* gradient */}
        <div
          className="absolute inset-0 -z-20 opacity-95"
          style={{ backgroundImage: 'var(--game-gradient)' }}
        />
        <GamePattern
          pattern={GAME_PATTERN[gameId] ?? 'constellation'}
          className="text-primary/[0.04]"
        />
        {/* hero glyph anchored bottom-right */}
        <div
          className="pointer-events-none absolute -bottom-5 -right-5"
          aria-hidden
        >
          <GameGlyph game={gameId} className="size-56 text-primary/90" />
        </div>

        <div className="relative" style={{ maxWidth: '70%' }}>
          <p className="eyebrow text-primary">● {t('home.todayChallenge')}</p>
          <h2 className="font-display mt-3 text-[1.875rem] font-medium leading-[1.02] tracking-tight">
            {title}
          </h2>
        </div>

        <div
          className="relative mt-6 flex items-center justify-between pt-3.5"
          style={{ borderTop: '1px solid oklch(0.91 0.005 70 / 0.5)' }}
        >
          <div>
            <p className="eyebrow" style={{ fontSize: '0.5625rem' }}>
              {t('home.streak')}
            </p>
            <p className="font-display mt-0.5 text-[1.375rem] font-medium leading-none tabular-nums text-chart-1">
              —
              <span className="ml-0.5 text-[0.6875rem] text-muted-foreground">
                {t('home.days')}
              </span>
            </p>
          </div>
          <span
            className={buttonVariants({ size: 'lg' })}
            style={{
              minHeight: '3rem',
              padding: '0 1.375rem',
              fontSize: '0.9375rem',
            }}
          >
            {t('home.start')} →
          </span>
        </div>
      </article>
    </Link>
  )
}

/* ── Game Index Card (mobile) ─────────────────────────────────── */

function GameIndexCard({
  gameId,
  index,
  completed,
  total,
  pct,
  to,
}: {
  gameId: GameGlyphId
  index: string
  completed: number
  total: number
  pct: number
  to: string
}) {
  const t = useT()
  const { locale } = useLocale()

  return (
    <Link
      to={to}
      search={{ level: undefined }}
      className={`theme-${gameId} block`}
    >
      <article className="relative isolate overflow-hidden rounded-2xl border border-border/60 bg-card p-[1.125rem] shadow-(--card-shadow-long)">
        <div
          className="absolute inset-0 -z-20 opacity-55"
          style={{ backgroundImage: 'var(--game-gradient)' }}
        />
        <GamePattern
          pattern={GAME_PATTERN[gameId] ?? 'constellation'}
          className="text-primary/[0.03]"
        />
        <GameGlyph
          game={gameId}
          className="pointer-events-none absolute top-3.5 right-3.5 size-14 text-primary/95"
        />

        <div className="flex items-baseline gap-2">
          <span className="font-display text-[0.6875rem] font-medium tabular-nums tracking-[0.06em] text-primary">
            № {index}
          </span>
          <span
            className="eyebrow text-muted-foreground"
            style={{ fontSize: '0.5625rem' }}
          >
            {formatGameTag(locale, gameId)}
          </span>
        </div>
        <h4 className="font-display mt-2 pr-16 text-[1.3125rem] font-medium tracking-tight">
          {formatGameTitle(locale, gameId)}
        </h4>

        <div className="mt-3.5 pr-1">
          <div className="flex justify-between text-[0.6875rem] text-muted-foreground">
            <span className="tabular-nums">
              {completed}/{total} {t('home.levels')}
            </span>
            <span className="tabular-nums">{pct}%</span>
          </div>
          <Progress value={pct} className="mt-1 h-2 bg-primary/15" />
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[0.6875rem] text-muted-foreground" />
            <span
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
              style={{
                minHeight: '2.25rem',
                padding: '0 1rem',
                fontSize: '0.8125rem',
              }}
            >
              {completed > 0 ? t('home.continue') : t('game.play')} →
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}
