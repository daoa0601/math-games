import { createFileRoute, Link } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useEffect, useMemo, useState } from 'react'

import { Confetti } from '@/components/confetti'
import { GameSessionPanel } from '@/components/game-session-panel'
import { GamePattern } from '@/components/game-pattern'
import { LanguageToggle } from '@/components/language-toggle'
import { learnContent } from '@/components/learn-content'
import { useLocale } from '@/components/locale-context'
import { LearnSection } from '@/components/learn-section'
import { ResponsiveSection } from '@/components/responsive-section'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useGameSession } from '@/components/use-game-session'
import { validateLevelSearch } from '@/games/level-search'
import { getLineStatus, isPuzzleSolved } from '@/games/MagicGraph/logic'
import type { GraphNode, PuzzleConfig } from '@/games/MagicGraph/logic'
import { getMagicGraphPracticeConfig } from '@/games/MagicGraph/magic-graph.catalog'
import type { MagicGraphPracticeDifficulty } from '@/games/MagicGraph/magic-graph.catalog'
import {
  getMagicGraphLevel,
  recordMagicGraphProgress,
} from '@/games/MagicGraph/magic-graph.functions'
import {
  formatSavedProgress,
  runServerAction,
} from '@/routes/-server-action-result'
import { useT } from '@/components/use-t'

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
  const hints = learnContent['magic-graph'][locale].tips.items ?? []
  const filledCount = Object.values(values).filter(
    (value) => value !== null,
  ).length

  async function recordAttempt(submission: NodeValues) {
    const result = await runServerAction(
      () =>
        recordProgress({
          data: {
            levelId: config.id,
            completion: { nodeValues: submission },
          },
        }),
      'Progress save failed.',
    )

    if (!result.ok) {
      setSaveStatus(result.message)
      return
    }

    setSaveStatus(formatSavedProgress(result.value))
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

  async function checkCurrent() {
    if (session.timedOut) return
    await recordAttempt(values)
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
    <main className="theme-magic-graph mx-auto flex min-h-screen max-w-5xl flex-col gap-5 px-4 py-6 md:gap-8 md:px-6 md:py-8">
      <header className="flex items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-3 overflow-hidden">
          <Link
            className="shrink-0 text-sm text-muted-foreground hover:text-foreground"
            to="/"
          >
            {t('app.title')}
          </Link>
          <span className="text-muted-foreground">/</span>
          <h1 className="truncate text-lg font-semibold md:text-2xl">
            {config.name}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-md bg-primary/10 px-2 py-1 text-sm font-semibold text-primary">
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
        <Card className="relative overflow-hidden">
          <GamePattern pattern="triangles" />
          <CardContent className="relative">
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

                  return (
                    <polyline
                      fill="none"
                      key={line.id}
                      points={points.join(' ')}
                      stroke={
                        line.status === 'correct'
                          ? 'var(--line-correct)'
                          : line.status === 'incorrect' ||
                              line.status === 'overflow'
                            ? 'var(--line-incorrect)'
                            : 'var(--line-pending)'
                      }
                      strokeLinecap="round"
                      strokeWidth="3"
                    />
                  )
                })}
              </svg>

              {config.nodes.map((node) => (
                <button
                  aria-label={`Node ${node.id}`}
                  className={`absolute flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-primary bg-card text-lg font-semibold shadow-sm transition-colors disabled:border-muted disabled:text-muted-foreground ${values[node.id] !== null ? 'animate-node-pop' : ''}`}
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
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold leading-none">
                {t('game.numbers')}
              </h2>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {config.availableNumbers.map((number) => (
                  <Button
                    variant={selectedNumber === number ? 'default' : 'outline'}
                    size="lg"
                    className="py-3"
                    disabled={session.timedOut || usedNumbers.has(number)}
                    key={number}
                    onClick={() => setSelectedNumber(number)}
                    type="button"
                  >
                    {number}
                  </Button>
                ))}
              </div>

              <div className="mt-4 flex gap-2">
                <Button
                  className="flex-1"
                  disabled={session.timedOut}
                  onClick={() => void checkCurrent()}
                  type="button"
                >
                  {t('game.check')}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={resetPuzzle}
                  type="button"
                >
                  {t('game.reset')}
                </Button>
              </div>

              <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  {t('stats.filled') + ' '}
                  {filledCount}/{config.nodes.length}
                </span>
                <span>
                  {solved
                    ? t('stats.solved')
                    : `${selectedNumber !== null ? `${t('game.selected') + ': '}${selectedNumber}` : t('game.tapNumber')}`}
                </span>
              </div>
            </CardContent>
          </Card>

          <GameSessionPanel
            elapsedSeconds={session.elapsedSeconds}
            hints={hints}
            labels={{
              hints: t('game.hints'),
              pause: t('game.pause'),
              practice: t('game.practice'),
              resume: t('game.resume'),
              timed: t('game.timed'),
              timedOut: t('game.timedOut'),
            }}
            metricLabel={t('stats.filled')}
            metricValue={`${filledCount}/${config.nodes.length}`}
            mode={session.mode}
            paused={session.paused}
            remainingSeconds={session.remainingSeconds}
            status={saveStatus}
            timedOut={session.timedOut}
            onModeChange={session.setMode}
            onPausedChange={session.setPaused}
          />
        </div>
      </section>

      <ResponsiveSection
        title={t('game.puzzles')}
        description="Templates and seeded practice puzzles share the same solver and progress writer."
        className="border-y border-border py-5"
        actions={
          <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
            <input
              aria-label="Practice seed"
              className="rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/50"
              onChange={(event) => setPracticeSeed(event.currentTarget.value)}
              placeholder="Practice seed"
              value={practiceSeed}
            />
            <select
              aria-label="Practice difficulty"
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
                <span className="block font-semibold">{puzzle.name}</span>
                <span className="mt-1 block text-sm capitalize opacity-80">
                  {puzzle.difficulty} · {puzzle.nodes.length} nodes · target{' '}
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
