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
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { gameModules } from '@/games/registry'
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

const RANKS = [
  { name: 'Explorer', threshold: 0 },
  { name: 'Builder', threshold: 4 },
  { name: 'Strategist', threshold: 10 },
  { name: 'Scholar', threshold: 20 },
  { name: 'Grandmaster', threshold: 35 },
] as const

function summarizeProfile(
  progressRows: PlayerProgressSummary[],
  achievements: readonly string[],
) {
  const completed = progressRows.filter((row) => row.completedAt !== null)
  const totalAttempts = progressRows.reduce((sum, row) => sum + row.attempts, 0)
  const score = completed.length * 2 + achievements.length
  const currentRank =
    [...RANKS].reverse().find((rank) => score >= rank.threshold) ?? RANKS[0]
  const nextRank = RANKS.find((rank) => rank.threshold > score) ?? null
  const rankProgress =
    nextRank === null
      ? 100
      : Math.round(
          ((score - currentRank.threshold) /
            (nextRank.threshold - currentRank.threshold)) *
            100,
        )

  return {
    completedCount: completed.length,
    currentRank,
    nextRank,
    rankProgress,
    score,
    totalAttempts,
  }
}

function summarizeGame(progressRows: PlayerProgressSummary[], gameId: string) {
  const rows = progressRows.filter((row) => row.gameId === gameId)
  const completed = rows.filter((row) => row.completedAt !== null).length
  const attempts = rows.reduce((sum, row) => sum + row.attempts, 0)
  const bestScore = rows.reduce((best, row) => Math.max(best, row.bestScore), 0)

  return {
    attempts,
    bestScore,
    completed,
    rows: rows.length,
  }
}

function ProfileRoute() {
  const overview = Route.useLoaderData()
  const saveProfile = useServerFn(updatePlayerProfile)
  const [profile, setProfile] = useState(overview.profile)
  const [status, setStatus] = useState<string | null>(null)
  const progressRows = overview.progress as PlayerProgressSummary[]
  const achievements = overview.achievements as string[]
  const profileSummary = summarizeProfile(progressRows, achievements)

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

      <section className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">{t('profile.rank')}</p>
            <p className="mt-2 text-2xl font-semibold">
              {profileSummary.currentRank.name}
            </p>
            <Progress
              className="mt-4 h-2"
              value={profileSummary.rankProgress}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              {profileSummary.nextRank
                ? `${profileSummary.score}/${profileSummary.nextRank.threshold} ${t('profile.toNextRank')} ${profileSummary.nextRank.name}`
                : t('profile.topRank')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t('stats.completed')}
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {profileSummary.completedCount}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t('profile.totalAttempts')}
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {profileSummary.totalAttempts}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t('stats.achievements')}
            </p>
            <p className="mt-2 text-2xl font-semibold">{achievements.length}</p>
          </CardContent>
        </Card>
      </section>

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

            <h2 className="text-xl font-semibold">{t('profile.breakdown')}</h2>
            <div className="mt-4 grid gap-3">
              {gameModules.map((module) => {
                const summary = summarizeGame(progressRows, module.id)
                const completedPercent =
                  module.levelCount === 0
                    ? 0
                    : (summary.completed / module.levelCount) * 100

                return (
                  <div className="border-t border-border pt-3" key={module.id}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold">{module.title}</span>
                      <span className="text-sm text-muted-foreground">
                        {summary.completed}/{module.levelCount}
                      </span>
                    </div>
                    <Progress className="mt-2 h-2" value={completedPercent} />
                    <dl className="mt-2 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                      <div>
                        <dt>{t('stats.progress')}</dt>
                        <dd className="mt-1 font-medium text-foreground">
                          {summary.rows}
                        </dd>
                      </div>
                      <div>
                        <dt>{t('profile.totalAttempts')}</dt>
                        <dd className="mt-1 font-medium text-foreground">
                          {summary.attempts}
                        </dd>
                      </div>
                      <div>
                        <dt>{t('profile.bestScore')}</dt>
                        <dd className="mt-1 font-medium text-foreground">
                          {summary.bestScore}
                        </dd>
                      </div>
                    </dl>
                  </div>
                )
              })}
            </div>

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
