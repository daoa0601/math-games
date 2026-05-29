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
import { PracticeGeneratorSection } from '@/games/practice-generator-section'
import { validateLevelSearch } from '@/games/level-search'
import { validate, difficulties } from '@math-games/game-fraction-builder'
import type { Difficulty } from '@math-games/game-fraction-builder'
import { getFractionBuilderPracticeConfig } from '@math-games/game-fraction-builder'
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
  const navigate = useNavigate()
  const { configs, initialConfigId } = Route.useLoaderData()
  const { level: searchLevel } = Route.useSearch()
  const recordProgress = useServerFn(recordFractionBuilderProgress)

  const [numerator, setNumerator] = useState<number | null>(null)
  const [denominator, setDenominator] = useState<number | null>(null)
  const [compareAnswer, setCompareAnswer] = useState<string | null>(null)
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null)
  const { saveStatus, setSaveStatus, clearSaveStatus } = useSaveStatus()

  const {
    config: level,
    configIndex: levelIndex,
    availableConfigs,
    selectLevel: selectLevelRaw,
    addAndSelectConfig,
  } = useLevelSelection({
    configs,
    initialConfigId,
    searchLevel,
    onReset: () => {
      resetState()
    },
  })

  const progressLabels = { unlocked: t('status.unlocked') }

  function generatePracticeLevel(seed: string, difficulty: string) {
    addAndSelectConfig(
      getFractionBuilderPracticeConfig(seed, difficulty as Difficulty),
    )
  }

  const difficultyOptions = difficulties.map((value) => ({
    value,
    label: formatDifficulty(locale, value),
  }))

  function resetState() {
    setNumerator(null)
    setDenominator(null)
    setCompareAnswer(null)
    setResult(null)
    clearSaveStatus()
  }

  function handleNext() {
    const next = availableConfigs[levelIndex + 1] ?? availableConfigs[0]
    selectLevelRaw(next)
  }

  async function handleSubmit() {
    const completion =
      level.mode === 'compare'
        ? { numerator: 0, denominator: 1, compareAnswer: compareAnswer ?? '' }
        : { numerator: numerator ?? 0, denominator: denominator ?? 0 }

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
    level.mode === 'build'
      ? 'fb.mode.build'
      : level.mode === 'simplify'
        ? 'fb.mode.simplify'
        : 'fb.mode.compare'
  const modeLabel = t(modeKey)

  return (
    <>
      {/* ── DESKTOP LAYOUT (≥ md) ────────────────────────────── */}
      <GameDesktopShell
        game="fraction-builder"
        levelTitle={t('gameTitle.fractionBuilder')}
        meta={
          <LevelNav
            currentIndex={levelIndex}
            total={availableConfigs.length}
            onPrev={() => selectLevelRaw(availableConfigs[levelIndex - 1])}
            onNext={() => selectLevelRaw(availableConfigs[levelIndex + 1])}
          />
        }
      >
        <div className="relative">
          <Confetti active={result === 'correct'} />
        </div>

        <Card className="game-card-bg border-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge variant="outline">{modeLabel}</Badge>
              <Badge variant="secondary">
                {formatDifficulty(locale, level.difficulty)}
              </Badge>
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
                  <div
                    role="group"
                    aria-label={t('fb.numerator')}
                    className="grid grid-cols-2 gap-2"
                  >
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
                  <div
                    role="group"
                    aria-label={t('fb.denominator')}
                    className="grid grid-cols-2 gap-2"
                  >
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

        <PracticeGeneratorSection
          title={t('game.levels')}
          description={t('fb.practiceDescription')}
          difficulties={difficultyOptions}
          defaultDifficulty="medium"
          onGenerate={generatePracticeLevel}
        >
          <LevelGrid
            items={availableConfigs.map((c) => ({
              id: c.id,
              name: t(
                c.mode === 'build'
                  ? 'fb.mode.build'
                  : c.mode === 'simplify'
                    ? 'fb.mode.simplify'
                    : 'fb.mode.compare',
              ),
              subtitle: formatDifficulty(locale, c.difficulty),
            }))}
            selectedId={level.id}
            onSelect={(id) => {
              const config = availableConfigs.find((c) => c.id === id)
              if (config) selectLevelRaw(config)
            }}
          />
        </PracticeGeneratorSection>
      </GameDesktopShell>

      {/* ── MOBILE LAYOUT (< md) ─────────────────────────────── */}
      <GameMobileShell
        game="fraction-builder"
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
          <div className="flex items-start justify-between gap-3.5 px-5 pt-4 pb-3.5">
            <div className="min-w-0 flex-1">
              <p
                className="eyebrow text-primary"
                style={{ fontSize: '0.5625rem' }}
              >
                ○ {t('game.target')}
              </p>
              <h2 className="font-display mt-1.5 text-lg font-medium tracking-tight">
                {level.mode === 'compare'
                  ? t('fb.goal.compare')
                  : level.mode === 'simplify'
                    ? `${t('fb.goal.simplify')} ${level.target[0]}⁄${level.target[1]}`
                    : t('fb.goal.build')}
                {level.mode !== 'compare' && level.mode !== 'simplify' ? (
                  <span className="text-primary">
                    {level.target[0]}⁄{level.target[1]}
                  </span>
                ) : null}
              </h2>
            </div>
            {level.mode !== 'compare' ? (
              <div className="rounded-xl border border-primary/25 px-3.5 py-1.5 text-center">
                <p className="eyebrow" style={{ fontSize: '0.5rem' }}>
                  {t('game.target')}
                </p>
                <MobileFractionStack
                  n={level.target[0]}
                  d={level.target[1]}
                  color="var(--primary)"
                />
              </div>
            ) : null}
          </div>

          {/* Compare mode playfield */}
          {level.mode === 'compare' && level.compareTo ? (
            <section className="game-card-bg relative mx-4 overflow-hidden rounded-[1.375rem] border border-border/70 px-4.5 py-5.5 shadow-(--card-shadow-long)">
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3.5 pb-4.5">
                <div className="flex justify-center">
                  <MobileFractionStack
                    n={level.target[0]}
                    d={level.target[1]}
                    size="lg"
                  />
                </div>
                <div className="flex size-11 items-center justify-center rounded-xl border border-dashed border-primary/45 bg-primary/[0.04] font-display text-[1.375rem] font-medium text-primary">
                  {compareAnswer === 'left'
                    ? '>'
                    : compareAnswer === 'right'
                      ? '<'
                      : compareAnswer === 'equal'
                        ? '='
                        : '?'}
                </div>
                <div className="flex justify-center">
                  <MobileFractionStack
                    n={level.compareTo[0]}
                    d={level.compareTo[1]}
                    size="lg"
                  />
                </div>
              </div>
              <div className="border-t border-dashed border-primary/20 pt-4">
                <MobileBarRow
                  n={level.target[0]}
                  d={level.target[1]}
                  highlight={compareAnswer === 'left'}
                />
                <div className="h-2" />
                <MobileBarRow
                  n={level.compareTo[0]}
                  d={level.compareTo[1]}
                  highlight={compareAnswer === 'right'}
                />
              </div>
            </section>
          ) : (
            <section className="game-card-bg relative mx-4 flex flex-col items-center gap-2.5 overflow-hidden rounded-[1.375rem] border border-border/70 px-4.5 py-5 shadow-(--card-shadow-long)">
              <p className="eyebrow" style={{ fontSize: '0.5625rem' }}>
                ○ {t('fb.preview')}
              </p>
              <div className="flex items-center gap-4.5 px-1.5 pt-2 pb-0.5">
                <MobileFractionStack
                  n={numerator ?? level.target[0]}
                  d={denominator ?? level.target[1]}
                  size="lg"
                  faded={numerator === null || denominator === null}
                />
                <span className="font-display text-[1.75rem] leading-none text-muted-foreground">
                  =
                </span>
                <MobileFractionStack
                  n={level.target[0]}
                  d={level.target[1]}
                  size="lg"
                  color="var(--primary)"
                />
              </div>
              {result === 'correct' ? (
                <span className="font-mono inline-flex items-center gap-1.5 rounded-full border border-line-correct/30 bg-line-correct/10 px-2.5 py-1 text-[0.6875rem] font-medium text-line-correct">
                  ✓ {t('stats.solved')}
                </span>
              ) : null}
            </section>
          )}

          {/* Picker or operator picker */}
          {level.mode === 'compare' ? (
            <div className="px-4 pt-3.5">
              <div className="flex items-baseline justify-between px-0.5 pb-2.5">
                <span className="eyebrow" style={{ fontSize: '0.5625rem' }}>
                  {t('fb.chooseOperator')}
                </span>
                <span
                  className="font-display tabular-nums text-muted-foreground"
                  style={{ fontSize: '0.6875rem' }}
                >
                  3
                </span>
              </div>
              <div className="flex gap-2.5">
                {(
                  [
                    {
                      key: 'left',
                      symbol: '>',
                      label: t('fb.operatorGreater'),
                    },
                    {
                      key: 'equal',
                      symbol: '=',
                      label: t('fb.operatorEqual'),
                    },
                    {
                      key: 'right',
                      symbol: '<',
                      label: t('fb.operatorLess'),
                    },
                  ] as const
                ).map(({ key, symbol, label }) => {
                  const on = compareAnswer === key
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setCompareAnswer(key)}
                      disabled={result !== null}
                      className={`flex min-h-[5.75rem] flex-1 flex-col items-center justify-center gap-1 rounded-[1.125rem] border bg-card shadow-(--card-shadow-long) disabled:opacity-50 ${
                        on ? 'border-primary bg-primary/10' : 'border-border'
                      }`}
                    >
                      <span
                        className={`font-display text-4xl font-medium leading-none ${
                          on ? 'text-primary' : 'text-foreground'
                        }`}
                      >
                        {symbol}
                      </span>
                      <span
                        className={`eyebrow ${on ? 'text-primary' : 'text-muted-foreground'}`}
                        style={{ fontSize: '0.5rem' }}
                      >
                        {label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="px-4 pt-3.5">
              <div className="flex items-baseline justify-between px-0.5 pb-2">
                <span className="eyebrow" style={{ fontSize: '0.5625rem' }}>
                  {t('fb.numerator')}
                </span>
                <span
                  className="font-display tabular-nums text-muted-foreground"
                  style={{ fontSize: '0.6875rem' }}
                >
                  {t('fb.pickOne')}
                </span>
              </div>
              <div
                className="grid gap-2"
                style={{
                  gridTemplateColumns: `repeat(${Math.min(6, level.choices.length)}, 1fr)`,
                }}
              >
                {level.choices.map((n) => {
                  const on = numerator === n
                  return (
                    <button
                      key={`n-${n}`}
                      type="button"
                      onClick={() => setNumerator(n)}
                      disabled={result !== null}
                      className={`aspect-square rounded-xl border font-display text-xl font-medium ${
                        on
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-card text-foreground'
                      }`}
                    >
                      {n}
                    </button>
                  )
                })}
              </div>
              <div className="flex items-center gap-2.5 px-1 pt-3 pb-1.5">
                <span
                  className="font-mono text-muted-foreground"
                  style={{ fontSize: '0.625rem', letterSpacing: '0.04em' }}
                >
                  —
                </span>
                <div className="h-0.5 flex-1 rounded-sm bg-foreground/85" />
                <span
                  className="font-mono text-muted-foreground"
                  style={{ fontSize: '0.625rem', letterSpacing: '0.04em' }}
                >
                  —
                </span>
              </div>
              <div className="flex items-baseline justify-between px-0.5 pb-2">
                <span className="eyebrow" style={{ fontSize: '0.5625rem' }}>
                  {t('fb.denominator')}
                </span>
                <span
                  className="font-display tabular-nums text-muted-foreground"
                  style={{ fontSize: '0.6875rem' }}
                >
                  {t('fb.pickOne')}
                </span>
              </div>
              <div
                className="grid gap-2"
                style={{
                  gridTemplateColumns: `repeat(${Math.min(6, level.choices.length)}, 1fr)`,
                }}
              >
                {level.choices.map((n) => {
                  const on = denominator === n
                  return (
                    <button
                      key={`d-${n}`}
                      type="button"
                      onClick={() => setDenominator(n)}
                      disabled={result !== null}
                      className={`aspect-square rounded-xl border font-display text-xl font-medium ${
                        on
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-card text-foreground'
                      }`}
                    >
                      {n}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {saveStatus ? (
            <p className="mx-4 mt-2 text-center text-[0.6875rem] text-muted-foreground">
              {saveStatus}
            </p>
          ) : null}

          {/* Bottom actions */}
          <div className="mt-auto grid grid-cols-2 gap-2 border-t border-border bg-card/60 px-4 pt-3.5 pb-4">
            <button
              type="button"
              onClick={resetState}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-background text-[0.8125rem] font-medium text-foreground"
            >
              ↺ {t('game.reset')}
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
                disabled={
                  level.mode === 'compare'
                    ? !compareAnswer
                    : numerator === null || denominator === null
                }
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

function MobileFractionStack({
  n,
  d,
  size = 'md',
  color = 'var(--foreground)',
  faded = false,
}: {
  n: number
  d: number
  size?: 'md' | 'lg'
  color?: string
  faded?: boolean
}) {
  const big = size === 'lg'
  const num = big ? 28 : 18
  const w = big ? 36 : 22
  return (
    <div
      className="font-display inline-flex flex-col items-center gap-0.5 tabular-nums"
      style={{ color, opacity: faded ? 0.4 : 1 }}
    >
      <span style={{ fontSize: num, fontWeight: 500, lineHeight: 1 }}>{n}</span>
      <span
        style={{
          width: w,
          height: 2,
          background: 'currentColor',
          borderRadius: 2,
        }}
      />
      <span style={{ fontSize: num, fontWeight: 500, lineHeight: 1 }}>{d}</span>
    </div>
  )
}

function MobileBarRow({
  n,
  d,
  highlight,
}: {
  n: number
  d: number
  highlight: boolean
}) {
  const pct = (n / d) * 100
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="font-display min-w-8 font-medium tabular-nums text-muted-foreground"
        style={{ fontSize: '0.75rem' }}
      >
        {n}/{d}
      </span>
      <div className="relative h-4 flex-1 overflow-hidden rounded-md border border-primary/20 bg-primary/[0.06]">
        {Array.from({ length: d - 1 }).map((_, i) => (
          <span
            key={i}
            className="absolute top-0 bottom-0 w-px bg-primary/25"
            style={{ left: `${((i + 1) / d) * 100}%` }}
          />
        ))}
        <div
          className="absolute inset-0"
          style={{
            width: `${pct}%`,
            background: highlight ? 'var(--line-correct)' : 'var(--primary)',
            opacity: highlight ? 0.85 : 0.75,
          }}
        />
      </div>
      <span
        className="font-mono min-w-9 text-right tabular-nums text-muted-foreground"
        style={{ fontSize: '0.625rem' }}
      >
        {(n / d).toFixed(2)}
      </span>
    </div>
  )
}
