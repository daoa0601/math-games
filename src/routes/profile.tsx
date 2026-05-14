/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion -- TanStack server function inference is narrower than the runtime form and D1 payload boundaries */

import { createFileRoute, Link } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import type { FormEvent } from 'react'

import { getAchievementById } from '@/achievements/achievements.logic'
import { LanguageToggle } from '@/components/language-toggle'
import { ThemeToggle } from '@/components/theme-toggle'
import { useT } from '@/components/use-t'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  getPlayerProfileOverview,
  updatePlayerProfile,
} from '@/player/profile.functions'
import type { PlayerProgressSummary } from '@/player/profile.server'
import type {
  GradeBand,
  Locale,
  PlayerProfileInput,
} from '@/player/profile.schema'
import { runServerAction } from '@/routes/-server-action-result'

export const Route = createFileRoute('/profile')({
  loader: () => getPlayerProfileOverview(),
  component: ProfileRoute,
})

function ProfileRoute() {
  const overview = Route.useLoaderData()
  const saveProfile = useServerFn(updatePlayerProfile)
  const [profile, setProfile] = useState(overview.profile)
  const [status, setStatus] = useState<string | null>(null)
  const progressRows = overview.progress as PlayerProgressSummary[]
  const achievements = overview.achievements as string[]

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    const payload: PlayerProfileInput = {
      displayName: String(formData.get('displayName')),
      locale: String(formData.get('locale')) as Locale,
      gradeBand: String(formData.get('gradeBand')) as GradeBand,
    }

    const result = await runServerAction(
      () => saveProfile({ data: payload }),
      'Profile save failed.',
    )

    if (!result.ok) {
      setStatus(result.message)
      return
    }

    setProfile(result.value)
    setStatus(t('profile.saved'))
  }

  const t = useT()

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
            {t('profile.title')}
          </h1>
          <span className="rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
            {profile.displayName}
          </span>
          <span hidden>D1-backed profile state</span>
        </div>
        <div className="flex items-center gap-1">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t('profile.account')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <label className="block text-sm font-semibold text-muted-foreground">
                {t('profile.displayName')}
                <input
                  aria-label="Display name"
                  className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-base font-normal text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/50"
                  defaultValue={profile.displayName}
                  maxLength={40}
                  minLength={2}
                  name="displayName"
                  required
                />
              </label>

              <label className="mt-4 block text-sm font-semibold text-muted-foreground">
                {t('profile.language')}
                <select
                  aria-label="Language"
                  className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-base font-normal text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/50"
                  defaultValue={profile.locale}
                  name="locale"
                >
                  <option value="en">{t('lang.english')}</option>
                  <option value="vi">{t('lang.vietnamese')}</option>
                </select>
              </label>

              <label className="mt-4 block text-sm font-semibold text-muted-foreground">
                {t('profile.gradeBand')}
                <select
                  aria-label="Grade band"
                  className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-base font-normal text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/50"
                  defaultValue={profile.gradeBand}
                  name="gradeBand"
                >
                  <option value="elementary">{t('grade.elementary')}</option>
                  <option value="middle">{t('grade.middle')}</option>
                  <option value="high">{t('grade.high')}</option>
                </select>
              </label>

              <Button className="mt-5 w-full" type="submit">
                {t('profile.save')}
              </Button>

              {status !== null ? (
                <p className="mt-4 border-t border-border pt-4 text-sm text-muted-foreground">
                  {status}
                </p>
              ) : null}
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('profile.progress')}</CardTitle>
          </CardHeader>
          <CardContent>
            {progressRows.length === 0 ? (
              <p className="text-muted-foreground">{t('profile.noProgress')}</p>
            ) : (
              <ol className="divide-y divide-border border-y border-border">
                {progressRows.map((row) => (
                  <li
                    className="grid gap-1 py-3 text-sm sm:grid-cols-[1fr_auto]"
                    key={`${row.gameId}-${row.levelId}`}
                  >
                    <span>
                      <span className="font-semibold">{row.gameId}</span> /{' '}
                      {row.levelId}
                    </span>
                    <span className="text-muted-foreground">
                      best {row.bestScore}, attempts {row.attempts}
                    </span>
                  </li>
                ))}
              </ol>
            )}

            <Separator className="my-8" />

            <h2 className="text-xl font-semibold">
              {t('profile.achievements')}
            </h2>
            {achievements.length === 0 ? (
              <p className="mt-4 text-muted-foreground">
                {t('profile.noAchievements')}
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-border border-y border-border">
                {achievements.map((achievementId) => {
                  const achievement = getAchievementById(achievementId)

                  return (
                    <li
                      className="flex items-center gap-2 py-3 text-sm"
                      key={achievementId}
                    >
                      <span className="font-semibold">
                        {achievement?.name ?? achievementId}
                      </span>
                      <Badge variant="secondary">
                        {achievement?.rarity ?? 'custom'}
                      </Badge>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
