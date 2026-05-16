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
import { Card, CardContent } from '@math-games/ui'
import { Separator } from '@math-games/ui'
import { ToggleGroup, ToggleGroupItem } from '@math-games/ui'
import { useGameSession } from '@math-games/ui'
import { validateLevelSearch } from '@/games/level-search'
import {
  DEFAULT_ROTATION,
  canPlacePiece,
  findNearestValidPosition,
  getPieceWorldPositions,
  initializeGrid,
  placePiece,
  rotateBy90OnAxis,
  VoxelGrid,
} from '@math-games/game-shape-architect'
import type {
  CellState,
  LevelConfig,
  Piece,
  PlacedPiece,
  Position3D,
  Rotation3D,
  RotationAxis,
  ShapeArchitectGameState,
  SolutionStep,
} from '@math-games/game-shape-architect'
import { PlacementToolbar } from '@/games/shape-architect-components/PlacementToolbar'
import { ShapeArchitect3D } from '@/games/shape-architect-components/ShapeArchitect3D'
import { ShapeArchitectCanvas } from '@/games/shape-architect-components/ShapeArchitectCanvas'
import { useSolverWorker } from '@math-games/game-shape-architect'
import { getShapeArchitectPracticeConfig } from '@math-games/game-shape-architect'
import type { ShapeArchitectPracticeDifficulty } from '@math-games/game-shape-architect'
import {
  getShapeArchitectLevel,
  recordShapeArchitectProgress,
  validateShapeArchitectMove,
} from '@/games/shape-architect.functions'
import {
  formatSavedProgress,
  formatSolvedProgress,
  runServerAction,
} from '@/routes/-server-action-result'
import { useT } from '@math-games/ui'

type ViewMode = '2d' | '3d'

type PendingAction = 'place' | 'undo' | 'reset' | 'solve' | null

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

function createInitialServerState(
  config: LevelConfig,
): ShapeArchitectGameState {
  return {
    grid: initializeGrid(config).toNestedArray(),
    placedPieces: [],
    remainingPieces: [...config.pieces],
    isSolved: false,
    moveCount: 0,
    accepted: true,
  }
}

function gridFromState(gridState: CellState[][][]): VoxelGrid {
  return VoxelGrid.fromNestedArray(gridState)
}

function buildOptimisticGrid(
  config: LevelConfig,
  placements: PlacedPiece[],
): VoxelGrid {
  return placements.reduce((grid, placement) => {
    const piece = config.pieces.find(
      (candidate) => candidate.id === placement.pieceId,
    )

    return piece
      ? placePiece(grid, piece, placement.position, placement.rotation)
      : grid
  }, initializeGrid(config))
}

function ShapeArchitectRoute() {
  const t = useT()
  const { locale } = useLocale()
  const { configs, initialConfigId } = Route.useLoaderData()
  const { level: searchLevel } = Route.useSearch()
  const recordProgress = useServerFn(recordShapeArchitectProgress)
  const validateMove = useServerFn(validateShapeArchitectMove)
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
  const [serverState, setServerState] = useState(() =>
    createInitialServerState(config),
  )
  const [placements, setPlacements] = useState<PlacedPiece[]>([])
  const [optimisticGrid, setOptimisticGrid] = useState<VoxelGrid | null>(null)
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null)
  const [placementRotation, setPlacementRotation] =
    useState<Rotation3D>(DEFAULT_ROTATION)
  const [saveStatus, setSaveStatus] = useState<string | null>(null)
  const [errorPopup, setErrorPopup] = useState<string | null>(null)
  const [levelAttempts, setLevelAttempts] = useState(0)
  const [viewMode, setViewMode] = useState<ViewMode>('2d')
  const [pendingPosition, setPendingPosition] = useState<Position3D | null>(
    null,
  )
  const [tapPoint, setTapPoint] = useState<{ x: number; y: number } | null>(
    null,
  )
  const [hoveredCell3D, setHoveredCell3D] = useState<Position3D | null>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  const validationSeqRef = useRef(0)
  const solvedProgressKeyRef = useRef<string | null>(null)
  const solver = useSolverWorker()

  const serverGrid = useMemo(
    () => gridFromState(serverState.grid),
    [serverState.grid],
  )
  const grid = optimisticGrid ?? serverGrid
  const placedPieces = placements

  useEffect(() => {
    if (!saveStatus) return
    const timer = setTimeout(() => setSaveStatus(null), 5000)
    return () => clearTimeout(timer)
  }, [saveStatus])

  useEffect(() => {
    if (!solver.result) return
    const result = solver.result

    if (!result.solvable || !result.solution) {
      setSaveStatus(
        result.timedOut ? t('status.solverTimedOut') : t('status.noSolution'),
      )
      return
    }

    const nextPlacedPieces = buildPlacedPieces(config, result.solution)
    const nextGrid = buildSolvedGrid(config, result.solution)

    void validatePlacements(nextPlacedPieces, {
      action: 'solve',
      optimisticGrid: nextGrid,
      solvedMessage: (progress) =>
        formatSolvedProgress(
          result.timeMs,
          progress,
          progressLabels,
          (achievementId) => formatAchievementName(locale, achievementId),
        ),
    })
  }, [solver.result])

  useEffect(() => {
    if (!requestedLevelId) return

    const nextConfig =
      availableConfigs.find((candidate) => candidate.id === requestedLevelId) ??
      availableConfigs[0]

    if (nextConfig.id === selectedLevelId) return

    setSelectedLevelId(nextConfig.id)
    setServerState(createInitialServerState(nextConfig))
    setPlacements([])
    setOptimisticGrid(null)
    setPendingAction(null)
    setSelectedPieceId(null)
    setPlacementRotation(DEFAULT_ROTATION)
    setSaveStatus(null)
    solvedProgressKeyRef.current = null
  }, [availableConfigs, requestedLevelId, selectedLevelId])

  const solved = serverState.isSolved
  const session = useGameSession({ completed: solved, resetKey: config.id })
  const hints = getHints('shape-architect', locale)
  const filledTargets = config.targetVoxels.filter(
    (pos) => grid.get(pos.x, pos.y, pos.z) === 2,
  ).length
  const selectedPiece =
    config.pieces.find((piece) => piece.id === selectedPieceId) ?? null
  const progressLabels = { unlocked: t('status.unlocked') }

  async function recordAttempt(
    confirmedPlacements: PlacedPiece[],
    messageForSolved?: (
      progress: Awaited<ReturnType<typeof recordProgress>>,
    ) => string | null,
  ) {
    const result = await runServerAction(
      () =>
        recordProgress({
          data: {
            levelId: config.id,
            completion: { placements: confirmedPlacements },
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
      messageForSolved
        ? messageForSolved(result.value)
        : formatSavedProgress(result.value, progressLabels, (achievementId) =>
            formatAchievementName(locale, achievementId),
          ),
    )
  }

  async function validatePlacements(
    nextPlacements: PlacedPiece[],
    options: {
      action: PendingAction
      optimisticGrid: VoxelGrid
      successMessage?: string
      solvedMessage?: (
        progress: Awaited<ReturnType<typeof recordProgress>>,
      ) => string | null
    },
  ) {
    const requestSeq = validationSeqRef.current + 1
    validationSeqRef.current = requestSeq

    setPendingAction(options.action)
    setPlacements(nextPlacements)
    setOptimisticGrid(options.optimisticGrid)
    setSaveStatus(null)

    const result = await runServerAction(
      () =>
        validateMove({
          data: {
            levelId: config.id,
            placements: nextPlacements.map(
              ({ pieceId, position, rotation }) => ({
                pieceId,
                position,
                rotation,
              }),
            ),
          },
        }),
      t('status.moveValidationFailed'),
    )

    if (requestSeq !== validationSeqRef.current) return

    setPendingAction(null)

    if (!result.ok) {
      setOptimisticGrid(null)
      setPlacements(serverState.placedPieces)
      setSaveStatus(result.message)
      return
    }

    const nextServerState = result.value
    setServerState(nextServerState)
    setPlacements(nextServerState.placedPieces)
    setOptimisticGrid(null)

    if (!nextServerState.accepted) {
      setErrorPopup(nextServerState.error ?? t('status.placementRejected'))
      return
    }

    if (nextServerState.isSolved) {
      const solvedKey = `${config.id}:${nextServerState.moveCount}`
      if (solvedProgressKeyRef.current !== solvedKey) {
        solvedProgressKeyRef.current = solvedKey
        await recordAttempt(nextServerState.placedPieces, options.solvedMessage)
      }
      return
    }

    if (options.successMessage) {
      setSaveStatus(options.successMessage)
    }
  }

  function resetPuzzle() {
    const emptyGrid = initializeGrid(config)
    void validatePlacements([], { action: 'reset', optimisticGrid: emptyGrid })
    setSelectedPieceId(null)
    setPlacementRotation(DEFAULT_ROTATION)
    setPendingPosition(null)
    setTapPoint(null)
    setSaveStatus(null)
    solvedProgressKeyRef.current = null
    session.resetSession()
  }

  function selectLevel(nextLevel: LevelConfig) {
    setSelectedLevelId(nextLevel.id)
    setServerState(createInitialServerState(nextLevel))
    setPlacements([])
    setOptimisticGrid(null)
    setPendingAction(null)
    setSelectedPieceId(null)
    setPlacementRotation(DEFAULT_ROTATION)
    setPendingPosition(null)
    setTapPoint(null)
    setSaveStatus(null)
    setLevelAttempts(0)
    solvedProgressKeyRef.current = null
    session.resetSession()
  }

  function selectPiece(piece: Piece) {
    if (session.timedOut) return
    if (pieceIsPlaced(placedPieces, piece)) return

    setSelectedPieceId(piece.id)
    setPendingPosition(null)
    setTapPoint(null)
    setSaveStatus(null)
  }

  function rotateSelectedPiece(axis: RotationAxis = 'z') {
    if (selectedPiece === null) return

    setPlacementRotation((rotation) => rotateBy90OnAxis(rotation, axis))
    setSaveStatus(null)
  }

  function handleCellClick(attemptedPosition: Position3D) {
    if (session.timedOut) return
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

  const ghostPiece3D = useMemo(() => {
    const source = hoveredCell3D ?? pendingPosition
    if (!selectedPiece || !source) return null

    const position = findNearestValidPosition(
      grid,
      selectedPiece,
      source,
      placementRotation,
      config.gridSize,
    )

    return {
      positions: getPieceWorldPositions(
        selectedPiece,
        position ?? source,
        placementRotation,
      ),
      isValid: position !== null,
    }
  }, [
    selectedPiece,
    hoveredCell3D,
    pendingPosition,
    grid,
    placementRotation,
    config.gridSize,
  ])

  function confirmPlacement() {
    if (session.timedOut) return
    if (pendingAction !== null) return
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

    if (
      !canPlacePiece(
        grid,
        selectedPiece,
        position,
        placementRotation,
        config.gridSize,
      )
    ) {
      setSaveStatus(t('game.doesNotFit'))
      return
    }

    const nextPlacedPieces = [
      ...placedPieces,
      {
        pieceId: selectedPiece.id,
        position,
        rotation: placementRotation,
        color: selectedPiece.color,
      },
    ]
    const nextGrid = buildOptimisticGrid(config, nextPlacedPieces)

    setSelectedPieceId(null)
    setPlacementRotation(DEFAULT_ROTATION)
    setPendingPosition(null)
    setTapPoint(null)
    void validatePlacements(nextPlacedPieces, {
      action: 'place',
      optimisticGrid: nextGrid,
      successMessage: `${formatLevelName(locale, selectedPiece.name)} ${t(
        'game.piecePlaced',
      )}`,
      solvedMessage: () => t('game.allFilled'),
    })
  }

  function cancelPlacement() {
    setPendingPosition(null)
    setTapPoint(null)
    setSaveStatus(null)
  }

  function undoPlacement() {
    if (
      session.timedOut ||
      pendingAction !== null ||
      placedPieces.length === 0
    ) {
      return
    }

    const nextPlacedPieces = placedPieces.slice(0, -1)
    const nextGrid = buildOptimisticGrid(config, nextPlacedPieces)
    setSelectedPieceId(null)
    setPlacementRotation(DEFAULT_ROTATION)
    setPendingPosition(null)
    setTapPoint(null)
    setSaveStatus(null)
    solvedProgressKeyRef.current = null
    void validatePlacements(nextPlacedPieces, {
      action: 'undo',
      optimisticGrid: nextGrid,
      successMessage: t('status.lastPlacementUndone'),
    })
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
    <main className="theme-shape-architect mx-auto flex min-h-screen max-w-5xl flex-col gap-6 overflow-x-hidden px-4 py-6 md:gap-10 md:px-6 md:py-10">
      <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-border/50 bg-background/95 px-4 py-3 -mx-4 backdrop-blur-sm md:-mx-6 md:px-6">
        <div className="flex items-center gap-3 overflow-hidden">
          <Link
            className="shrink-0 text-sm text-muted-foreground hover:text-foreground"
            to="/"
          >
            {t('app.title')}
          </Link>
          <span className="text-muted-foreground">/</span>
          <h1 className="truncate text-lg font-bold tracking-tight md:text-2xl">
            {formatLevelName(locale, config.name)}
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

      <section className="relative grid gap-4">
        <Confetti
          active={solved}
          colors={['#14b8a6', '#2dd4bf', '#5eead4', '#0d9488', '#0f766e']}
        />
        <Card className="relative overflow-hidden border border-primary/15 shadow-xl shadow-primary/5">
          <GamePattern pattern="blueprint" />
          <CardContent className="relative">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">{t('game.blueprint')}</h2>
              <div className="flex flex-wrap items-center gap-2">
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
                <Badge variant={session.timedOut ? 'destructive' : 'secondary'}>
                  {session.mode === 'timed'
                    ? `${Math.floor(session.remainingSeconds / 60)}:${(session.remainingSeconds % 60).toString().padStart(2, '0')}`
                    : `${Math.floor(session.elapsedSeconds / 60)}:${(session.elapsedSeconds % 60).toString().padStart(2, '0')}`}
                </Badge>
                <ToggleGroup
                  type="single"
                  value={viewMode}
                  onValueChange={(value) => {
                    if (!value) return
                    setViewMode(value as ViewMode)
                    setSelectedPieceId(null)
                    setPlacementRotation(DEFAULT_ROTATION)
                    setPendingPosition(null)
                    setTapPoint(null)
                    setHoveredCell3D(null)
                    setSaveStatus(null)
                  }}
                  variant="outline"
                  size="sm"
                >
                  <ToggleGroupItem value="2d">2D</ToggleGroupItem>
                  <ToggleGroupItem value="3d">3D</ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>

            <div
              ref={boardRef}
              className="relative mt-4 overflow-x-auto"
              onClick={viewMode === '2d' ? handleBoardClick : undefined}
            >
              {viewMode === '3d' ? (
                <ShapeArchitect3D
                  gridState={grid.toNestedArray()}
                  config={config}
                  placedPieces={placedPieces}
                  ghostPiece={ghostPiece3D}
                  selectedPiece={selectedPiece}
                  labels={{
                    loading: t('game.loading3d'),
                    view: t('game.shapeArchitect3dView'),
                  }}
                  onCellClick={handleCellClick}
                  onCellHover={setHoveredCell3D}
                />
              ) : (
                <ShapeArchitectCanvas
                  grid={grid}
                  config={config}
                  placedPieces={placedPieces}
                  selectedPiece={selectedPiece}
                  placementRotation={placementRotation}
                  onCellClick={handleCellClick}
                  pendingPosition={pendingPosition}
                  viewMode="2d"
                  label={t('game.shapeArchitectGrid')}
                />
              )}

              {viewMode === '2d' &&
                pendingPosition !== null &&
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
                      pieceName={formatLevelName(locale, selectedPiece.name)}
                      rotation={placementRotation}
                      show3DAxes={config.type === '3D'}
                      canPlace={pendingCanPlace}
                      labels={{
                        cancelPlacement: t('game.cancelPlacement'),
                        placePiece: t('game.placePiece'),
                        rotatePiece: t('game.rotatePiece'),
                        rotatePieceAxis: t('game.rotatePieceAxis'),
                      }}
                      onRotate={rotateSelectedPiece}
                      onPlace={confirmPlacement}
                      onCancel={cancelPlacement}
                    />
                  </div>
                )}
            </div>

            {viewMode === '3d' &&
              pendingPosition !== null &&
              selectedPiece !== null && (
                <div className="mt-3">
                  <PlacementToolbar
                    pieceName={formatLevelName(locale, selectedPiece.name)}
                    rotation={placementRotation}
                    show3DAxes
                    canPlace={pendingCanPlace}
                    labels={{
                      cancelPlacement: t('game.cancelPlacement'),
                      placePiece: t('game.placePiece'),
                      rotatePiece: t('game.rotatePiece'),
                      rotatePieceAxis: t('game.rotatePieceAxis'),
                    }}
                    onRotate={rotateSelectedPiece}
                    onPlace={confirmPlacement}
                    onCancel={cancelPlacement}
                  />
                </div>
              )}

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
                    disabled={session.timedOut || placed}
                    onClick={() => selectPiece(piece)}
                    type="button"
                  >
                    <span
                      className="h-3 w-3 rounded-full border border-border"
                      style={{ backgroundColor: piece.color }}
                    />
                    {formatLevelName(locale, piece.name)}
                  </button>
                )
              })}
            </div>

            <div className="mt-4 flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                disabled={
                  session.timedOut ||
                  pendingAction !== null ||
                  placedPieces.length === 0
                }
                onClick={undoPlacement}
                type="button"
              >
                {t('game.undo')}
              </Button>
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

            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {t('stats.placed')} {placedPieces.length}/{config.pieces.length}
              </span>
              {levelAttempts > 0 ? (
                <span>
                  {t('profile.attempts')} {levelAttempts}
                </span>
              ) : null}
              <span>
                {solved
                  ? t('stats.solved')
                  : `${filledTargets}/${config.targetVoxels.length} ${t('stats.cells')}`}
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
          <Card className="border-0 shadow-lg bg-primary/5">
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
      </section>

      <ResponsiveSection
        title={t('game.levels')}
        description={t('game.dissectionDescription')}
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
                <span className="block font-semibold">
                  {formatLevelName(locale, optionLevel.name)}
                </span>
                <span className="mt-1 block text-sm capitalize opacity-80">
                  {formatDifficulty(locale, optionLevel.difficulty)} ·{' '}
                  {optionLevel.type} · {optionLevel.pieces.length}{' '}
                  {t('stats.pieces')} · {optionLevel.targetVoxels.length}{' '}
                  {t('stats.cells')}
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
