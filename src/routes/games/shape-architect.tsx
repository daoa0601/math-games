import { createFileRoute, Link } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { lazy, Suspense, useEffect, useMemo, useState } from 'react'

import { validateLevelSearch } from '@/games/level-search'
import {
  DEFAULT_ROTATION,
  checkSolved,
  findNearestValidPosition,
  initializeGrid,
  placePiece,
  rotateBy90OnAxis,
} from '@/games/ShapeArchitect/logic'
import type {
  LevelConfig,
  Piece,
  PlacedPiece,
  Position3D,
  Rotation3D,
  SolutionStep,
} from '@/games/ShapeArchitect/logic'
import { ShapeArchitectCanvas } from '@/games/ShapeArchitect/components/ShapeArchitectCanvas'
import type { ViewMode } from '@/games/ShapeArchitect/components/ShapeArchitectCanvas'
import { useSolverWorker } from '@/games/ShapeArchitect/logic/useSolverWorker'
import { getShapeArchitectPracticeConfig } from '@/games/ShapeArchitect/shape-architect.catalog'
import type { ShapeArchitectPracticeDifficulty } from '@/games/ShapeArchitect/shape-architect.catalog'
import {
  getShapeArchitectLevel,
  recordShapeArchitectProgress,
} from '@/games/ShapeArchitect/shape-architect.functions'

const ShapeArchitect3D = lazy(() =>
  import('@/games/ShapeArchitect/components/ShapeArchitect3D').then((m) => ({
    default: m.ShapeArchitect3D,
  })),
)

export const Route = createFileRoute('/games/shape-architect')({
  validateSearch: validateLevelSearch,
  loader: () => getShapeArchitectLevel(),
  component: ShapeArchitectRoute,
})

function buildSolvedGrid(config: LevelConfig, solution: SolutionStep[]) {
  return solution.reduce((grid, step) => {
    const piece = config.pieces.find(
      (candidate) => candidate.id === step.pieceId,
    )

    if (!piece) {
      return grid
    }

    return placePiece(grid, piece, step.position, step.rotation)
  }, initializeGrid(config))
}

function buildPlacedPieces(
  config: LevelConfig,
  solution: SolutionStep[],
): PlacedPiece[] {
  return solution.flatMap((step) => {
    const piece = config.pieces.find(
      (candidate) => candidate.id === step.pieceId,
    )

    if (!piece) {
      return []
    }

    return {
      pieceId: step.pieceId,
      position: step.position,
      rotation: step.rotation,
      color: piece.color,
    }
  })
}

function pieceIsPlaced(placedPieces: PlacedPiece[], piece: Piece) {
  return placedPieces.some((placedPiece) => placedPiece.pieceId === piece.id)
}

function ShapeArchitectRoute() {
  const { configs, initialConfigId } = Route.useLoaderData()
  const { level: searchLevel } = Route.useSearch()
  const recordProgress = useServerFn(recordShapeArchitectProgress)
  const [availableConfigs, setAvailableConfigs] = useState(configs)
  const [practiceSeed, setPracticeSeed] = useState('')
  const [practiceDifficulty, setPracticeDifficulty] =
    useState<ShapeArchitectPracticeDifficulty>('medium')
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
  const [grid, setGrid] = useState(() => initializeGrid(config))
  const [placedPieces, setPlacedPieces] = useState<PlacedPiece[]>([])
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null)
  const [placementRotation, setPlacementRotation] =
    useState<Rotation3D>(DEFAULT_ROTATION)
  const [saveStatus, setSaveStatus] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('2d')
  const solver = useSolverWorker()

  useEffect(() => {
    if (!solver.result) return
    const result = solver.result

    if (!result.solvable || !result.solution) {
      setSaveStatus(
        result.timedOut
          ? 'Solver timed out before finding a solution.'
          : 'No solution found for this level.',
      )
      return
    }

    const nextPlacedPieces = buildPlacedPieces(config, result.solution)
    const nextGrid = buildSolvedGrid(config, result.solution)

    setPlacedPieces(nextPlacedPieces)
    setGrid(nextGrid)

    void (async () => {
      try {
        const progress = await recordProgress({
          data: {
            levelId: config.id,
            completion: { placements: nextPlacedPieces },
          },
        })
        const unlocked =
          progress.unlockedAchievements.length > 0
            ? ` Unlocked ${progress.unlockedAchievements.join(', ')}.`
            : ''
        setSaveStatus(
          `Solved in ${result.timeMs.toFixed(1)}ms; saved attempt ${
            progress.attempts
          }; best score ${progress.bestScore}.${unlocked}`,
        )
      } catch (error) {
        setSaveStatus(
          error instanceof Error ? error.message : 'Progress save failed.',
        )
      }
    })()
  }, [solver.result])

  useEffect(() => {
    if (!requestedLevelId) return

    const nextConfig =
      availableConfigs.find((candidate) => candidate.id === requestedLevelId) ??
      availableConfigs[0]

    if (nextConfig.id === selectedLevelId) return

    setSelectedLevelId(nextConfig.id)
    setGrid(initializeGrid(nextConfig))
    setPlacedPieces([])
    setSelectedPieceId(null)
    setPlacementRotation(DEFAULT_ROTATION)
    setSaveStatus(null)
  }, [availableConfigs, requestedLevelId, selectedLevelId])

  const solved = checkSolved(grid, config.targetVoxels)
  const filledTargets = config.targetVoxels.filter(
    (pos) => grid.get(pos.x, pos.y, pos.z) === 2,
  ).length
  const selectedPiece =
    config.pieces.find((piece) => piece.id === selectedPieceId) ?? null

  async function recordAttempt(placements: PlacedPiece[]) {
    try {
      const progress = await recordProgress({
        data: {
          levelId: config.id,
          completion: { placements },
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

  function applySolution() {
    setSaveStatus('Solving...')
    solver.solve(config, 2000)
  }

  async function checkCurrent() {
    await recordAttempt(placedPieces)
  }

  function resetPuzzle() {
    setGrid(initializeGrid(config))
    setPlacedPieces([])
    setSelectedPieceId(null)
    setPlacementRotation(DEFAULT_ROTATION)
    setSaveStatus(null)
  }

  function selectLevel(nextLevel: LevelConfig) {
    setSelectedLevelId(nextLevel.id)
    setGrid(initializeGrid(nextLevel))
    setPlacedPieces([])
    setSelectedPieceId(null)
    setPlacementRotation(DEFAULT_ROTATION)
    setSaveStatus(null)
  }

  function selectPiece(piece: Piece) {
    if (pieceIsPlaced(placedPieces, piece)) return

    setSelectedPieceId(piece.id)
    setSaveStatus(null)
  }

  function rotateSelectedPiece() {
    if (selectedPiece === null) return

    setPlacementRotation((rotation) => rotateBy90OnAxis(rotation, 'z'))
    setSaveStatus(null)
  }

  function placeSelectedPiece(attemptedPosition: Position3D) {
    if (selectedPiece === null) {
      setSaveStatus('Select a piece before placing it.')
      return
    }

    const position = findNearestValidPosition(
      grid,
      selectedPiece,
      attemptedPosition,
      placementRotation,
      config.gridSize,
    )

    if (position === null) {
      setSaveStatus('That piece does not fit there.')
      return
    }

    const nextGrid = placePiece(
      grid,
      selectedPiece,
      position,
      placementRotation,
    )
    const nextPlacedPieces = [
      ...placedPieces,
      {
        pieceId: selectedPiece.id,
        position,
        rotation: placementRotation,
        color: selectedPiece.color,
      },
    ]

    setGrid(nextGrid)
    setPlacedPieces(nextPlacedPieces)
    setSelectedPieceId(null)
    setPlacementRotation(DEFAULT_ROTATION)
    setSaveStatus(
      checkSolved(nextGrid, config.targetVoxels)
        ? 'All target cells are filled. Press Check to save the result.'
        : `${selectedPiece.name} placed.`,
    )
  }

  function generatePracticeLevel() {
    const seed = practiceSeed.trim() || `practice-${Date.now()}`
    const nextConfig = getShapeArchitectPracticeConfig(seed, practiceDifficulty)

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
            Fill every target cell with the available pieces. Each preset and
            practice level is deterministic, so the same seed always builds the
            same puzzle.
          </p>
        </div>
        <div className="border border-neutral-300 px-4 py-3 text-sm">
          <div className="font-semibold uppercase text-neutral-500">Cells</div>
          <div className="text-3xl font-semibold">
            {filledTargets} / {config.targetVoxels.length}
          </div>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
        <div className="border border-neutral-300 p-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-semibold">Blueprint</h2>
            <div className="flex items-center gap-3">
              <div className="flex border border-neutral-300 text-sm">
                {(['2d', 'iso', '3d'] as const).map((mode) => (
                  <button
                    key={mode}
                    className={viewMode === mode ? 'bg-neutral-950 px-3 py-1 text-white' : 'px-3 py-1 hover:bg-neutral-100'}
                    onClick={() => setViewMode(mode)}
                    type="button"
                  >
                    {mode === '2d' ? '2D' : mode === 'iso' ? 'Iso' : '3D'}
                  </button>
                ))}
              </div>
              <span className="text-sm capitalize text-neutral-600">
                {config.difficulty} / {config.type}
              </span>
            </div>
          </div>

          <div className="mt-5">
            {viewMode === '3d' ? (
              <Suspense
                fallback={
                  <div className="flex h-[300px] items-center justify-center text-sm text-neutral-500">
                    Loading 3D…
                  </div>
                }
              >
                <ShapeArchitect3D
                  grid={grid}
                  config={config}
                  placedPieces={placedPieces}
                  selectedPiece={selectedPiece}
                  placementRotation={placementRotation}
                  onCellClick={placeSelectedPiece}
                />
              </Suspense>
            ) : (
              <ShapeArchitectCanvas
                grid={grid}
                config={config}
                placedPieces={placedPieces}
                selectedPiece={selectedPiece}
                placementRotation={placementRotation}
                onCellClick={placeSelectedPiece}
                viewMode={viewMode}
              />
            )}
          </div>
        </div>

        <aside className="border border-neutral-300 p-5">
          <h2 className="text-xl font-semibold">Pieces</h2>
          <ol className="mt-4 grid gap-2">
            {config.pieces.map((piece) => {
              const placed = pieceIsPlaced(placedPieces, piece)
              const selected = piece.id === selectedPieceId

              return (
                <li
                  className="border-b border-neutral-200 py-2 text-sm"
                  key={piece.id}
                >
                  <button
                    aria-pressed={selected}
                    className={
                      selected
                        ? 'flex w-full items-center justify-between border border-neutral-950 bg-neutral-950 px-3 py-2 text-left text-white'
                        : 'flex w-full items-center justify-between px-3 py-2 text-left hover:bg-neutral-100 disabled:text-neutral-400'
                    }
                    disabled={placed}
                    onClick={() => selectPiece(piece)}
                    type="button"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="h-4 w-4 border border-neutral-950"
                        style={{ backgroundColor: piece.color }}
                      />
                      {piece.name}
                    </span>
                    <span className="text-sm">
                      {placed ? 'Placed' : `${piece.layout.length} cells`}
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>

          <dl className="mt-5 grid gap-3 text-sm">
            <div className="flex justify-between border-b border-neutral-200 pb-2">
              <dt className="text-neutral-600">Selected</dt>
              <dd className="font-medium">{selectedPiece?.name ?? '-'}</dd>
            </div>
            <div className="flex justify-between border-b border-neutral-200 pb-2">
              <dt className="text-neutral-600">Rotation</dt>
              <dd className="font-medium">{placementRotation.z}deg</dd>
            </div>
            <div className="flex justify-between border-b border-neutral-200 pb-2">
              <dt className="text-neutral-600">Placed</dt>
              <dd className="font-medium">
                {placedPieces.length} / {config.pieces.length}
              </dd>
            </div>
            <div className="flex justify-between border-b border-neutral-200 pb-2">
              <dt className="text-neutral-600">Solved</dt>
              <dd className="font-medium">{solved ? 'Yes' : 'No'}</dd>
            </div>
          </dl>

          <div className="mt-5 grid gap-2">
            <button
              className="border border-neutral-950 px-4 py-3 font-semibold disabled:border-neutral-200 disabled:text-neutral-300"
              disabled={selectedPiece === null}
              onClick={rotateSelectedPiece}
              type="button"
            >
              Rotate
            </button>
            <button
              className="border border-neutral-950 px-4 py-3 font-semibold"
              onClick={() => void checkCurrent()}
              type="button"
            >
              Check
            </button>
            <button
              className="border border-neutral-950 px-4 py-3 font-semibold disabled:border-neutral-200 disabled:text-neutral-300"
              disabled={solver.solving}
              onClick={applySolution}
              type="button"
            >
              {solver.solving ? 'Solving…' : 'Apply Solution'}
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
            <h2 className="text-xl font-semibold">Levels</h2>
            <p className="mt-2 text-neutral-700">
              Presets and seeded practice levels share the same portable
              dissection engine.
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
                  event.currentTarget.value as ShapeArchitectPracticeDifficulty,
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
                  {optionLevel.difficulty} · {optionLevel.type} ·{' '}
                  {optionLevel.pieces.length} pieces ·{' '}
                  {optionLevel.targetVoxels.length} cells
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="border-y border-neutral-300 py-5">
        <h2 className="text-xl font-semibold">Placements</h2>
        {placedPieces.length === 0 ? (
          <p className="mt-3 text-neutral-600">No pieces placed.</p>
        ) : (
          <ol className="mt-4 grid gap-2">
            {placedPieces.map((piece) => (
              <li
                className="flex justify-between border-b border-neutral-200 py-2 text-sm"
                key={piece.pieceId}
              >
                <span>{piece.pieceId}</span>
                <span>
                  ({piece.position.x}, {piece.position.y}, {piece.position.z})
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  )
}
