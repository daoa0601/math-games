import { createFileRoute, Link } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useEffect, useMemo, useState } from 'react'

import { validateLevelSearch } from '@/games/level-search'
import {
  applyMove,
  createGameState,
  getAIMove,
  getValidMoves,
} from '@/games/SequenceRace/logic'
import type {
  GameConfig,
  SequenceInfo,
  SequenceState,
} from '@/games/SequenceRace/logic'
import { getSequenceRacePracticeConfig } from '@/games/SequenceRace/sequence-race.catalog'
import type { SequenceRaceDifficulty } from '@/games/SequenceRace/sequence-race.catalog'
import {
  getSequenceRaceLevel,
  recordSequenceRaceProgress,
} from '@/games/SequenceRace/sequence-race.functions'

export const Route = createFileRoute('/games/sequence-race')({
  validateSearch: validateLevelSearch,
  loader: () => getSequenceRaceLevel(),
  component: SequenceRaceRoute,
})

function SequenceRaceRoute() {
  const { configs, initialConfigId, sequenceInfoByType } = Route.useLoaderData()
  const { level: searchLevel } = Route.useSearch()
  const recordProgress = useServerFn(recordSequenceRaceProgress)
  const [availableConfigs, setAvailableConfigs] = useState(configs)
  const [practiceSeed, setPracticeSeed] = useState('')
  const [practiceDifficulty, setPracticeDifficulty] =
    useState<SequenceRaceDifficulty>('medium')
  const requestedLevelId = searchLevel
    ? (availableConfigs.find((candidate) => candidate.id === searchLevel)?.id ??
      initialConfigId)
    : undefined
  const [selectedLevelId, setSelectedLevelId] = useState(
    requestedLevelId ?? initialConfigId,
  )
  const config = useMemo(
    () =>
      availableConfigs.find((candidate) => candidate.id === selectedLevelId) ??
      availableConfigs[0],
    [availableConfigs, selectedLevelId],
  )
  const sequence = config.stepPool
  const sequenceType = config.sequenceType ?? 'arithmetic'
  const sequenceInfo: SequenceInfo = sequenceInfoByType[sequenceType]
  const [game, setGame] = useState(() => createGameState(config))
  const [saveStatus, setSaveStatus] = useState<string | null>(null)
  const validMoves = useMemo(() => getValidMoves(game), [game])

  useEffect(() => {
    if (!requestedLevelId) return

    const nextConfig =
      availableConfigs.find((candidate) => candidate.id === requestedLevelId) ??
      availableConfigs[0]

    if (nextConfig.id === selectedLevelId) return

    setSelectedLevelId(nextConfig.id)
    setGame(createGameState(nextConfig))
    setSaveStatus(null)
  }, [availableConfigs, requestedLevelId, selectedLevelId])

  const progressPercent = Math.round((game.currentPosition / game.target) * 100)

  async function finishTurn(nextGame: SequenceState) {
    setGame(nextGame)

    if (!nextGame.gameOver) {
      setSaveStatus(null)
      return
    }

    try {
      const progress = await recordProgress({
        data: {
          levelId: config.id,
          completion: {
            history: nextGame.history.map((entry) => ({
              actor: entry.actor,
              step: entry.step,
            })),
          },
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

  async function playMove(step: number) {
    let nextGame = applyMove(game, step)

    if (!nextGame.gameOver && nextGame.turn === 'ai') {
      const aiMove = getAIMove(nextGame, config.difficulty)
      nextGame = applyMove(nextGame, aiMove)
    }

    await finishTurn(nextGame)
  }

  function resetGame() {
    setGame(createGameState(config))
    setSaveStatus(null)
  }

  function selectLevel(nextLevel: GameConfig) {
    setSelectedLevelId(nextLevel.id)
    setGame(createGameState(nextLevel))
    setSaveStatus(null)
  }

  function generatePracticeLevel() {
    const seed = practiceSeed.trim() || `practice-${Date.now()}`
    const nextConfig = getSequenceRacePracticeConfig(seed, practiceDifficulty)

    setAvailableConfigs((currentConfigs) => [
      nextConfig,
      ...currentConfigs.filter((candidate) => candidate.id !== nextConfig.id),
    ])
    selectLevel(nextConfig)
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
            {sequenceInfo.name}: {sequenceInfo.description}
          </p>
        </div>
        <div className="border border-neutral-300 px-4 py-3 text-sm">
          <div className="font-semibold uppercase text-neutral-500">Target</div>
          <div className="text-3xl font-semibold">{config.target}</div>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
        <div className="border border-neutral-300 p-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">Race Line</h2>
            <span className="text-sm text-neutral-600">
              {game.currentPosition} / {game.target}
            </span>
          </div>

          <div className="mt-5 h-4 border border-neutral-950">
            <div
              className="h-full bg-neutral-950 transition-[width]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {sequence.map((step, index) => (
              <button
                className="border border-neutral-950 px-4 py-4 text-left text-lg font-semibold disabled:border-neutral-200 disabled:text-neutral-300"
                disabled={game.gameOver || !validMoves.includes(step)}
                key={`${step}-${index}`}
                onClick={() => void playMove(step)}
                type="button"
              >
                +{step}
              </button>
            ))}
          </div>
        </div>

        <aside className="border border-neutral-300 p-5">
          <h2 className="text-xl font-semibold">Run</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <div className="flex justify-between border-b border-neutral-200 pb-2">
              <dt className="text-neutral-600">Difficulty</dt>
              <dd className="font-medium capitalize">{config.difficulty}</dd>
            </div>
            <div className="flex justify-between border-b border-neutral-200 pb-2">
              <dt className="text-neutral-600">Formula</dt>
              <dd className="font-medium">{sequenceInfo.formula}</dd>
            </div>
            <div className="flex justify-between border-b border-neutral-200 pb-2">
              <dt className="text-neutral-600">Turn</dt>
              <dd className="font-medium capitalize">{game.turn}</dd>
            </div>
            <div className="flex justify-between border-b border-neutral-200 pb-2">
              <dt className="text-neutral-600">Winner</dt>
              <dd className="font-medium capitalize">{game.winner ?? '-'}</dd>
            </div>
          </dl>

          <button
            className="mt-5 w-full border border-neutral-950 px-4 py-3 font-semibold"
            onClick={resetGame}
            type="button"
          >
            Reset
          </button>

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
            <h2 className="text-xl font-semibold">Levels</h2>
            <p className="mt-2 text-neutral-700">
              Presets and seeded practice levels share the same portable engine.
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
                  event.currentTarget.value as SequenceRaceDifficulty,
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
              onClick={generatePracticeLevel}
              type="button"
            >
              Generate
            </button>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {availableConfigs.map((optionLevel) => {
            const levelSequenceType = optionLevel.sequenceType ?? 'arithmetic'
            const info = sequenceInfoByType[levelSequenceType]
            const selected = optionLevel.id === config.id

            return (
              <button
                className={
                  selected
                    ? 'border border-neutral-950 bg-neutral-950 px-4 py-4 text-left text-white'
                    : 'border border-neutral-300 px-4 py-4 text-left text-neutral-950 hover:border-neutral-950'
                }
                key={optionLevel.id}
                onClick={() => selectLevel(optionLevel)}
                type="button"
              >
                <span className="block font-semibold">{optionLevel.name}</span>
                <span className="mt-1 block text-sm capitalize opacity-80">
                  {optionLevel.difficulty} · {info.name} · target{' '}
                  {optionLevel.target}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="border-y border-neutral-300 py-5">
        <h2 className="text-xl font-semibold">Moves</h2>
        {game.history.length === 0 ? (
          <p className="mt-3 text-neutral-600">No moves recorded.</p>
        ) : (
          <ol className="mt-4 grid gap-2">
            {game.history.map((entry, index) => (
              <li
                className="flex justify-between border-b border-neutral-200 py-2 text-sm"
                key={`${entry.actor}-${entry.position}-${index}`}
              >
                <span className="capitalize">{entry.actor}</span>
                <span>
                  +{entry.step} to {entry.position}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  )
}
