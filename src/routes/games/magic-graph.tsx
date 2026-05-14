import { createFileRoute, Link } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useEffect, useMemo, useState } from 'react'

import { validateLevelSearch } from '@/games/level-search'
import { getLineStatus, isPuzzleSolved, solve } from '@/games/MagicGraph/logic'
import type { GraphNode, PuzzleConfig } from '@/games/MagicGraph/logic'
import { getMagicGraphPracticeConfig } from '@/games/MagicGraph/magic-graph.catalog'
import type { MagicGraphPracticeDifficulty } from '@/games/MagicGraph/magic-graph.catalog'
import {
  getMagicGraphLevel,
  recordMagicGraphProgress,
} from '@/games/MagicGraph/magic-graph.functions'

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
  const filledCount = Object.values(values).filter(
    (value) => value !== null,
  ).length

  async function recordAttempt(submission: NodeValues) {
    try {
      const progress = await recordProgress({
        data: {
          levelId: config.id,
          completion: { nodeValues: submission },
        },
      })
      const unlocked =
        progress.unlockedAchievements.length > 0
          ? ` Unlocked ${progress.unlockedAchievements.join(', ')}.`
          : ''
      setSaveStatus(
        `Saved attempt ${progress.attempts}; best score ${progress.bestScore}.${unlocked}`,
      )
    } catch (error) {
      setSaveStatus(
        error instanceof Error ? error.message : 'Progress save failed.',
      )
    }
  }

  function placeNumber(node: GraphNode) {
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

  async function applySolution() {
    const [solution] = solve(
      config.nodes,
      config.lines,
      config.availableNumbers,
      config.targetSum,
      1,
    )

    const solvedValues: NodeValues = Object.fromEntries(
      config.nodes.map((node) => [
        node.id,
        node.isFixed ? node.value : (solution.get(node.id) ?? null),
      ]),
    )

    setValues(solvedValues)
    await recordAttempt(solvedValues)
  }

  async function checkCurrent() {
    await recordAttempt(values)
  }

  function resetPuzzle() {
    setValues(createInitialValues(config))
    setSelectedNumber(null)
    setSaveStatus(null)
  }

  function selectPuzzle(puzzle: PuzzleConfig) {
    setSelectedPuzzleId(puzzle.id)
    setValues(createInitialValues(puzzle))
    setSelectedNumber(null)
    setSaveStatus(null)
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
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-8 text-neutral-950">
      <header className="flex flex-col gap-4 border-b border-neutral-300 pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <Link
            className="text-sm text-neutral-600 hover:text-neutral-950"
            to="/"
          >
            Math Games
          </Link>
          <h1 className="mt-3 text-4xl font-semibold">{config.name}</h1>
          <p className="mt-2 max-w-2xl text-neutral-700">
            Place each number once so every line totals {config.targetSum}.
          </p>
        </div>
        <div className="border border-neutral-300 px-4 py-3 text-sm">
          <div className="font-semibold uppercase text-neutral-500">Target</div>
          <div className="text-3xl font-semibold">{config.targetSum}</div>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-[1.15fr_0.85fr]">
        <div className="border border-neutral-300 p-5">
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
                        ? '#111827'
                        : line.status === 'incorrect' ||
                            line.status === 'overflow'
                          ? '#991b1b'
                          : '#a3a3a3'
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
                className="absolute flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center border border-neutral-950 bg-white text-lg font-semibold disabled:border-neutral-400 disabled:text-neutral-500"
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
        </div>

        <aside className="border border-neutral-300 p-5">
          <h2 className="text-xl font-semibold">Numbers</h2>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {config.availableNumbers.map((number) => (
              <button
                className="border border-neutral-950 px-3 py-3 font-semibold disabled:border-neutral-200 disabled:text-neutral-300"
                disabled={usedNumbers.has(number)}
                key={number}
                onClick={() => setSelectedNumber(number)}
                type="button"
              >
                {number}
              </button>
            ))}
          </div>

          <dl className="mt-5 grid gap-3 text-sm">
            <div className="flex justify-between border-b border-neutral-200 pb-2">
              <dt className="text-neutral-600">Selected</dt>
              <dd className="font-medium">{selectedNumber ?? '-'}</dd>
            </div>
            <div className="flex justify-between border-b border-neutral-200 pb-2">
              <dt className="text-neutral-600">Filled</dt>
              <dd className="font-medium">
                {filledCount} / {config.nodes.length}
              </dd>
            </div>
            <div className="flex justify-between border-b border-neutral-200 pb-2">
              <dt className="text-neutral-600">Solved</dt>
              <dd className="font-medium">{solved ? 'Yes' : 'No'}</dd>
            </div>
          </dl>

          <div className="mt-5 grid gap-2">
            <button
              className="border border-neutral-950 px-4 py-3 font-semibold"
              onClick={() => void checkCurrent()}
              type="button"
            >
              Check
            </button>
            <button
              className="border border-neutral-950 px-4 py-3 font-semibold"
              onClick={() => void applySolution()}
              type="button"
            >
              Apply Solution
            </button>
            <button
              className="border border-neutral-950 px-4 py-3 font-semibold"
              onClick={resetPuzzle}
              type="button"
            >
              Reset
            </button>
          </div>

          {saveStatus ? (
            <p className="mt-4 border-t border-neutral-200 pt-4 text-sm text-neutral-700">
              {saveStatus}
            </p>
          ) : null}
        </aside>
      </section>

      <section className="border-y border-neutral-300 py-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Puzzles</h2>
            <p className="mt-2 text-neutral-700">
              Templates and seeded practice puzzles share the same solver and
              progress writer.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
            <input
              aria-label="Practice seed"
              className="border border-neutral-950 px-3 py-2"
              onChange={(event) => setPracticeSeed(event.currentTarget.value)}
              placeholder="Practice seed"
              value={practiceSeed}
            />
            <select
              aria-label="Practice difficulty"
              className="border border-neutral-950 px-3 py-2"
              onChange={(event) =>
                setPracticeDifficulty(
                  event.currentTarget.value as MagicGraphPracticeDifficulty,
                )
              }
              value={practiceDifficulty}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            <button
              className="border border-neutral-950 px-4 py-2 font-semibold"
              onClick={generatePracticePuzzle}
              type="button"
            >
              Generate
            </button>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {availableConfigs.map((puzzle) => {
            const selected = puzzle.id === config.id

            return (
              <button
                className={
                  selected
                    ? 'border border-neutral-950 bg-neutral-950 px-4 py-4 text-left text-white'
                    : 'border border-neutral-300 px-4 py-4 text-left text-neutral-950 hover:border-neutral-950'
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
      </section>

      <section className="border-y border-neutral-300 py-5">
        <h2 className="text-xl font-semibold">Lines</h2>
        <ol className="mt-4 grid gap-2">
          {lineStatuses.map((line) => (
            <li
              className="flex justify-between border-b border-neutral-200 py-2 text-sm"
              key={line.id}
            >
              <span>{line.nodeIds.join(' + ')}</span>
              <span className="capitalize">
                {line.currentSum} / {config.targetSum} · {line.status}
              </span>
            </li>
          ))}
        </ol>
      </section>
    </main>
  )
}
