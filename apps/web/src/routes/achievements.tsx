import { createFileRoute, Link } from '@tanstack/react-router'
import { ACHIEVEMENTS } from '@/achievements/achievements.logic'
import {
  formatAchievementDescription,
  formatAchievementName,
  formatAchievementRarity,
} from '@/i18n-format'
import {
  LanguageToggle,
  RaritySigil,
  ThemeToggle,
  useLocale,
  useT,
  Wordmark,
} from '@math-games/ui'
import { getPlayerProfileOverview } from '@/player/profile.functions'
import type { AchievementRarity } from '@/games/game-module'
import { RouteErrorFallback } from '@/routes/-route-error'
import { RoutePending } from '@/routes/-route-pending'

export const Route = createFileRoute('/achievements')({
  loader: () => getPlayerProfileOverview(),
  component: AchievementsRoute,
  errorComponent: RouteErrorFallback,
  pendingComponent: RoutePending,
})

const RARITY_ORDER: Record<AchievementRarity, number> = {
  legendary: 0,
  epic: 1,
  rare: 2,
  common: 3,
}

function AchievementsRoute() {
  const overview = Route.useLoaderData()
  const achievementIds = overview.achievements
  const t = useT()
  const { locale } = useLocale()

  const sorted = [...ACHIEVEMENTS].sort((a, b) => {
    const aUnlocked = achievementIds.includes(a.id) ? 0 : 1
    const bUnlocked = achievementIds.includes(b.id) ? 0 : 1
    if (aUnlocked !== bUnlocked) return aUnlocked - bUnlocked
    return RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity]
  })

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
            {t('achievements.title')}
          </h1>
        </div>
        <div className="flex items-center gap-1">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </header>

      <p className="mt-2 text-sm text-muted-foreground">
        <strong className="font-medium tabular-nums text-foreground">
          {achievementIds.length}/{ACHIEVEMENTS.length}
        </strong>{' '}
        {t('achievements.unlocked')}
      </p>

      <section className="mt-8 grid gap-3 sm:grid-cols-2">
        {sorted.map((achievement) => {
          const unlocked = achievementIds.includes(achievement.id)

          return (
            <div
              key={achievement.id}
              className={
                'group relative flex items-start gap-4 rounded-2xl border border-border/60 bg-card p-5 shadow-(--card-shadow-long) transition-opacity'
              }
            >
              <RaritySigil
                rarity={achievement.rarity}
                locked={!unlocked}
                className="size-11 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <h3
                    className={
                      unlocked
                        ? 'font-display text-base font-medium tracking-tight'
                        : 'font-display text-base font-medium tracking-tight text-muted-foreground'
                    }
                  >
                    {formatAchievementName(locale, achievement.id)}
                  </h3>
                  <span className="text-[0.65rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    {formatAchievementRarity(locale, achievement.rarity)}
                  </span>
                </div>
                <p
                  className={
                    unlocked
                      ? 'mt-1 text-sm leading-relaxed text-muted-foreground'
                      : 'mt-1 text-sm leading-relaxed text-muted-foreground/60'
                  }
                >
                  {formatAchievementDescription(locale, achievement.id)}
                </p>
              </div>
            </div>
          )
        })}
      </section>
    </main>
  )
}
