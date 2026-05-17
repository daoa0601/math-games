import { createFileRoute, Link } from '@tanstack/react-router'
import { ACHIEVEMENTS } from '@/achievements/achievements.logic'
import {
  formatAchievementDescription,
  formatAchievementName,
  formatAchievementRarity,
} from '@/i18n-format'
import { LanguageToggle } from '@math-games/ui'
import { useLocale } from '@math-games/ui'
import { ThemeToggle } from '@math-games/ui'
import { useT } from '@math-games/ui'
import { Badge } from '@math-games/ui'
import { Card, CardContent } from '@math-games/ui'
import { getPlayerProfileOverview } from '@/player/profile.functions'
import type { AchievementRarity } from '@/games/game-module'
import { RouteErrorFallback } from '@/routes/-route-error'
import { RoutePending } from '@/routes/-route-pending'

const RARITY_STYLES: Record<AchievementRarity, string> = {
  common: 'border-l-muted-foreground/50',
  rare: 'border-l-blue-500',
  epic: 'border-l-purple-500',
  legendary: 'border-l-amber-500',
}

export const Route = createFileRoute('/achievements')({
  loader: () => getPlayerProfileOverview(),
  component: AchievementsRoute,
  errorComponent: RouteErrorFallback,
  pendingComponent: RoutePending,
})

function AchievementsRoute() {
  const overview = Route.useLoaderData()
  const achievementIds = overview.achievements
  const t = useT()
  const { locale } = useLocale()

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-6 md:gap-10 md:px-6 md:py-10">
      <header className="sticky top-0 z-40 -mx-4 flex items-center justify-between gap-3 border-b border-border/50 bg-background/95 px-4 py-3 backdrop-blur-sm md:-mx-6 md:px-6">
        <div className="flex items-center gap-3">
          <Link
            className="text-sm text-muted-foreground transition-colors hover:text-primary"
            to="/"
          >
            {t('app.title')}
          </Link>
          <span className="text-muted-foreground/50">/</span>
          <h1 className="font-display text-xl font-semibold tracking-tight md:text-2xl">
            {t('achievements.title')}
          </h1>
          <Badge variant="secondary">
            <span className="font-bold tabular-nums">
              {achievementIds.length}/{ACHIEVEMENTS.length}
            </span>{' '}
            {t('achievements.unlocked')}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </header>

      <Card>
        <CardContent>
          <ul className="divide-y divide-border/50">
            {ACHIEVEMENTS.map((achievement) => {
              const unlocked = achievementIds.includes(achievement.id)

              return (
                <li
                  className={`border-l-4 py-4 pl-4 text-sm transition-opacity ${RARITY_STYLES[achievement.rarity]} ${unlocked ? '' : 'opacity-40 grayscale'}`}
                  key={achievement.id}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold">
                      {formatAchievementName(locale, achievement.id)}
                    </span>
                    <Badge variant="secondary">
                      {formatAchievementRarity(locale, achievement.rarity)}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatAchievementDescription(locale, achievement.id)}
                  </p>
                </li>
              )
            })}
          </ul>
        </CardContent>
      </Card>
    </main>
  )
}
