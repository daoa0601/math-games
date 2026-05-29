import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { LanguageToggle, ThemeToggle, Wordmark } from '@math-games/ui'
import { Badge } from '@math-games/ui'
import { Button } from '@math-games/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@math-games/ui'
import { Progress } from '@math-games/ui'
import { Skeleton } from '@math-games/ui'
import { useT } from '@math-games/ui'
import { GAME_MODULES } from '@/games/registry'
import {
  getCompletionRates,
  getLevelDifficulty,
  getRetention,
} from '@/classroom/analytics.functions'
import { runServerAction } from '@/routes/-server-action-result'
import type {
  CompletionRateReport,
  RetentionReport,
  LevelDifficultyReport,
} from '@math-games/effect-classroom'
import { formatGameTitle } from '@/i18n-format'
import { useLocale } from '@math-games/ui'

function todayRange() {
  const today = new Date().toISOString().slice(0, 10)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000)
    .toISOString()
    .slice(0, 10)
  return { from: thirtyDaysAgo, to: today }
}

export function AnalyticsDashboard() {
  const t = useT()
  const { locale } = useLocale()
  const completionRatesFn = useServerFn(getCompletionRates)
  const levelDifficultyFn = useServerFn(getLevelDifficulty)
  const retentionFn = useServerFn(getRetention)

  const [completionData, setCompletionData] =
    useState<CompletionRateReport | null>(null)
  const [retentionData, setRetentionData] = useState<RetentionReport | null>(
    null,
  )
  const [difficultyData, setDifficultyData] =
    useState<LevelDifficultyReport | null>(null)
  const [selectedGame, setSelectedGame] = useState<string>(GAME_MODULES[0].id)
  const [loading, setLoading] = useState(false)

  async function loadAll() {
    setLoading(true)
    const range = todayRange()

    const [cr, ret, diff] = await Promise.all([
      runServerAction(
        () => completionRatesFn({ data: range }),
        'Failed to load completion rates.',
      ),
      runServerAction(
        () => retentionFn({ data: range }),
        'Failed to load retention.',
      ),
      runServerAction(
        () => levelDifficultyFn({ data: { gameId: selectedGame } }),
        'Failed to load difficulty.',
      ),
    ])

    if (cr.ok) setCompletionData(cr.value)
    if (ret.ok) setRetentionData(ret.value)
    if (diff.ok) setDifficultyData(diff.value)
    setLoading(false)
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 py-6 md:gap-10 md:px-6 md:py-10">
      <header className="sticky top-0 z-40 -mx-4 flex items-center justify-between gap-3 border-b border-border/60 bg-background px-4 py-3 md:-mx-6 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <a
            href="/"
            className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
          >
            <Wordmark compact label={t('app.title')} />
          </a>
          <span aria-hidden className="text-border">
            /
          </span>
          <h1 className="font-display truncate text-base font-medium tracking-tight md:text-lg">
            {t('analytics.title')}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </header>

      <div className="flex items-center gap-3">
        <select
          value={selectedGame}
          onChange={(e) => setSelectedGame(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/50"
        >
          {GAME_MODULES.map((m) => (
            <option key={m.id} value={m.id}>
              {formatGameTitle(locale, m.id)}
            </option>
          ))}
        </select>
        <Button onClick={loadAll} disabled={loading}>
          {t('analytics.load')}
        </Button>
      </div>

      {loading && (
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <Skeleton className="h-16 rounded-md" />
                <Skeleton className="h-16 rounded-md" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 rounded-md" />
            </CardContent>
          </Card>
        </div>
      )}

      {!loading && completionData && (
        <Card>
          <CardHeader>
            <CardTitle>{t('analytics.completionRates')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {completionData.byGame.map((g) => (
                <div
                  key={g.gameId}
                  className="space-y-2 rounded-md border border-border/60 p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {formatGameTitle(locale, g.gameId)}
                    </span>
                    <Badge variant="outline">
                      {(g.rate * 100).toFixed(1)}%
                    </Badge>
                  </div>
                  <Progress value={g.rate * 100} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {g.completions}/{g.starts} {t('analytics.attempts')}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && retentionData && (
        <Card>
          <CardHeader>
            <CardTitle>{t('analytics.dailyActive')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {retentionData.dailyActive.map((d) => {
                const max = Math.max(
                  ...retentionData.dailyActive.map((r) => r.players),
                  1,
                )
                const intensity = Math.round((d.players / max) * 4)
                const bg = [
                  'bg-muted',
                  'bg-primary/20',
                  'bg-primary/40',
                  'bg-primary/60',
                  'bg-primary/80',
                ][intensity]

                return (
                  <div
                    key={d.date}
                    className={`flex size-8 items-center justify-center rounded text-[10px] tabular-nums ${bg}`}
                    title={`${d.date}: ${d.players}`}
                  >
                    {d.players}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && difficultyData && (
        <Card>
          <CardHeader>
            <CardTitle>
              {t('analytics.levelDifficulty')} —{' '}
              {formatGameTitle(locale, selectedGame)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {difficultyData.levels.map((l) => (
                <div
                  key={l.levelId}
                  className="flex items-center justify-between rounded-md border border-border/60 p-3 text-sm"
                >
                  <span className="font-mono text-xs">{l.levelId}</span>
                  <div className="flex gap-4 text-xs tabular-nums text-muted-foreground">
                    <span>
                      {l.averageAttempts.toFixed(1)} {t('analytics.avgTries')}
                    </span>
                    <span>
                      {(l.completionRate * 100).toFixed(0)}%{' '}
                      {t('analytics.passRate')}
                    </span>
                    <span>
                      {l.averageScore.toFixed(0)} {t('analytics.avgScore')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  )
}
