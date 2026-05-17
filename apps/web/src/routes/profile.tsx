/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion -- TanStack server function inference is narrower than the runtime form and D1 payload boundaries */

import { createFileRoute, Link } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'

import { ACHIEVEMENTS } from '@/achievements/achievements.logic'
import {
  formatGameTitle,
  formatRankName,
} from '@/i18n-format'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  type GameGlyphId,
  LanguageToggle,
  MechanicCard,
  PlayerAvatar,
  Progress,
  Separator,
  ThemeToggle,
  useLocale,
  useT,
  Wordmark,
} from '@math-games/ui'
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
import { RouteErrorFallback } from '@/routes/-route-error'
import { RoutePending } from '@/routes/-route-pending'

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
  errorComponent: RouteErrorFallback,
  pendingComponent: RoutePending,
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
            {t('profile.title')}
          </h1>
        </div>
        <div className="flex items-center gap-1">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </header>

      <Card className="mt-8 shadow-(--card-shadow-long)">
        <CardContent>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <PlayerAvatar
              seed={profile.displayName}
              className="size-20 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {t('profile.rank')}
              </p>
              <p className="font-display mt-1 text-2xl font-medium tracking-tight md:text-3xl">
                {formatRankName(locale, profileSummary.currentRank.name)}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {profile.displayName}
              </p>
              <Progress
                className="mt-4 h-2"
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
            <div className="grid shrink-0 grid-cols-3 gap-x-6 gap-y-1 text-sm sm:grid-cols-1 sm:gap-y-3">
              <div>
                <p className="text-xs text-muted-foreground">
                  {t('stats.completed')}
                </p>
                <p className="font-display text-lg font-medium tabular-nums">
                  {profileSummary.completedCount}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {t('profile.totalAttempts')}
                </p>
                <p className="font-display text-lg font-medium tabular-nums">
                  {profileSummary.totalAttempts}
                </p>
              </div>
              <Link
                to="/achievements"
                className="transition-colors hover:text-foreground"
              >
                <p className="text-xs text-muted-foreground">
                  {t('stats.achievements')}
                </p>
                <p className="font-display text-lg font-medium tabular-nums">
                  {achievementIds.length}
                  <span className="text-sm text-muted-foreground">
                    /{ACHIEVEMENTS.length}
                  </span>
                </p>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="mt-8">
        <h2 className="font-display text-lg font-medium tracking-tight">
          {t('profile.breakdown')}
        </h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          {gameModules.map((module) => {
            const summary = summarizeGame(progressRows, module.id)
            const pct =
              module.levelCount === 0
                ? 0
                : Math.round((summary.completed / module.levelCount) * 100)

            return (
              <MechanicCard key={module.id} game={module.id as GameGlyphId}>
                <h3 className="font-display text-lg font-medium tracking-tight">
                  {formatGameTitle(locale, module.id)}
                </h3>
                <div className="mt-auto pt-6">
                  <div className="flex items-baseline justify-between text-xs text-muted-foreground">
                    <span className="tabular-nums">
                      {summary.completed}/{module.levelCount}
                    </span>
                    <span className="tabular-nums">{pct}%</span>
                  </div>
                  <Progress
                    value={pct}
                    className="mt-1.5 h-2 bg-primary/15"
                  />
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div>
                      <dt>{t('stats.progress')}</dt>
                      <dd className="mt-0.5 font-medium tabular-nums text-foreground">
                        {summary.rows}
                      </dd>
                    </div>
                    <div>
                      <dt>{t('profile.totalAttempts')}</dt>
                      <dd className="mt-0.5 font-medium tabular-nums text-foreground">
                        {summary.attempts}
                      </dd>
                    </div>
                  </dl>
                </div>
              </MechanicCard>
            )
          })}
        </div>
      </section>

      <section className="mt-8 grid gap-6 md:grid-cols-2">
        <Card>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('profile.portability')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
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

            <Separator className="my-6" />

            <h3 className="text-sm font-semibold text-muted-foreground">
              {t('profile.progress')}
            </h3>
            {progressRows.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                {t('profile.noProgress')}
              </p>
            ) : (
              <ol className="mt-2 divide-y divide-border/60">
                {progressRows.slice(0, 8).map((row) => (
                  <li
                    className="grid gap-1 py-2 text-sm sm:grid-cols-[1fr_auto]"
                    key={`${row.gameId}-${row.levelId}`}
                  >
                    <span className="truncate">
                      <span className="font-medium">
                        {formatGameTitle(locale, row.gameId)}
                      </span>{' '}
                      <span className="text-muted-foreground">
                        / {row.levelId}
                      </span>
                    </span>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {t('profile.attempts')} {row.attempts}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </section>
      <span hidden>D1-backed profile state</span>
    </main>
  )
}
