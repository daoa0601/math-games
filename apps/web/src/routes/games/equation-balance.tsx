import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { formatAchievementName, formatDifficulty } from '@/i18n-format'
import {
  Confetti,
  GameDesktopShell,
  GameMobileShell,
  LevelNav,
  useLevelSelection,
  useSaveStatus,
} from '@math-games/ui'
import { useLocale } from '@math-games/ui'
import { Badge } from '@math-games/ui'
import { Button } from '@math-games/ui'
import { Card, CardContent, CardHeader } from '@math-games/ui'
import { useT } from '@math-games/ui'
import { LevelGrid } from '@/games/level-grid'
import { validateLevelSearch } from '@/games/level-search'
import {
  validate,
  formatEquationTokens,
} from '@math-games/game-equation-balance'
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
  const navigate = useNavigate()
  const { configs, initialConfigId } = Route.useLoaderData()
  const { level: searchLevel } = Route.useSearch()
  const recordProgress = useServerFn(recordEquationBalanceProgress)

  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null)
  const { saveStatus, setSaveStatus, clearSaveStatus } = useSaveStatus()

  const {
    config: level,
    configIndex: levelIndex,
    availableConfigs,
    selectLevel: selectLevelRaw,
  } = useLevelSelection({
    configs,
    initialConfigId,
    searchLevel,
    onReset: () => {
      setSelectedAnswer(null)
      setResult(null)
      clearSaveStatus()
    },
  })

  const progressLabels = { unlocked: t('status.unlocked') }

  function handleNext() {
    const next = availableConfigs[levelIndex + 1] ?? availableConfigs[0]
    selectLevelRaw(next)
  }

  async function handleSubmit() {
    if (selectedAnswer === null) return

    const completion = { answer: selectedAnswer }
    const validation = validate(level, completion)
    setResult(validation.completed ? 'correct' : 'wrong')

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

  const modeKey =
    level.mode === 'fill'
      ? 'eb.mode.fill'
      : level.mode === 'one-step'
        ? 'eb.mode.oneStep'
        : 'eb.mode.twoStep'
  const modeLabel = t(modeKey)

  return (
    <>
      {/* ── DESKTOP LAYOUT (≥ md) ────────────────────────────── */}
      <GameDesktopShell
        game="equation-balance"
        levelTitle={t('gameTitle.equationBalance')}
        meta={
          <LevelNav
            currentIndex={levelIndex}
            total={availableConfigs.length}
            onPrev={() => selectLevelRaw(availableConfigs[levelIndex - 1])}
            onNext={() => selectLevelRaw(availableConfigs[levelIndex + 1])}
          />
        }
      >
        <LevelGrid
          items={availableConfigs.map((c) => ({
            id: c.id,
            name: c.mode === 'fill' ? 'Fill' : c.mode,
            subtitle: formatDifficulty(locale, c.difficulty),
          }))}
          selectedId={level.id}
          onSelect={(id) => {
            const config = availableConfigs.find((c) => c.id === id)
            if (config) selectLevelRaw(config)
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
              {formatEquationTokens(level)
                .map((token) => token.text)
                .join(' ')}
            </p>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {level.choices.map((choice) => {
                let variant: 'default' | 'outline' | 'destructive' = 'outline'
                if (result && choice === level.answer) variant = 'default'
                else if (result && choice === selectedAnswer)
                  variant = 'destructive'
                else if (!result && choice === selectedAnswer)
                  variant = 'default'

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
                  {result === 'correct'
                    ? t('stats.solved')
                    : t('game.tryAgain')}
                </p>
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
      </GameDesktopShell>

      {/* ── MOBILE LAYOUT (< md) ─────────────────────────────── */}
      <GameMobileShell
        game="equation-balance"
        levelTitle={`${t('stats.levels')} ${String(levelIndex + 1).padStart(2, '0')} / ${String(availableConfigs.length).padStart(2, '0')}`}
        backLabel={t('app.dashboard')}
        onBack={() => void navigate({ to: '/' })}
        meta={
          <div className="inline-flex items-center rounded-full border border-primary/25 bg-primary/[0.08] px-2.5 py-1.5">
            <span
              className="eyebrow text-primary"
              style={{ fontSize: '0.5rem', letterSpacing: '0.12em' }}
            >
              {modeLabel}
            </span>
          </div>
        }
      >
        <Confetti active={result === 'correct'} />

        <main className="flex flex-1 flex-col overflow-auto">
          {/* Goal band */}
          <div className="px-5 pt-4 pb-3.5">
            <p
              className="eyebrow text-primary"
              style={{ fontSize: '0.5625rem' }}
            >
              ○ {t('game.target')}
            </p>
            <h2 className="font-display mt-1.5 text-lg font-medium tracking-tight">
              {t('eb.goal')}
            </h2>
          </div>

          {/* Playfield */}
          <section className="game-card-bg relative mx-4 flex flex-col items-center gap-3.5 overflow-hidden rounded-[1.375rem] border border-border/70 px-4.5 py-5 shadow-(--card-shadow-long)">
            {/* Equation in mono */}
            <p className="font-mono inline-flex items-baseline gap-2 tabular-nums text-[1.75rem] font-medium tracking-tight">
              {formatEquationTokens(level).map((token, i) => {
                if (token.role === 'unknown') {
                  return (
                    <span
                      key={i}
                      className="font-display inline-flex size-9 translate-y-0.5 items-center justify-center rounded-[0.625rem] border border-dashed border-primary/50 bg-primary/[0.06] text-[1.375rem] font-medium text-primary"
                    >
                      {token.text}
                    </span>
                  )
                }
                if (token.role === 'operator' || token.role === 'equals') {
                  return (
                    <span key={i} className="text-muted-foreground">
                      {token.text}
                    </span>
                  )
                }
                if (token.role === 'rhs') {
                  return (
                    <span key={i} className="text-primary">
                      {token.text}
                    </span>
                  )
                }
                return <span key={i}>{token.text}</span>
              })}
            </p>

            {/* Live feedback chip */}
            {result === 'wrong' && selectedAnswer !== null ? (
              <span className="font-mono inline-flex items-center gap-1.5 rounded-full border border-line-incorrect/25 bg-line-incorrect/[0.08] px-3 py-1.5 text-[0.6875rem] font-medium text-line-incorrect">
                <span>✗</span>
                <span>{t('game.tryAgain')}</span>
              </span>
            ) : result === 'correct' ? (
              <span className="font-mono inline-flex items-center gap-1.5 rounded-full border border-line-correct/30 bg-line-correct/10 px-3 py-1.5 text-[0.6875rem] font-medium text-line-correct">
                <span>✓</span>
                <span>{t('stats.solved')}</span>
              </span>
            ) : null}
          </section>

          {/* Choice grid */}
          <div className="px-4 pt-4">
            <div className="flex items-baseline justify-between px-0.5 pb-2.5">
              <span className="eyebrow" style={{ fontSize: '0.5625rem' }}>
                {t('eb.chooseValue')}
              </span>
              <span
                className="font-display tabular-nums text-muted-foreground"
                style={{ fontSize: '0.6875rem' }}
              >
                {level.choices.length}
              </span>
            </div>
            <div
              className="grid gap-2.5"
              style={{
                gridTemplateColumns: `repeat(${Math.min(4, level.choices.length)}, 1fr)`,
              }}
            >
              {level.choices.map((n) => {
                const on = selectedAnswer === n
                const correct = result && n === level.answer
                const incorrect = result === 'wrong' && on
                const colorClass = correct
                  ? 'border-line-correct bg-line-correct/[0.08] text-line-correct'
                  : incorrect
                    ? 'border-line-incorrect bg-line-incorrect/[0.08] text-line-incorrect'
                    : on
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card text-foreground'
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setSelectedAnswer(n)}
                    disabled={result !== null}
                    className={`min-h-16 rounded-2xl border font-display text-[1.375rem] font-medium ${colorClass}`}
                  >
                    {n}
                  </button>
                )
              })}
            </div>
          </div>

          {saveStatus ? (
            <p className="mx-4 mt-2.5 text-center text-[0.6875rem] text-muted-foreground">
              {saveStatus}
            </p>
          ) : null}

          {/* Bottom actions */}
          <div className="mt-auto grid grid-cols-3 gap-2 border-t border-border bg-card/60 px-4 pt-3.5 pb-4">
            <button
              type="button"
              onClick={() => {
                setSelectedAnswer(null)
                setResult(null)
              }}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-background text-[0.8125rem] font-medium text-foreground"
            >
              ↺ {t('game.reset')}
            </button>
            <button
              type="button"
              disabled
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-background text-[0.8125rem] font-medium text-foreground disabled:opacity-50"
            >
              {t('game.hint')}
            </button>
            {result === 'correct' ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary text-[0.8125rem] font-medium text-primary-foreground"
              >
                {t('game.nextLevel')}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={selectedAnswer === null}
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary text-[0.8125rem] font-medium text-primary-foreground disabled:opacity-50"
              >
                {t('game.check')}
              </button>
            )}
          </div>
        </main>
      </GameMobileShell>
    </>
  )
}
