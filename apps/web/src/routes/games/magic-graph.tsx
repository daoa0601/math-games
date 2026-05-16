import { createFileRoute, Link } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useEffect, useMemo, useRef, useState } from 'react'

import { Badge } from '@math-games/ui'
import { Confetti } from '@math-games/ui'
import { GamePattern } from '@math-games/ui'
import {
  formatAchievementName,
  formatDifficulty,
  formatLevelName,
} from '@/i18n-format'
import { LanguageToggle } from '@math-games/ui'
import { getHints } from '@math-games/ui'
import { useLocale } from '@math-games/ui'
import { LearnSection } from '@math-games/ui'
import { ResponsiveSection } from '@math-games/ui'
import { ThemeToggle } from '@math-games/ui'
import { Button } from '@math-games/ui'
import { Card, CardContent, CardHeader } from '@math-games/ui'
import { useGameSession } from '@math-games/ui'
import { validateLevelSearch } from '@/games/level-search'
import { getLineStatus, isPuzzleSolved } from '@math-games/game-magic-graph'
import type { GraphNode, PuzzleConfig } from '@math-games/game-magic-graph'
import { getMagicGraphPracticeConfig } from '@math-games/game-magic-graph'
import type { MagicGraphPracticeDifficulty } from '@math-games/game-magic-graph'
import {
  getMagicGraphLevel,
  recordMagicGraphProgress,
} from '@/games/magic-graph.functions'
import {
  formatSavedProgress,
  runServerAction,
} from '@/routes/-server-action-result'
import { useT } from '@math-games/ui'

export const Route = createFileRoute('/games/magic-graph')({
  validateSearch: validateLevelSearch,
  loader: () => getMagicGraphLevel(),
  component: MagicGraphRoute,
})

type NodeValues = Record<string, number | null>

function createInitialValues(config: PuzzleConfig): NodeValues {
  return Object.fromEntries(config.nodes.map((node) => [node.id, node.value]))
}

function createNodeValueMap(values: NodeValues) {
  return new Map(Object.entries(values))
}

function MagicGraphRoute() {
  const t = useT()
  const { locale } = useLocale()
  const { configs, initialConfigId } = Route.useLoaderData()
  const { level: searchLevel } = Route.useSearch()
  const recordProgress = useServerFn(recordMagicGraphProgress)
  const [availableConfigs, setAvailableConfigs] = useState(configs)
  const [practiceSeed, setPracticeSeed] = useState('')
  const [practiceDifficulty, setPracticeDifficulty] =
    useState<MagicGraphPracticeDifficulty>('medium')
  const requestedPuzzleId = searchLevel
    ? (availableConfigs.find((candidate) => candidate.id === searchLevel)?.id ??
      initialConfigId)
    : undefined
  const [selectedPuzzleId, setSelectedPuzzleId] = useState(
    requestedPuzzleId ?? initialConfigId,
  )
  const config = useMemo(
    () =>
      availableConfigs.find((candidate) => candidate.id === selectedPuzzleId) ??
      availableConfigs[0],
    [availableConfigs, selectedPuzzleId],
  )
  const [values, setValues] = useState(() => createInitialValues(config))
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null)
  const [saveStatus, setSaveStatus] = useState<string | null>(null)
  const [errorPopup, setErrorPopup] = useState<string | null>(null)
  const [levelAttempts, setLevelAttempts] = useState(0)
  const prevAllFilledRef = useRef(false)

  useEffect(() => {
    if (!saveStatus) return
    const timer = setTimeout(() => setSaveStatus(null), 5000)
    return () => clearTimeout(timer)
  }, [saveStatus])

  useEffect(() => {
    if (!requestedPuzzleId) return

    const nextConfig =
      availableConfigs.find(
        (candidate) => candidate.id === requestedPuzzleId,
      ) ?? availableConfigs[0]

    if (nextConfig.id === selectedPuzzleId) return

    setSelectedPuzzleId(nextConfig.id)
    setValues(createInitialValues(nextConfig))
    setSelectedNumber(null)
    setSaveStatus(null)
  }, [availableConfigs, requestedPuzzleId, selectedPuzzleId])

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
      setSaveStatus(null)
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
    setSaveStatus(null)
  }

  function resetPuzzle() {
    setValues(createInitialValues(config))
    setSelectedNumber(null)
    setSaveStatus(null)
    session.resetSession()
  }

  function selectPuzzle(puzzle: PuzzleConfig) {
    setSelectedPuzzleId(puzzle.id)
    setValues(createInitialValues(puzzle))
    setSelectedNumber(null)
    setSaveStatus(null)
    setLevelAttempts(0)
    session.resetSession()
  }

  function generatePracticePuzzle() {
    const seed = practiceSeed.trim() || `practice-${Date.now()}`
    const nextConfig = getMagicGraphPracticeConfig(seed, practiceDifficulty)

    setAvailableConfigs((currentConfigs) => [
      nextConfig,
      ...currentConfigs.filter((candidate) => candidate.id !== nextConfig.id),
    ])
    selectPuzzle(nextConfig)
  }

  return (
    <main className="theme-magic-graph mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 py-6 md:gap-10 md:px-6 md:py-10">
      <header className="sticky top-0 z-40 -mx-4 flex items-center justify-between gap-3 border-b border-border/50 bg-background/95 px-4 py-3 backdrop-blur-sm md:-mx-6 md:px-6">
        <div className="flex items-center gap-3 overflow-hidden">
          <Link
            className="shrink-0 text-sm text-muted-foreground transition-colors hover:text-primary"
            to="/"
          >
            {t('app.title')}
          </Link>
          <span className="text-muted-foreground/50">/</span>
          <h1 className="truncate text-xl font-bold tracking-tight md:text-2xl">
            {formatLevelName(locale, config.name)}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
            {t('game.target')} {config.targetSum}
          </span>
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </header>

      <section className="relative grid gap-6 md:grid-cols-[1.15fr_0.85fr]">
        <Confetti
          active={solved}
          colors={['#7c3aed', '#a78bfa', '#c4b5fd', '#8b5cf6', '#6d28d9']}
        />
        <Card className="game-card-bg relative overflow-hidden border border-primary/15 shadow-xl shadow-primary/5">
          <GamePattern pattern="constellation" />
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
                      style={
                        line.status === 'correct'
                          ? { filter: 'drop-shadow(0 0 4px var(--line-correct))' }
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
          <Card className="border-0 shadow-lg">
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
                      variant={session.mode === 'timed' ? 'default' : 'outline'}
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
                    variant={selectedNumber === number ? 'default' : 'outline'}
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
            <Card className="border-0 bg-primary/5 shadow-sm">
              <CardContent>
                <h3 className="text-sm font-bold text-primary">{t('game.hints')}</h3>
                <ul className="mt-2 grid gap-1.5 text-sm text-muted-foreground">
                  {hints.map((hint) => (
                    <li key={hint}>- {hint}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}

          {errorPopup ? (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
              onClick={() => setErrorPopup(null)}
            >
              <Card
                className="mx-4 max-w-sm"
                onClick={(event) => event.stopPropagation()}
              >
                <CardContent className="text-center">
                  <p className="text-sm font-medium text-destructive">
                    {errorPopup}
                  </p>
                  <Button
                    className="mt-4 w-full"
                    variant="outline"
                    onClick={() => setErrorPopup(null)}
                    type="button"
                  >
                    {t('game.tryAgain')}
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </div>
      </section>

      <ResponsiveSection
        title={t('game.puzzles')}
        description={t('game.templatesDescription')}
        className="border-y border-border py-5"
        actions={
          <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
            <input
              aria-label={t('game.practiceSeed')}
              className="rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/50"
              onChange={(event) => setPracticeSeed(event.currentTarget.value)}
              placeholder={t('game.practiceSeed')}
              value={practiceSeed}
            />
            <select
              aria-label={t('game.practiceDifficulty')}
              className="rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/50"
              onChange={(event) =>
                setPracticeDifficulty(
                  event.currentTarget.value as MagicGraphPracticeDifficulty,
                )
              }
              value={practiceDifficulty}
            >
              <option value="easy">{t('diff.easy')}</option>
              <option value="medium">{t('diff.medium')}</option>
              <option value="hard">{t('diff.hard')}</option>
            </select>
            <Button onClick={generatePracticePuzzle} type="button">
              {t('game.generate')}
            </Button>
          </div>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {availableConfigs.map((puzzle) => {
            const selected = puzzle.id === config.id

            return (
              <button
                className={
                  selected
                    ? 'rounded-lg border border-primary bg-primary px-4 py-4 text-left text-primary-foreground'
                    : 'rounded-lg border border-border px-4 py-4 text-left hover:border-primary'
                }
                key={puzzle.id}
                onClick={() => selectPuzzle(puzzle)}
                type="button"
              >
                <span className="block font-semibold">
                  {formatLevelName(locale, puzzle.name)}
                </span>
                <span className="mt-1 block text-sm capitalize opacity-80">
                  {formatDifficulty(locale, puzzle.difficulty)} ·{' '}
                  {puzzle.nodes.length} {t('stats.nodes')} · {t('game.target')}{' '}
                  {puzzle.targetSum}
                </span>
              </button>
            )
          })}
        </div>
      </ResponsiveSection>

      <LearnSection gameId="magic-graph" />
    </main>
  )
}
