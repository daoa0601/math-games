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
import type { EquationConfig } from '@math-games/game-equation-balance'
import { validate, formatEquation } from '@math-games/game-equation-balance'
import {
  getEquationBalanceCatalog,
  recordEquationBalanceProgress,
} from '@/games/equation-balance.functions'
import {
  formatSavedProgress,
  runServerAction,
} from '@/routes/-server-action-result'
import { RouteErrorFallback } from '@/routes/-route-error'
import { GameRoutePending } from '@/routes/-route-pending'

export const Route = createFileRoute('/games/equation-balance')({
  validateSearch: validateLevelSearch,
  loader: () => getEquationBalanceCatalog(),
  component: EquationBalanceRoute,
  errorComponent: RouteErrorFallback,
  pendingComponent: GameRoutePending,
})

function EquationBalanceRoute() {
  const t = useT()
  const { locale } = useLocale()
  const { configs, initialConfigId } = Route.useLoaderData()
  const { level: searchLevel } = Route.useSearch()
  const recordProgress = useServerFn(recordEquationBalanceProgress)

  const initialId = searchLevel ?? initialConfigId
  const [currentLevelId, setCurrentLevelId] = useState(initialId)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<string | null>(null)

  const level = configs.find((c) => c.id === currentLevelId) ?? configs[0]
  const levelIndex = configs.indexOf(level)

  const progressLabels = { unlocked: t('status.unlocked') }

  function selectLevel(config: EquationConfig) {
    setCurrentLevelId(config.id)
    setSelectedAnswer(null)
    setResult(null)
    setFeedback(null)
    setSaveStatus(null)
  }

  function handleNext() {
    const next = configs[levelIndex + 1] ?? configs[0]
    selectLevel(next)
  }

  async function handleSubmit() {
    if (selectedAnswer === null) return

    const completion = { answer: selectedAnswer }
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
    level.mode === 'fill'
      ? 'Fill'
      : level.mode === 'one-step'
        ? 'One-Step'
        : 'Two-Step'

  return (
    <main className="theme-equation-balance mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-6 md:gap-10 md:px-6 md:py-10">
      <GameChrome
        game="equation-balance"
        levelTitle={t('gameTitle.equationBalance')}
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
          name: c.mode === 'fill' ? 'Fill' : c.mode,
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
          <p className="text-center font-mono text-2xl tracking-wide">
            {formatEquation(level)}
          </p>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {level.choices.map((choice) => {
              let variant: 'default' | 'outline' | 'destructive' = 'outline'
              if (result && choice === level.answer) variant = 'default'
              else if (result && choice === selectedAnswer)
                variant = 'destructive'
              else if (!result && choice === selectedAnswer) variant = 'default'

              return (
                <Button
                  key={choice}
                  variant={variant}
                  size="lg"
                  className="font-mono text-lg"
                  disabled={result !== null}
                  onClick={() => setSelectedAnswer(choice)}
                >
                  {choice}
                </Button>
              )
            })}
          </div>

          {result === null && (
            <Button
              onClick={handleSubmit}
              disabled={selectedAnswer === null}
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
