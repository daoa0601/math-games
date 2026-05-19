import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { formatAchievementName, formatDifficulty } from '@/i18n-format'
import { Confetti, GameChrome, LevelNav } from '@math-games/ui'
import { useLocale } from '@math-games/ui'
import { Badge } from '@math-games/ui'
import { Button } from '@math-games/ui'
import { Card, CardContent, CardHeader } from '@math-games/ui'
import { useT } from '@math-games/ui'
import { LevelGrid } from '@/games/level-grid'
import { validateLevelSearch } from '@/games/level-search'
import type { FractionConfig } from '@math-games/game-fraction-builder'
import { validate } from '@math-games/game-fraction-builder'
import {
  getFractionBuilderCatalog,
  recordFractionBuilderProgress,
} from '@/games/fraction-builder.functions'
import {
  formatSavedProgress,
  runServerAction,
} from '@/routes/-server-action-result'
import { RouteErrorFallback } from '@/routes/-route-error'
import { GameRoutePending } from '@/routes/-route-pending'

export const Route = createFileRoute('/games/fraction-builder')({
  validateSearch: validateLevelSearch,
  loader: () => getFractionBuilderCatalog(),
  component: FractionBuilderRoute,
  errorComponent: RouteErrorFallback,
  pendingComponent: GameRoutePending,
})

function FractionBuilderRoute() {
  const t = useT()
  const { locale } = useLocale()
  const { configs, initialConfigId } = Route.useLoaderData()
  const { level: searchLevel } = Route.useSearch()
  const recordProgress = useServerFn(recordFractionBuilderProgress)

  const initialId = searchLevel ?? initialConfigId
  const [currentLevelId, setCurrentLevelId] = useState(initialId)
  const [numerator, setNumerator] = useState<number | null>(null)
  const [denominator, setDenominator] = useState<number | null>(null)
  const [compareAnswer, setCompareAnswer] = useState<string | null>(null)
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<string | null>(null)

  const level = configs.find((c) => c.id === currentLevelId) ?? configs[0]
  const levelIndex = configs.indexOf(level)

  const progressLabels = { unlocked: t('status.unlocked') }

  function selectLevel(config: FractionConfig) {
    setCurrentLevelId(config.id)
    resetState()
  }

  function resetState() {
    setNumerator(null)
    setDenominator(null)
    setCompareAnswer(null)
    setResult(null)
    setFeedback(null)
    setSaveStatus(null)
  }

  function handleNext() {
    const next = configs[levelIndex + 1] ?? configs[0]
    selectLevel(next)
  }

  async function handleSubmit() {
    const completion =
      level.mode === 'compare'
        ? { numerator: 0, denominator: 1, compareAnswer: compareAnswer ?? '' }
        : { numerator: numerator ?? 0, denominator: denominator ?? 0 }

    const validation = validate(level, completion)
    setResult(validation.completed ? 'correct' : 'wrong')
    if (!validation.completed && validation.feedback?.kind === 'generic') {
      setFeedback(validation.feedback.message)
    }

    const res = await runServerAction(
      () =>
        recordProgress({
          data: {
            levelId: level.id,
            completion,
          },
        }),
      t('status.progressSaveFailed'),
    )

    if (res.ok) {
      const msg = formatSavedProgress(res.value, progressLabels, (id) =>
        formatAchievementName(locale, id),
      )
      if (msg) setSaveStatus(msg)
    }
  }

  const modeLabel =
    level.mode === 'build'
      ? 'Build'
      : level.mode === 'simplify'
        ? 'Simplify'
        : 'Compare'

  return (
    <main className="theme-fraction-builder mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-6 md:gap-10 md:px-6 md:py-10">
      <GameChrome
        game="fraction-builder"
        levelTitle={t('gameTitle.fractionBuilder')}
        meta={
          <LevelNav
            currentIndex={levelIndex}
            total={configs.length}
            onPrev={() => selectLevel(configs[levelIndex - 1])}
            onNext={() => selectLevel(configs[levelIndex + 1])}
          />
        }
      />

      <LevelGrid
        items={configs.map((c) => ({
          id: c.id,
          name: c.mode,
          subtitle: formatDifficulty(locale, c.difficulty),
        }))}
        selectedId={level.id}
        onSelect={(id) => {
          const config = configs.find((c) => c.id === id)
          if (config) selectLevel(config)
        }}
      />

      <div className="relative">
        <Confetti active={result === 'correct'} />
      </div>

      <Card className="game-card-bg border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Badge variant="outline">{modeLabel}</Badge>
            <Badge variant="secondary">{level.difficulty}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            {level.mode === 'compare' && level.compareTo ? (
              <p className="font-mono text-2xl">
                {level.target[0]}/{level.target[1]} ⟨?⟩ {level.compareTo[0]}/
                {level.compareTo[1]}
              </p>
            ) : level.mode === 'simplify' ? (
              <p className="font-mono text-2xl">
                Simplify: {level.target[0]}/{level.target[1]}
              </p>
            ) : (
              <p className="font-mono text-2xl">
                Build: {level.target[0]}/{level.target[1]}
              </p>
            )}
          </div>

          {level.mode === 'compare' ? (
            <div className="flex justify-center gap-3">
              {(['left', 'equal', 'right'] as const).map((ans) => (
                <Button
                  key={ans}
                  variant={
                    compareAnswer === ans
                      ? 'default'
                      : result && ans === compareAnswer
                        ? 'destructive'
                        : 'outline'
                  }
                  size="lg"
                  disabled={result !== null}
                  onClick={() => setCompareAnswer(ans)}
                >
                  {ans === 'left' ? '>' : ans === 'right' ? '<' : '='}
                </Button>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-4">
              <div className="flex flex-col items-center gap-1">
                <div className="grid grid-cols-2 gap-2">
                  {level.choices.map((n) => (
                    <Button
                      key={`n-${n}`}
                      variant={numerator === n ? 'default' : 'outline'}
                      size="sm"
                      disabled={result !== null}
                      onClick={() => setNumerator(n)}
                    >
                      {n}
                    </Button>
                  ))}
                </div>
                <div className="h-0.5 w-16 bg-foreground" />
                <div className="grid grid-cols-2 gap-2">
                  {level.choices.map((n) => (
                    <Button
                      key={`d-${n}`}
                      variant={denominator === n ? 'default' : 'outline'}
                      size="sm"
                      disabled={result !== null}
                      onClick={() => setDenominator(n)}
                    >
                      {n}
                    </Button>
                  ))}
                </div>
              </div>
              {numerator !== null && denominator !== null && (
                <p className="font-mono text-3xl">
                  = {numerator}/{denominator}
                </p>
              )}
            </div>
          )}

          {result === null && (
            <Button
              onClick={handleSubmit}
              disabled={
                level.mode === 'compare'
                  ? !compareAnswer
                  : numerator === null || denominator === null
              }
              className="w-full"
            >
              {t('game.check')}
            </Button>
          )}

          {result && (
            <div
              className={`rounded-lg border p-4 ${
                result === 'correct'
                  ? 'border-success/40 bg-success/[0.05]'
                  : 'border-destructive/40 bg-destructive/[0.05]'
              }`}
            >
              <p
                className={`font-display text-lg font-medium ${
                  result === 'correct' ? 'text-success' : 'text-destructive'
                }`}
              >
                {result === 'correct' ? t('stats.solved') : t('game.tryAgain')}
              </p>
              {feedback && (
                <p className="mt-1 text-sm text-muted-foreground">{feedback}</p>
              )}
              {saveStatus && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {saveStatus}
                </p>
              )}
              <Button onClick={handleNext} className="mt-3">
                {t('game.nextLevel')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
