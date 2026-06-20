import { getRouteApi } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useEffect, useMemo, useRef, useState } from 'react'

const routeApi = getRouteApi('/games/magic-graph')

import { Badge } from '@math-games/ui'
import { Confetti } from '@math-games/ui'
import {
  formatAchievementName,
  formatDifficulty,
  formatLevelName,
} from '@/i18n-format'
import { GameDesktopShell, GameMobileShell, LevelNav } from '@math-games/ui'
import { useNavigate } from '@tanstack/react-router'
import { getHints } from '@math-games/ui'
import { useLocale } from '@math-games/ui'
import { LearnSection } from '@math-games/ui'
import { LevelGrid } from '@/games/level-grid'
import { PracticeGeneratorSection } from '@/games/practice-generator-section'
import { Button } from '@math-games/ui'
import { Card, CardContent, CardHeader } from '@math-games/ui'
import {
  useGameSession,
  useLevelSelection,
  useSaveStatus,
} from '@math-games/ui'
import { ErrorPopup } from '@/games/error-popup'
import { getLineStatus, isPuzzleSolved } from '@math-games/game-magic-graph'
import type { GraphNode, PuzzleConfig } from '@math-games/game-magic-graph'
import { getMagicGraphPracticeConfig } from '@math-games/game-magic-graph'
import type { MagicGraphPracticeDifficulty } from '@math-games/game-magic-graph'
import { recordMagicGraphProgress } from '@/games/magic-graph.functions'
import {
  formatSavedProgress,
  runServerAction,
} from '@/routes/-server-action-result'
import { useT } from '@math-games/ui'

type NodeValues = Record<string, number | null>

function createInitialValues(config: PuzzleConfig): NodeValues {
  return Object.fromEntries(config.nodes.map((node) => [node.id, node.value]))
}

function createNodeValueMap(values: NodeValues) {
  return new Map(Object.entries(values))
}

export function MagicGraphRoute() {
  const t = useT()
  const { locale } = useLocale()
  const navigate = useNavigate()
  const { configs, initialConfigId } = routeApi.useLoaderData()
  const { level: searchLevel, daily } = routeApi.useSearch()
  const recordProgress = useServerFn(recordMagicGraphProgress)

  const [selectedNumber, setSelectedNumber] = useState<number | null>(null)
  const [errorPopup, setErrorPopup] = useState<string | null>(null)
  const [levelAttempts, setLevelAttempts] = useState(0)
  const prevAllFilledRef = useRef(false)
  const { saveStatus, setSaveStatus, clearSaveStatus } = useSaveStatus()

  const {
    config,
    configIndex,
    availableConfigs,
    selectLevel,
    addAndSelectConfig,
  } = useLevelSelection({
    configs,
    initialConfigId,
    searchLevel,
    onReset: (newConfig) => {
      setValues(createInitialValues(newConfig))
      setSelectedNumber(null)
      clearSaveStatus()
      setLevelAttempts(0)
    },
  })

  // Initialize from the resolved level (initialConfigId / ?level=), not
  // configs[0] — they differ, and a mismatched key set renders empty nodes
  // as filled.
  const [values, setValues] = useState<NodeValues>(() =>
    createInitialValues(config),
  )

  const nodeValues = useMemo(() => createNodeValueMap(values), [values])
  const nodeLookup = useMemo(
    () => new Map(config.nodes.map((node) => [node.id, node])),
    [config.nodes],
  )
  const lineStatuses = useMemo(
    () =>
      config.lines.map((line) =>
        getLineStatus(line, nodeValues, config.targetSum),
      ),
    [config.lines, config.targetSum, nodeValues],
  )
  const usedNumbers = useMemo(
    () =>
      new Set(
        Object.values(values).filter(
          (value): value is number => value !== null,
        ),
      ),
    [values],
  )
  const solved = isPuzzleSolved(config.lines, nodeValues, config.targetSum)
  const session = useGameSession({ completed: solved, resetKey: config.id })
  const hints = getHints('magic-graph', locale)
  const filledCount = Object.values(values).filter(
    (value) => value !== null,
  ).length
  const allFilled = filledCount === config.nodes.length

  useEffect(() => {
    const justFilled = allFilled && !prevAllFilledRef.current
    prevAllFilledRef.current = allFilled
    if (!justFilled || session.timedOut) return

    if (solved) {
      void recordAttempt(values)
    } else {
      setErrorPopup(t('game.incorrectSolution'))
    }
  }, [allFilled])
  const progressLabels = { unlocked: t('status.unlocked') }

  async function recordAttempt(submission: NodeValues) {
    const result = await runServerAction(
      () =>
        recordProgress({
          data: {
            levelId: config.id,
            completion: { nodeValues: submission },
            ...(daily ? { challengeDate: daily } : {}),
          },
        }),
      t('status.progressSaveFailed'),
    )

    if (!result.ok) {
      setSaveStatus(result.message)
      return
    }

    setLevelAttempts(result.value.attempts)
    setSaveStatus(
      formatSavedProgress(result.value, progressLabels, (achievementId) =>
        formatAchievementName(locale, achievementId),
      ),
    )
  }

  function placeNumber(node: GraphNode) {
    if (session.timedOut) return
    if (node.isFixed) return

    if (values[node.id] !== null) {
      setValues({ ...values, [node.id]: null })
      clearSaveStatus()
      return
    }

    if (selectedNumber === null) return

    const nextValues = { ...values }
    for (const nodeId of Object.keys(nextValues)) {
      if (nextValues[nodeId] === selectedNumber) {
        nextValues[nodeId] = null
      }
    }
    nextValues[node.id] = selectedNumber

    setValues(nextValues)
    setSelectedNumber(null)
    clearSaveStatus()
  }

  function resetPuzzle() {
    setValues(createInitialValues(config))
    setSelectedNumber(null)
    clearSaveStatus()
    session.resetSession()
  }

  function generatePracticePuzzle(seed: string, difficulty: string) {
    const nextConfig = getMagicGraphPracticeConfig(
      seed,
      difficulty as MagicGraphPracticeDifficulty,
    )
    addAndSelectConfig(nextConfig)
  }

  const timerLabel =
    session.mode === 'timed'
      ? `${Math.floor(session.remainingSeconds / 60)
          .toString()
          .padStart(2, '0')}:${(session.remainingSeconds % 60)
          .toString()
          .padStart(2, '0')}`
      : `${Math.floor(session.elapsedSeconds / 60)
          .toString()
          .padStart(2, '0')}:${(session.elapsedSeconds % 60)
          .toString()
          .padStart(2, '0')}`
  const availableNumbers = config.availableNumbers
  const remainingCount = availableNumbers.filter(
    (n) => !usedNumbers.has(n),
  ).length

  return (
    <>
      {/* ── DESKTOP LAYOUT (≥ md) ────────────────────────────── */}
      <GameDesktopShell
        game="magic-graph"
        levelTitle={formatLevelName(locale, config.name)}
        maxWidth="5xl"
        meta={
          <div className="flex items-center gap-2">
            <LevelNav
              currentIndex={configIndex}
              total={availableConfigs.length}
              onPrev={() => selectLevel(availableConfigs[configIndex - 1])}
              onNext={() => selectLevel(availableConfigs[configIndex + 1])}
            />
            <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium tabular-nums text-primary">
              {t('game.target')} {config.targetSum}
            </span>
          </div>
        }
      >
        <section className="relative grid gap-6 md:grid-cols-[1.15fr_0.85fr]">
          <Confetti active={solved} />
          <Card className="game-card-bg relative overflow-hidden border-0">
            <CardContent className="relative z-10">
              <div className="relative mx-auto aspect-[300/220] max-w-[520px]">
                <svg
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full"
                  viewBox="0 0 300 220"
                >
                  {lineStatuses.map((line) => {
                    const points = line.nodeIds.flatMap((nodeId) => {
                      const node = nodeLookup.get(nodeId)
                      return node
                        ? [`${node.position.x},${node.position.y}`]
                        : []
                    })

                    const color =
                      line.status === 'correct'
                        ? 'var(--line-correct)'
                        : line.status === 'incorrect' ||
                            line.status === 'overflow'
                          ? 'var(--line-incorrect)'
                          : 'var(--line-pending)'

                    return (
                      <polyline
                        fill="none"
                        key={line.id}
                        points={points.join(' ')}
                        stroke={color}
                        strokeLinecap="round"
                        strokeWidth="3"
                        style={
                          line.status === 'correct'
                            ? {
                                filter:
                                  'drop-shadow(0 0 4px var(--line-correct))',
                              }
                            : undefined
                        }
                      />
                    )
                  })}
                </svg>

                {config.nodes.map((node) => {
                  const filled = values[node.id] !== null
                  return (
                    <button
                      aria-label={`Node ${node.id}`}
                      className={`absolute flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 text-lg font-bold shadow-md transition-all ${
                        node.isFixed
                          ? 'border-muted bg-muted/60 text-muted-foreground'
                          : filled
                            ? 'border-primary bg-primary text-primary-foreground shadow-primary/25'
                            : 'border-primary/50 bg-card hover:border-primary hover:shadow-lg'
                      } ${filled ? 'animate-node-pop' : ''}`}
                      disabled={node.isFixed}
                      key={node.id}
                      onClick={() => placeNumber(node)}
                      style={{
                        left: `${(node.position.x / 300) * 100}%`,
                        top: `${(node.position.y / 220) * 100}%`,
                      }}
                      type="button"
                    >
                      {values[node.id] ?? ''}
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            <Card className="border border-border/60 shadow-(--card-shadow-long)">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-bold leading-none">
                    {t('game.numbers')}
                  </h2>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant={
                          session.mode === 'practice' ? 'default' : 'outline'
                        }
                        onClick={() => session.setMode('practice')}
                        type="button"
                      >
                        {t('game.practice')}
                      </Button>
                      <Button
                        size="sm"
                        variant={
                          session.mode === 'timed' ? 'default' : 'outline'
                        }
                        onClick={() => session.setMode('timed')}
                        type="button"
                      >
                        {t('game.timed')}
                      </Button>
                    </div>
                    <Badge
                      variant={session.timedOut ? 'destructive' : 'secondary'}
                    >
                      {session.mode === 'timed'
                        ? `${Math.floor(session.remainingSeconds / 60)}:${(session.remainingSeconds % 60).toString().padStart(2, '0')}`
                        : `${Math.floor(session.elapsedSeconds / 60)}:${(session.elapsedSeconds % 60).toString().padStart(2, '0')}`}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {config.availableNumbers.map((number) => (
                    <Button
                      variant={
                        selectedNumber === number ? 'default' : 'outline'
                      }
                      size="lg"
                      className={`py-3 text-lg font-bold transition-all ${
                        selectedNumber === number
                          ? 'shadow-md shadow-primary/20 ring-2 ring-primary/30'
                          : 'hover:shadow-md'
                      }`}
                      disabled={session.timedOut || usedNumbers.has(number)}
                      key={number}
                      onClick={() => setSelectedNumber(number)}
                      type="button"
                    >
                      {number}
                    </Button>
                  ))}
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={resetPuzzle}
                    type="button"
                  >
                    {t('game.reset')}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => session.setPaused(!session.paused)}
                    type="button"
                  >
                    {session.paused ? t('game.resume') : t('game.pause')}
                  </Button>
                </div>

                <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    {t('stats.filled') + ' '}
                    {filledCount}/{config.nodes.length}
                  </span>
                  {levelAttempts > 0 ? (
                    <span>
                      {t('profile.attempts')} {levelAttempts}
                    </span>
                  ) : null}
                  <span>
                    {solved
                      ? t('stats.solved')
                      : `${selectedNumber !== null ? `${t('game.selected') + ': '}${selectedNumber}` : t('game.tapNumber')}`}
                  </span>
                </div>

                {saveStatus ? (
                  <p className="mt-3 border-t border-border pt-3 text-sm text-muted-foreground">
                    {saveStatus}
                  </p>
                ) : null}

                {session.timedOut ? (
                  <p className="mt-3 border-t border-border pt-3 text-sm font-medium text-destructive">
                    {t('game.timedOut')}
                  </p>
                ) : null}
              </CardContent>
            </Card>

            {hints.length > 0 ? (
              <Card className="border border-primary/15 bg-primary/[0.04] shadow-none">
                <CardContent>
                  <h3 className="text-sm font-bold text-primary">
                    {t('game.hints')}
                  </h3>
                  <ul className="mt-2 grid gap-1.5 text-sm text-muted-foreground">
                    {hints.map((hint) => (
                      <li key={hint}>- {hint}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ) : null}

            {errorPopup ? (
              <ErrorPopup
                message={errorPopup}
                dismissLabel={t('game.tryAgain')}
                onDismiss={() => setErrorPopup(null)}
              />
            ) : null}
          </div>
        </section>

        <PracticeGeneratorSection
          title={t('game.puzzles')}
          description={t('game.templatesDescription')}
          difficulties={[
            { value: 'easy', label: t('diff.easy') },
            { value: 'medium', label: t('diff.medium') },
            { value: 'hard', label: t('diff.hard') },
          ]}
          defaultDifficulty="medium"
          onGenerate={generatePracticePuzzle}
        >
          <LevelGrid
            items={availableConfigs.map((puzzle) => ({
              id: puzzle.id,
              name: puzzle.name,
              subtitle: `${formatDifficulty(locale, puzzle.difficulty)} · ${puzzle.nodes.length} ${t('stats.nodes')} · ${t('game.target')} ${puzzle.targetSum}`,
            }))}
            selectedId={config.id}
            onSelect={(id) => {
              const puzzle = availableConfigs.find((c) => c.id === id)
              if (puzzle) selectLevel(puzzle)
            }}
          />
        </PracticeGeneratorSection>

        <LearnSection gameId="magic-graph" />
      </GameDesktopShell>

      {/* ── MOBILE LAYOUT (< md) ─────────────────────────────── */}
      <GameMobileShell
        game="magic-graph"
        levelTitle={`${t('stats.levels')} ${String(configIndex + 1).padStart(2, '0')} / ${String(availableConfigs.length).padStart(2, '0')}`}
        backLabel={t('app.dashboard')}
        onBack={() => void navigate({ to: '/' })}
        meta={
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/[0.08] px-2.5 py-1.5">
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              className="text-primary"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
            <span className="font-display text-[0.8125rem] font-medium tabular-nums text-primary">
              {timerLabel}
            </span>
          </div>
        }
      >
        <main className="flex flex-1 flex-col overflow-auto">
          {/* Goal band */}
          <div className="flex items-start justify-between gap-3.5 px-5 pt-4 pb-3.5">
            <div className="min-w-0 flex-1">
              <p
                className="eyebrow text-primary"
                style={{ fontSize: '0.5625rem' }}
              >
                ○ {formatLevelName(locale, config.name)}
              </p>
              <h2 className="font-display mt-1.5 text-lg font-medium tracking-tight">
                {t('game.target')}{' '}
                <span className="font-display tabular-nums text-primary">
                  {config.targetSum}
                </span>
              </h2>
            </div>
            <div className="rounded-xl border border-primary/25 px-3.5 py-2 text-center">
              <p className="eyebrow" style={{ fontSize: '0.5rem' }}>
                {t('game.target')}
              </p>
              <p className="font-display text-[1.375rem] font-medium leading-none tabular-nums text-primary">
                {config.targetSum}
              </p>
            </div>
          </div>

          {/* Playfield */}
          <section
            className="game-card-bg relative mx-4 flex min-h-[22.5rem] flex-1 flex-col justify-center overflow-hidden rounded-[1.375rem] border border-border/70 px-4 py-4.5 shadow-(--card-shadow-long)"
            style={{ padding: '1.125rem 1rem' }}
          >
            <Confetti active={solved} />
            <div className="relative mx-auto aspect-[300/220] w-full max-w-md">
              <svg
                aria-hidden="true"
                className="absolute inset-0 h-full w-full"
                viewBox="0 0 300 220"
              >
                {lineStatuses.map((line) => {
                  const points = line.nodeIds.flatMap((nodeId) => {
                    const node = nodeLookup.get(nodeId)
                    return node ? [`${node.position.x},${node.position.y}`] : []
                  })
                  const color =
                    line.status === 'correct'
                      ? 'var(--line-correct)'
                      : line.status === 'incorrect' ||
                          line.status === 'overflow'
                        ? 'var(--line-incorrect)'
                        : 'var(--line-pending)'
                  return (
                    <polyline
                      fill="none"
                      key={line.id}
                      points={points.join(' ')}
                      stroke={color}
                      strokeLinecap="round"
                      strokeWidth="3"
                    />
                  )
                })}
              </svg>

              {config.nodes.map((node) => {
                const filled = values[node.id] !== null
                return (
                  <button
                    aria-label={`Node ${node.id}`}
                    className={`absolute flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 font-display text-lg font-medium shadow-md transition-all ${
                      node.isFixed
                        ? 'border-muted bg-muted/60 text-muted-foreground'
                        : filled
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-primary/50 bg-card'
                    } ${filled ? 'animate-node-pop' : ''}`}
                    disabled={node.isFixed}
                    key={node.id}
                    onClick={() => placeNumber(node)}
                    style={{
                      left: `${(node.position.x / 300) * 100}%`,
                      top: `${(node.position.y / 220) * 100}%`,
                    }}
                    type="button"
                  >
                    {values[node.id] ?? ''}
                  </button>
                )
              })}
            </div>
          </section>

          {/* Hint chip */}
          {hints.length > 0 ? (
            <div className="mx-4 mt-3.5 mb-1.5 flex items-start gap-2.5 rounded-2xl border border-primary/15 bg-primary/[0.05] px-3.5 py-3">
              <div
                className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 font-display font-medium text-primary"
                style={{ fontSize: '0.875rem' }}
              >
                ?
              </div>
              <p
                className="leading-snug text-foreground"
                style={{ fontSize: '0.75rem', lineHeight: 1.45 }}
              >
                {hints[0]}
              </p>
            </div>
          ) : null}

          {/* Number rail — bottom-fixed touch zone */}
          <div className="mt-auto border-t border-border bg-card/60 px-4 pt-3 pb-4">
            <div className="flex items-baseline justify-between px-0.5 pb-2">
              <span className="eyebrow" style={{ fontSize: '0.5625rem' }}>
                {t('game.tapNumber')}
              </span>
              <span
                className="font-display tabular-nums text-muted-foreground"
                style={{ fontSize: '0.6875rem' }}
              >
                {remainingCount} / {availableNumbers.length}
              </span>
            </div>
            <div
              className="grid gap-2"
              style={{
                gridTemplateColumns: `repeat(${Math.min(6, availableNumbers.length)}, 1fr)`,
              }}
            >
              {availableNumbers.map((number) => {
                const used = usedNumbers.has(number)
                const on = selectedNumber === number
                return (
                  <button
                    key={number}
                    type="button"
                    disabled={session.timedOut || used}
                    onClick={() => setSelectedNumber(on ? null : number)}
                    className={`aspect-square rounded-xl border font-display text-xl font-medium transition-colors ${
                      on
                        ? 'border-primary bg-primary/10 text-primary'
                        : used
                          ? 'border-border bg-primary/[0.04] text-muted-foreground line-through opacity-45'
                          : 'border-border bg-card text-foreground'
                    }`}
                  >
                    {number}
                  </button>
                )
              })}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={resetPuzzle}
                className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-border bg-background text-[0.8125rem] font-medium text-foreground"
              >
                ↺ {t('game.reset')}
              </button>
              <button
                type="button"
                onClick={() => session.setPaused(!session.paused)}
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-background text-[0.8125rem] font-medium text-foreground"
              >
                {session.paused ? t('game.resume') : t('game.pause')}
              </button>
              <button
                type="button"
                disabled={hints.length === 0}
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-background text-[0.8125rem] font-medium text-foreground disabled:opacity-50"
              >
                {t('game.hint')} · {hints.length}
              </button>
            </div>
            {saveStatus ? (
              <p className="mt-2.5 text-center text-[0.6875rem] text-muted-foreground">
                {saveStatus}
              </p>
            ) : null}
            {session.timedOut ? (
              <p className="mt-2.5 text-center text-[0.6875rem] font-medium text-destructive">
                {t('game.timedOut')}
              </p>
            ) : null}
          </div>
        </main>

        {errorPopup ? (
          <ErrorPopup
            message={errorPopup}
            dismissLabel={t('game.tryAgain')}
            onDismiss={() => setErrorPopup(null)}
          />
        ) : null}
      </GameMobileShell>
    </>
  )
}
