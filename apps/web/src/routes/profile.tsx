/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion -- TanStack server function inference is narrower than the runtime form and D1 payload boundaries */

import { createFileRoute, Link } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'

import { ACHIEVEMENTS } from '@/achievements/achievements.logic'
import {
  formatAchievementDescription,
  formatAchievementName,
  formatAchievementRarity,
  formatGameTitle,
  formatRankName,
} from '@/i18n-format'
import { LanguageToggle } from '@math-games/ui'
import { useLocale } from '@math-games/ui'
import { ThemeToggle } from '@math-games/ui'
import { useT } from '@math-games/ui'
import { Badge } from '@math-games/ui'
import { Button } from '@math-games/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@math-games/ui'
import { Progress } from '@math-games/ui'
import { Separator } from '@math-games/ui'
import { gameModules } from '@/games/registry'
import { RANKS } from '@/player/ranks'
import {
  getPlayerProfileOverview,
  importPlayerAchievementBackup,
  updatePlayerProfile,
} from '@/player/profile.functions'
import type { PlayerProgressSummary } from '@/player/profile.server'
import type {
  GradeBand,
  Locale,
  PlayerProfileInput,
} from '@/player/profile.schema'
import { runServerAction } from '@/routes/-server-action-result'

const LOCALES: readonly Locale[] = ['en', 'vi']
const GRADE_BANDS: readonly GradeBand[] = ['elementary', 'middle', 'high']

function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value)
}

function isGradeBand(value: string): value is GradeBand {
  return (GRADE_BANDS as readonly string[]).includes(value)
}

export const Route = createFileRoute('/profile')({
  loader: () => getPlayerProfileOverview(),
  component: ProfileRoute,
})

interface AchievementBackupFile {
  app: 'math-games'
  kind: 'achievement-backup'
  version: 1
  exportedAt: string
  achievementIds: string[]
}

function createAchievementBackup(
  achievementIds: readonly string[],
): AchievementBackupFile {
  return {
    app: 'math-games',
    kind: 'achievement-backup',
    version: 1,
    exportedAt: new Date().toISOString(),
    achievementIds: [...achievementIds],
  }
}

function parseAchievementBackup(text: string): string[] | null {
  const parsed: unknown = JSON.parse(text)

  if (parsed === null || typeof parsed !== 'object') return null

  const record = parsed as Record<string, unknown>

  if (
    record.app !== 'math-games' ||
    record.kind !== 'achievement-backup' ||
    record.version !== 1 ||
    !Array.isArray(record.achievementIds)
  ) {
    return null
  }

  const achievementIds = record.achievementIds.filter(
    (id): id is string => typeof id === 'string',
  )

  return achievementIds.length > 0 ? achievementIds : null
}

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

  return {
    attempts,
    completed,
    rows: rows.length,
  }
}

function ProfileRoute() {
  const overview = Route.useLoaderData()
  const saveProfile = useServerFn(updatePlayerProfile)
  const importAchievements = useServerFn(importPlayerAchievementBackup)
  const [profile, setProfile] = useState(overview.profile)
  const [status, setStatus] = useState<string | null>(null)
  const [importStatus, setImportStatus] = useState<string | null>(null)
  const [achievementIds, setAchievementIds] = useState(
    overview.achievements as string[],
  )
  const progressRows = overview.progress as PlayerProgressSummary[]
  const profileSummary = summarizeProfile(progressRows, achievementIds)
  const t = useT()
  const { locale } = useLocale()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    const rawLocale = String(formData.get('locale'))
    const rawGradeBand = String(formData.get('gradeBand'))

    const payload: PlayerProfileInput = {
      displayName: String(formData.get('displayName')),
      locale: isLocale(rawLocale) ? rawLocale : 'en',
      gradeBand: isGradeBand(rawGradeBand) ? rawGradeBand : 'elementary',
    }

    const result = await runServerAction(
      () => saveProfile({ data: payload }),
      t('status.profileSaveFailed'),
    )

    if (!result.ok) {
      setStatus(result.message)
      return
    }

    setProfile(result.value)
    setStatus(t('profile.saved'))
  }

  function handleExportAchievements() {
    const backup = createAchievementBackup(achievementIds)
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = `math-games-achievements-${backup.exportedAt.slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  async function handleImportAchievements(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.currentTarget.files?.[0] ?? null
    event.currentTarget.value = ''

    if (file === null) {
      setImportStatus(t('profile.achievementImportEmpty'))
      return
    }

    let achievementIdsToImport: string[] | null = null

    try {
      achievementIdsToImport = parseAchievementBackup(await file.text())
    } catch {
      achievementIdsToImport = null
    }

    if (achievementIdsToImport === null) {
      setImportStatus(t('profile.achievementImportInvalid'))
      return
    }

    const result = await runServerAction(
      () =>
        importAchievements({
          data: { achievementIds: achievementIdsToImport },
        }),
      t('status.achievementImportFailed'),
    )

    if (!result.ok) {
      setImportStatus(result.message)
      return
    }

    setAchievementIds(result.value.achievementIds)
    setImportStatus(
      `${t('profile.achievementImportSuccess')} ${t(
        'status.importedAchievements',
      )}: ${result.value.achievementIds.length}.`,
    )
  }

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
            {t('profile.title')}
          </h1>
          <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
            {profile.displayName}
          </span>
          <span hidden>D1-backed profile state</span>
        </div>
        <div className="flex items-center gap-1">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </header>

      <Card className="border border-border/50 shadow-lg">
        <CardContent>
          <div className="flex items-start gap-6">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t('profile.rank')}
              </p>
              <p className="mt-1 text-2xl font-extrabold tracking-tight">
                {formatRankName(locale, profileSummary.currentRank.name)}
              </p>
              <Progress
                className="mt-3 h-3"
                value={profileSummary.rankProgress}
              />
              <p className="mt-1.5 text-xs tabular-nums text-muted-foreground">
                {profileSummary.nextRank
                  ? `${profileSummary.score}/${profileSummary.nextRank.threshold} ${t('profile.toNextRank')} ${formatRankName(
                      locale,
                      profileSummary.nextRank.name,
                    )}`
                  : t('profile.topRank')}
              </p>
            </div>
            <div className="grid shrink-0 grid-cols-3 gap-4 text-center">
              <div className="border-t-2 border-t-primary/40 pt-2">
                <p className="text-xs text-muted-foreground">
                  {t('stats.completed')}
                </p>
                <p className="mt-1 text-2xl font-extrabold tabular-nums text-primary">
                  {profileSummary.completedCount}
                </p>
              </div>
              <div className="border-t-2 border-t-accent/40 pt-2">
                <p className="text-xs text-muted-foreground">
                  {t('profile.totalAttempts')}
                </p>
                <p className="mt-1 text-2xl font-extrabold tabular-nums">
                  {profileSummary.totalAttempts}
                </p>
              </div>
              <div className="border-t-2 border-t-success/40 pt-2">
                <p className="text-xs text-muted-foreground">
                  {t('stats.achievements')}
                </p>
                <p className="mt-1 text-2xl font-extrabold tabular-nums text-success">
                  {achievementIds.length}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-6 md:grid-cols-[0.9fr_1.1fr]">
        <Card className="border border-border/50 shadow-md">
          <CardHeader>
            <CardTitle>{t('profile.account')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <label className="block text-sm font-semibold text-muted-foreground">
                {t('profile.displayName')}
                <input
                  aria-label={t('profile.displayName')}
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
                  aria-label={t('profile.language')}
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
                  aria-label={t('profile.gradeBand')}
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

            <Separator className="my-6" />

            <h2 className="text-sm font-semibold text-muted-foreground">
              {t('profile.portability')}
            </h2>
            <div className="mt-3 grid gap-2">
              <Button
                variant="outline"
                onClick={handleExportAchievements}
                type="button"
              >
                {t('profile.exportAchievements')}
              </Button>
              <label className="inline-flex h-8 cursor-pointer items-center justify-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted">
                {t('profile.importAchievements')}
                <input
                  className="sr-only"
                  type="file"
                  accept="application/json,.json"
                  onChange={(event) => void handleImportAchievements(event)}
                />
              </label>
            </div>
            {importStatus !== null ? (
              <p className="mt-4 border-t border-border pt-4 text-sm text-muted-foreground">
                {importStatus}
              </p>
            ) : null}
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
                      <span className="font-semibold">
                        {formatGameTitle(locale, row.gameId)}
                      </span>{' '}
                      / {row.levelId}
                    </span>
                    <span className="text-muted-foreground">
                      {t('profile.attempts')} {row.attempts}
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
                      <span className="font-semibold">
                        {formatGameTitle(locale, module.id)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {summary.completed}/{module.levelCount}
                      </span>
                    </div>
                    <Progress className="mt-2 h-2" value={completedPercent} />
                    <dl className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
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
                    </dl>
                  </div>
                )
              })}
            </div>

            <Separator className="my-8" />

            <h2 className="text-xl font-semibold">
              {t('profile.achievements')} ({achievementIds.length}/
              {ACHIEVEMENTS.length})
            </h2>
            <ul className="mt-4 divide-y divide-border border-y border-border">
              {ACHIEVEMENTS.map((achievement) => {
                const unlocked = achievementIds.includes(achievement.id)

                return (
                  <li
                    className={`py-3 text-sm${unlocked ? '' : ' opacity-40'}`}
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
      </section>
    </main>
  )
}
