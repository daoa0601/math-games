import { createFileRoute, Link } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'

import { LanguageToggle } from '@math-games/ui'
import { ThemeToggle } from '@math-games/ui'
import { Badge } from '@math-games/ui'
import { Button } from '@math-games/ui'
import { Card, CardContent, CardHeader, CardTitle } from '@math-games/ui'
import { Skeleton } from '@math-games/ui'
import { useT } from '@math-games/ui'
import { GAME_MODULES } from '@/games/registry'
import {
  getCompletionRates,
  getLevelDifficulty,
  getRetention,
} from '@/classroom/analytics.functions'
import { runServerAction } from '@/routes/-server-action-result'
import { RouteErrorFallback } from '@/routes/-route-error'
import type {
  CompletionRateReport,
  RetentionReport,
  LevelDifficultyReport,
} from '@math-games/effect-classroom'

export const Route = createFileRoute('/admin/analytics')({
  component: AnalyticsDashboard,
  errorComponent: RouteErrorFallback,
})

function todayRange() {
  const today = new Date().toISOString().slice(0, 10)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000)
    .toISOString()
    .slice(0, 10)
  return { from: thirtyDaysAgo, to: today }
}

function AnalyticsDashboard() {
  const t = useT()
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
      <header className="sticky top-0 z-40 -mx-4 flex items-center justify-between gap-3 border-b border-border/50 bg-background/95 px-4 py-3 backdrop-blur-sm md:-mx-6 md:px-6">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            {t('app.title')}
          </Link>
          <span className="text-muted-foreground/50">/</span>
          <h1 className="text-xl font-bold tracking-tight">Analytics</h1>
        </div>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </header>

      <div className="flex items-center gap-3">
        <select
          value={selectedGame}
          onChange={(e) => setSelectedGame(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-2"
        >
          {GAME_MODULES.map((m) => (
            <option key={m.id} value={m.id}>
              {m.title}
            </option>
          ))}
        </select>
        <Button onClick={loadAll} disabled={loading}>
          Load Analytics
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
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-52" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-10 rounded-md" />
                <Skeleton className="h-10 rounded-md" />
                <Skeleton className="h-10 rounded-md" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!loading && completionData && (
        <Card>
          <CardHeader>
            <CardTitle>Completion Rates (30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {completionData.byGame.map((g) => (
                <div
                  key={g.gameId}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <span className="font-medium">{g.gameId}</span>
                  <div className="text-right text-sm">
                    <p>
                      {g.completions}/{g.starts} attempts
                    </p>
                    <Badge variant="outline">
                      {(g.rate * 100).toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && retentionData && (
        <Card>
          <CardHeader>
            <CardTitle>Daily Active Players</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {retentionData.dailyActive.map((d) => (
                <div
                  key={d.date}
                  className="rounded-md border px-2 py-1 text-xs"
                  title={d.date}
                >
                  {d.players}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && difficultyData && (
        <Card>
          <CardHeader>
            <CardTitle>Level Difficulty — {selectedGame}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {difficultyData.levels.map((l) => (
                <div
                  key={l.levelId}
                  className="flex items-center justify-between rounded-md border p-2 text-sm"
                >
                  <span className="font-mono">{l.levelId}</span>
                  <div className="flex gap-3 text-muted-foreground">
                    <span>avg {l.averageAttempts.toFixed(1)} tries</span>
                    <span>{(l.completionRate * 100).toFixed(0)}% pass</span>
                    <span>avg score {l.averageScore.toFixed(0)}</span>
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
