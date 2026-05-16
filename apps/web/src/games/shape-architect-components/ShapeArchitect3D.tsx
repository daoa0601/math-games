import { useEffect, useMemo, useRef, useState } from 'react'

import type {
  CellState,
  LevelConfig,
  Piece,
  PlacedPiece,
  Position3D,
  Rotation3D,
} from '@math-games/game-shape-architect'
import {
  findNearestValidPosition,
  getPieceWorldPositions,
  VoxelGrid,
} from '@math-games/game-shape-architect'
import type { ThreeScene } from '@math-games/game-shape-architect'

interface GhostPiece {
  positions: Position3D[]
  isValid: boolean
}

interface ShapeArchitect3DProps {
  gridState: CellState[][][]
  config: LevelConfig
  placedPieces: PlacedPiece[]
  selectedPiece: Piece | null
  pendingPosition: Position3D | null
  placementRotation: Rotation3D
  gridSize: [number, number, number]
  labels: {
    loading: string
    view: string
  }
  onCellClick?: (position: Position3D) => void
}

export function ShapeArchitect3D({
  gridState,
  config,
  placedPieces,
  selectedPiece,
  pendingPosition,
  placementRotation,
  gridSize,
  labels,
  onCellClick,
}: ShapeArchitect3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<ThreeScene | null>(null)
  const [ready, setReady] = useState(false)
  const [hoveredCell3D, setHoveredCell3D] = useState<Position3D | null>(null)

  const grid = useMemo(
    () => VoxelGrid.fromNestedArray(gridState),
    [gridState],
  )

  const ghostPiece = useMemo((): GhostPiece | null => {
    const source = hoveredCell3D ?? pendingPosition
    if (!selectedPiece || !source) return null

    const position = findNearestValidPosition(
      grid,
      selectedPiece,
      source,
      placementRotation,
      gridSize,
    )

    return {
      positions: getPieceWorldPositions(
        selectedPiece,
        position ?? source,
        placementRotation,
      ),
      isValid: position !== null,
    }
  }, [selectedPiece, hoveredCell3D, pendingPosition, grid, placementRotation, gridSize])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let disposed = false

    import('@math-games/game-shape-architect').then(({ createThreeScene }) => {
      if (disposed) return
      const threeScene = createThreeScene(canvas)
      sceneRef.current = threeScene
      setReady(true)

      const container = containerRef.current
      if (container) {
        const rect = container.getBoundingClientRect()
        threeScene.resize(rect.width, Math.max(320, rect.width * 0.66))
      }
    })

    return () => {
      disposed = true
      sceneRef.current?.dispose()
      sceneRef.current = null
    }
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container || !sceneRef.current) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width
        sceneRef.current?.resize(width, Math.max(320, width * 0.66))
      }
    })

    observer.observe(container)
    return () => observer.disconnect()
  }, [ready])

  useEffect(() => {
    sceneRef.current?.updateGrid(gridState, config, placedPieces)
  }, [gridState, config, placedPieces, ready])

  useEffect(() => {
    sceneRef.current?.updateGhost(
      ghostPiece?.positions ?? null,
      ghostPiece?.isValid ?? false,
    )
  }, [ghostPiece, ready])

  useEffect(() => {
    sceneRef.current?.fitToGrid(config.gridSize)
  }, [config.gridSize, ready])

  useEffect(() => {
    if (!onCellClick) return

    const canvas = canvasRef.current
    if (!canvas) return

    const handler = onCellClick
    function handleClick(event: MouseEvent) {
      const position = sceneRef.current?.pickGridCell(
        event.clientX,
        event.clientY,
      )
      if (position) handler(position)
    }

    canvas.addEventListener('click', handleClick)
    return () => canvas.removeEventListener('click', handleClick)
  }, [onCellClick])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    function handleMove(event: MouseEvent) {
      const position = sceneRef.current?.pickGridCell(
        event.clientX,
        event.clientY,
      )
      setHoveredCell3D(position ?? null)
    }

    function handleLeave() {
      setHoveredCell3D(null)
    }

    canvas.addEventListener('mousemove', handleMove)
    canvas.addEventListener('mouseleave', handleLeave)
    return () => {
      canvas.removeEventListener('mousemove', handleMove)
      canvas.removeEventListener('mouseleave', handleLeave)
    }
  }, [])

  return (
    <div ref={containerRef} className="max-w-[640px]">
      <canvas
        ref={canvasRef}
        className="w-full"
        style={{ minHeight: 320, cursor: selectedPiece ? 'crosshair' : 'grab' }}
        aria-label={labels.view}
        role="img"
      />
      {!ready && (
        <div className="flex h-[320px] items-center justify-center text-sm text-neutral-500">
          {labels.loading}
        </div>
      )}
    </div>
  )
}
