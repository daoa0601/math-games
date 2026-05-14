import { useEffect, useRef, useState } from 'react'

import type {
  CellState,
  LevelConfig,
  Piece,
  PlacedPiece,
  Position3D,
} from '../logic/types'
import type { ThreeScene } from '../rendering/three-scene'

interface GhostPiece {
  positions: Position3D[]
  isValid: boolean
}

interface ShapeArchitect3DProps {
  gridState: CellState[][][]
  config: LevelConfig
  placedPieces: PlacedPiece[]
  ghostPiece: GhostPiece | null
  selectedPiece: Piece | null
  labels: {
    loading: string
    view: string
  }
  onCellClick: (position: Position3D) => void
}

export function ShapeArchitect3D({
  gridState,
  config,
  placedPieces,
  ghostPiece,
  selectedPiece,
  labels,
  onCellClick,
}: ShapeArchitect3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<ThreeScene | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let disposed = false

    import('../rendering/three-scene').then(({ createThreeScene }) => {
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
    const canvas = canvasRef.current
    if (!canvas) return

    function handleClick(event: MouseEvent) {
      const position = sceneRef.current?.pickGridCell(
        event.clientX,
        event.clientY,
      )
      if (position) onCellClick(position)
    }

    canvas.addEventListener('click', handleClick)
    return () => canvas.removeEventListener('click', handleClick)
  }, [onCellClick])

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
