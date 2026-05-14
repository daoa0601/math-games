import { createFileRoute, Link } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useEffect, useMemo, useRef, useState } from 'react'

import { Confetti } from '@/components/confetti'
import { GamePattern } from '@/components/game-pattern'
import { LanguageToggle } from '@/components/language-toggle'
import { LearnSection } from '@/components/learn-section'
import { ResponsiveSection } from '@/components/responsive-section'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
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
import { PlacementToolbar } from '@/games/ShapeArchitect/components/PlacementToolbar'
import { ShapeArchitectCanvas } from '@/games/ShapeArchitect/components/ShapeArchitectCanvas'
import type { ViewMode } from '@/games/ShapeArchitect/components/ShapeArchitectCanvas'
import { useSolverWorker } from '@/games/ShapeArchitect/logic/useSolverWorker'
import { getShapeArchitectPracticeConfig } from '@/games/ShapeArchitect/shape-architect.catalog'
import type { ShapeArchitectPracticeDifficulty } from '@/games/ShapeArchitect/shape-architect.catalog'
import {
  getShapeArchitectLevel,
  recordShapeArchitectProgress,
} from '@/games/ShapeArchitect/shape-architect.functions'
import {
  formatSavedProgress,
  formatSolvedProgress,
  runServerAction,
} from '@/routes/-server-action-result'
import { useT } from '@/components/use-t'

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
  const t = useT()
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
  const [pendingPosition, setPendingPosition] = useState<Position3D | null>(
    null,
  )
  const [tapPoint, setTapPoint] = useState<{ x: number; y: number } | null>(
    null,
  )
  const boardRef = useRef<HTMLDivElement>(null)
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
      const progress = await runServerAction(
        () =>
          recordProgress({
            data: {
              levelId: config.id,
              completion: { placements: nextPlacedPieces },
            },
          }),
        'Progress save failed.',
      )

      if (!progress.ok) {
        setSaveStatus(progress.message)
        return
      }

      setSaveStatus(formatSolvedProgress(result.timeMs, progress.value))
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
    const result = await runServerAction(
      () =>
        recordProgress({
          data: {
            levelId: config.id,
            completion: { placements },
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

  async function checkCurrent() {
    await recordAttempt(placedPieces)
  }

  function resetPuzzle() {
    setGrid(initializeGrid(config))
    setPlacedPieces([])
    setSelectedPieceId(null)
    setPlacementRotation(DEFAULT_ROTATION)
    setPendingPosition(null)
    setTapPoint(null)
    setSaveStatus(null)
  }

  function selectLevel(nextLevel: LevelConfig) {
    setSelectedLevelId(nextLevel.id)
    setGrid(initializeGrid(nextLevel))
    setPlacedPieces([])
    setSelectedPieceId(null)
    setPlacementRotation(DEFAULT_ROTATION)
    setPendingPosition(null)
    setTapPoint(null)
    setSaveStatus(null)
  }

  function selectPiece(piece: Piece) {
    if (pieceIsPlaced(placedPieces, piece)) return

    setSelectedPieceId(piece.id)
    setPendingPosition(null)
    setTapPoint(null)
    setSaveStatus(null)
  }

  function rotateSelectedPiece() {
    if (selectedPiece === null) return

    setPlacementRotation((rotation) => rotateBy90OnAxis(rotation, 'z'))
    setSaveStatus(null)
  }

  function handleCellClick(attemptedPosition: Position3D) {
    if (selectedPiece === null) {
      setSaveStatus(t('game.selectPiece'))
      return
    }

    setPendingPosition(attemptedPosition)
    setSaveStatus(null)
  }

  function handleBoardClick(e: React.MouseEvent) {
    const board = boardRef.current
    if (!board) return
    const rect = board.getBoundingClientRect()
    setTapPoint({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  const pendingCanPlace =
    selectedPiece !== null && pendingPosition !== null
      ? findNearestValidPosition(
          grid,
          selectedPiece,
          pendingPosition,
          placementRotation,
          config.gridSize,
        ) !== null
      : false

  function confirmPlacement() {
    if (selectedPiece === null || pendingPosition === null) return

    const position = findNearestValidPosition(
      grid,
      selectedPiece,
      pendingPosition,
      placementRotation,
      config.gridSize,
    )

    if (position === null) {
      setSaveStatus(t('game.doesNotFit'))
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
    setPendingPosition(null)
    setTapPoint(null)
    setSaveStatus(
      checkSolved(nextGrid, config.targetVoxels)
        ? t('game.allFilled')
        : `${selectedPiece.name} ${t('game.piecePlaced')}`,
    )
  }

  function cancelPlacement() {
    setPendingPosition(null)
    setTapPoint(null)
    setSaveStatus(null)
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
    <main className="theme-shape-architect mx-auto flex min-h-screen max-w-5xl flex-col gap-5 overflow-x-hidden px-4 py-6 md:gap-8 md:px-6 md:py-8">
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
            {filledTargets}/{config.targetVoxels.length}
          </span>
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </header>

      <section className="relative">
        <Confetti
          active={solved}
          colors={['#14b8a6', '#2dd4bf', '#5eead4', '#0d9488', '#0f766e']}
        />
        <Card className="relative overflow-hidden">
          <GamePattern pattern="grid" />
          <CardContent className="relative">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold">{t('game.blueprint')}</h2>
              <div className="flex items-center gap-3">
                <ToggleGroup
                  type="single"
                  value={viewMode}
                  onValueChange={(value) => {
                    if (value) setViewMode(value as ViewMode)
                  }}
                  variant="outline"
                  size="sm"
                >
                  <ToggleGroupItem value="2d">2D</ToggleGroupItem>
                  <ToggleGroupItem value="iso">Iso</ToggleGroupItem>
                </ToggleGroup>
                <span className="text-sm capitalize text-muted-foreground">
                  {config.difficulty} / {config.type}
                </span>
              </div>
            </div>

            <div
              ref={boardRef}
              className="relative mt-4 overflow-x-auto"
              onClick={handleBoardClick}
            >
              <ShapeArchitectCanvas
                grid={grid}
                config={config}
                placedPieces={placedPieces}
                selectedPiece={selectedPiece}
                placementRotation={placementRotation}
                onCellClick={handleCellClick}
                pendingPosition={pendingPosition}
                viewMode={viewMode}
              />

              {pendingPosition !== null &&
                selectedPiece !== null &&
                tapPoint && (
                  <div
                    className="absolute z-10"
                    style={{
                      left: `clamp(0px, ${tapPoint.x}px - 5rem, calc(100% - 10rem))`,
                      top: `clamp(0px, ${tapPoint.y + 12}px, calc(100% - 2.5rem))`,
                    }}
                  >
                    <PlacementToolbar
                      pieceName={selectedPiece.name}
                      rotationDeg={placementRotation.z}
                      canPlace={pendingCanPlace}
                      onRotate={rotateSelectedPiece}
                      onPlace={confirmPlacement}
                      onCancel={cancelPlacement}
                    />
                  </div>
                )}
            </div>

            <Separator className="my-4" />

            <div className="flex flex-wrap gap-2">
              {config.pieces.map((piece) => {
                const placed = pieceIsPlaced(placedPieces, piece)
                const selected = piece.id === selectedPieceId

                return (
                  <button
                    key={piece.id}
                    aria-pressed={selected}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                      placed
                        ? 'bg-muted text-muted-foreground line-through'
                        : selected
                          ? 'bg-primary text-primary-foreground'
                          : 'border border-border bg-card hover:bg-muted'
                    }${placed ? ' animate-piece-snap' : ''}`}
                    disabled={placed}
                    onClick={() => selectPiece(piece)}
                    type="button"
                  >
                    <span
                      className="h-3 w-3 rounded-full border border-border"
                      style={{ backgroundColor: piece.color }}
                    />
                    {piece.name}
                  </button>
                )
              })}
            </div>

            <div className="mt-4 flex gap-2">
              <Button
                className="flex-1"
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

            {saveStatus ? (
              <p className="mt-3 text-sm text-muted-foreground">{saveStatus}</p>
            ) : null}

            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {t('stats.placed')} {placedPieces.length}/{config.pieces.length}
              </span>
              <span>
                {solved
                  ? t('stats.solved')
                  : `${filledTargets}/${config.targetVoxels.length} ${t('stats.cells')}`}
              </span>
            </div>
          </CardContent>
        </Card>
      </section>

      <ResponsiveSection
        title={t('game.levels')}
        description="Presets and seeded practice levels share the same portable dissection engine."
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
                  event.currentTarget.value as ShapeArchitectPracticeDifficulty,
                )
              }
              value={practiceDifficulty}
            >
              <option value="easy">{t('diff.easy')}</option>
              <option value="medium">{t('diff.medium')}</option>
              <option value="hard">{t('diff.hard')}</option>
            </select>
            <Button onClick={generatePracticeLevel} type="button">
              {t('game.generate')}
            </Button>
          </div>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {availableConfigs.map((optionLevel) => {
            const selected = optionLevel.id === config.id

            return (
              <button
                className={
                  selected
                    ? 'rounded-lg border border-primary bg-primary px-4 py-4 text-left text-primary-foreground'
                    : 'rounded-lg border border-border px-4 py-4 text-left hover:border-primary'
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
      </ResponsiveSection>

      <LearnSection gameId="shape-architect" />
    </main>
  )
}
