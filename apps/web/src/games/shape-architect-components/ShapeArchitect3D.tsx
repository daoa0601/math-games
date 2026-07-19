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
  resolveGhostPiece,
  type GhostPiece,
  VoxelGrid,
} from '@math-games/game-shape-architect'
import type { ThreeScene } from '@math-games/game-shape-architect/three-scene'
import type { PerfSnapshot } from '@math-games/game-shape-architect/three-scene'
import { formatPerfLine } from '@math-games/game-shape-architect/perf-monitor'

import { useThrottledMetricReporter } from '@/games/use-client-metrics'

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
  const [perfLine, setPerfLine] = useState<string>('')

  // Flush a perf snapshot to the client_metrics table at most once every 30s,
  // and only when we've actually rendered frames (skip idle "0 fps" windows
  // so the table doesn't fill with noise while the player is reading hints).
  const reportPerf = useThrottledMetricReporter({
    intervalMs: 30_000,
    shouldReport: (value) => value !== undefined && value > 0,
  })

  const grid = useMemo(() => VoxelGrid.fromNestedArray(gridState), [gridState])

  const ghostPiece = useMemo((): GhostPiece | null => {
    return resolveGhostPiece({
      grid,
      piece: selectedPiece,
      source: hoveredCell3D ?? pendingPosition,
      rotation: placementRotation,
      gridSize,
    })
  }, [
    selectedPiece,
    hoveredCell3D,
    pendingPosition,
    grid,
    placementRotation,
    gridSize,
  ])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let disposed = false

    // Subpath import keeps three.js out of the statically-imported barrel —
    // this is what makes the chunk split actually happen.
    import('@math-games/game-shape-architect/three-scene').then(
      ({ createThreeScene }) => {
        if (disposed) return
        const threeScene = createThreeScene(canvas)
        sceneRef.current = threeScene
        setReady(true)

        threeScene.onPerf((snapshot: PerfSnapshot) => {
          setPerfLine(formatPerfLine(snapshot))
          // value = median frame ms (lower is better); only meaningful when
          // frames were sampled (the render-on-demand loop reports 0 frames
          // while idle).
          if (snapshot.frames > 0) {
            reportPerf({
              kind: 'perf',
              name: 'shape-architect.frame',
              gameId: 'shape-architect',
              value: Math.round(snapshot.medianFrameMs * 100) / 100,
              payloadJson: JSON.stringify({
                fps: Math.round(snapshot.fps),
                median: snapshot.medianFrameMs,
                p95: snapshot.p95FrameMs,
                max: snapshot.maxFrameMs,
                frames: snapshot.frames,
              }),
            })
          }
        })

        const container = containerRef.current
        if (container) {
          const rect = container.getBoundingClientRect()
          threeScene.resize(rect.width, Math.max(320, rect.width * 0.66))
        }
      },
    )

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

    // Throttle mousemove picking with rAF so a fast sweep over the canvas does
    // not raycast once per event (Chrome can fire 200+ events/sec on a Mac
    // trackpad). One in-flight pick at a time is enough for the ghost.
    let pending = false
    let lastEvent: MouseEvent | null = null

    function schedule() {
      if (pending) return
      pending = true
      requestAnimationFrame(() => {
        pending = false
        const event = lastEvent
        if (!event) return
        const position = sceneRef.current?.pickGridCell(
          event.clientX,
          event.clientY,
        )
        setHoveredCell3D(position ?? null)
      })
    }

    function handleMove(event: MouseEvent) {
      lastEvent = event
      schedule()
    }

    function handleLeave() {
      lastEvent = null
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
    <div ref={containerRef} className="relative max-w-[640px]">
      <canvas
        ref={canvasRef}
        className="w-full"
        style={{
          minHeight: 320,
          cursor: selectedPiece ? 'crosshair' : 'grab',
        }}
        aria-label={labels.view}
        role="img"
      />
      {perfLine && (
        <div className="pointer-events-none absolute right-2 top-2 rounded bg-background/80 px-2 py-1 font-mono text-[10px] tabular-nums text-muted-foreground">
          {perfLine}
        </div>
      )}
      {!ready && (
        <div className="flex h-[320px] items-center justify-center text-sm text-neutral-500">
          {labels.loading}
        </div>
      )}
    </div>
  )
}
