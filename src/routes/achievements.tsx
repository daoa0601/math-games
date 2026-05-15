import { createFileRoute, Link } from '@tanstack/react-router'
import { ACHIEVEMENTS } from '@/achievements/achievements.logic'
import {
  formatAchievementDescription,
  formatAchievementName,
  formatAchievementRarity,
} from '@/components/i18n-format'
import { LanguageToggle } from '@/components/language-toggle'
import { useLocale } from '@/components/locale-context'
import { ThemeToggle } from '@/components/theme-toggle'
import { useT } from '@/components/use-t'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { getPlayerProfileOverview } from '@/player/profile.functions'

export const Route = createFileRoute('/achievements')({
  loader: () => getPlayerProfileOverview(),
  component: AchievementsRoute,
})

function AchievementsRoute() {
  const overview = Route.useLoaderData()
  const achievementIds = overview.achievements
  const t = useT()
  const { locale } = useLocale()

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-5 px-4 py-6 md:gap-8 md:px-6 md:py-8">
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
            {t('achievements.title')}
          </h1>
          <Badge variant="secondary">
            {achievementIds.length}/{ACHIEVEMENTS.length}{' '}
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
          <ul className="divide-y divide-border">
            {ACHIEVEMENTS.map((achievement) => {
              const unlocked = achievementIds.includes(achievement.id)

              return (
                <li
                  className={`py-4 text-sm${unlocked ? '' : ' opacity-40'}`}
                  key={achievement.id}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">
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
