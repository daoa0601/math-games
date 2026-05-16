import { useCallback, useEffect, useRef, useState } from 'react'

import type {
  LevelConfig,
  Piece,
  PlacedPiece,
  Position3D,
  Rotation3D,
} from '@math-games/game-shape-architect'
import type { VoxelGrid } from '@math-games/game-shape-architect'
import {
  findNearestValidPosition,
  getPieceWorldPositions,
} from '@math-games/game-shape-architect'
import {
  computeIsoConfig,
  drawIsoCube,
  drawIsoWireframe,
  screenToIso,
} from '@math-games/game-shape-architect'

export type ViewMode = '2d' | 'iso'

interface ShapeArchitectCanvasProps {
  grid: VoxelGrid
  config: LevelConfig
  placedPieces: PlacedPiece[]
  selectedPiece: Piece | null
  placementRotation: Rotation3D
  onCellClick: (position: Position3D) => void
  pendingPosition?: Position3D | null
  viewMode?: ViewMode
  visibleLayers?: Set<number>
  explodedGap?: number
  label: string
}

function getThemeColors() {
  const style = getComputedStyle(document.documentElement)
  const isDark = document.documentElement.classList.contains('dark')
  return {
    empty:
      style.getPropertyValue('--card').trim() ||
      (isDark ? '#1a1f2e' : '#ffffff'),
    target: isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb',
    border: isDark ? 'rgba(255,255,255,0.10)' : '#e5e5e5',
    targetBorder: isDark ? 'rgba(255,255,255,0.30)' : '#0a0a0a',
    filledBorder: isDark ? 'rgba(255,255,255,0.40)' : '#0a0a0a',
    ghostValid: isDark
      ? 'rgba(59, 130, 246, 0.40)'
      : 'rgba(59, 130, 246, 0.30)',
    ghostInvalid: isDark
      ? 'rgba(239, 68, 68, 0.35)'
      : 'rgba(239, 68, 68, 0.20)',
    background: isDark ? '#1a1f2e' : '#fafafa',
  }
}

const PADDING = 1
const MIN_CELL_SIZE = 24
const MAX_CELL_SIZE = 56

function getCellSize(containerWidth: number, gridWidth: number): number {
  const raw = Math.floor((containerWidth - PADDING * 2) / gridWidth)
  return Math.max(MIN_CELL_SIZE, Math.min(MAX_CELL_SIZE, raw))
}

function screenToGrid(
  clientX: number,
  clientY: number,
  canvas: HTMLCanvasElement,
  cellSize: number,
): { x: number; y: number } | null {
  const rect = canvas.getBoundingClientRect()
  const cssX = clientX - rect.left - PADDING
  const cssY = clientY - rect.top - PADDING
  const x = Math.floor(cssX / cellSize)
  const y = Math.floor(cssY / cellSize)
  return x >= 0 && y >= 0 ? { x, y } : null
}

function createColorLookup(
  config: LevelConfig,
  placedPieces: PlacedPiece[],
  use3DKeys: boolean,
): Map<string, string> {
  const lookup = new Map<string, string>()
  for (const pp of placedPieces) {
    const piece = config.pieces.find((p) => p.id === pp.pieceId)
    if (!piece) continue
    for (const pos of getPieceWorldPositions(piece, pp.position, pp.rotation)) {
      const key = use3DKeys ? `${pos.x},${pos.y},${pos.z}` : `${pos.x},${pos.y}`
      lookup.set(key, pp.color)
    }
  }
  return lookup
}

// ========================================
// Flat 2D drawing
// ========================================

function drawFlat2D(
  ctx: CanvasRenderingContext2D,
  grid: VoxelGrid,
  config: LevelConfig,
  placedPieces: PlacedPiece[],
  targetSet: Set<string>,
  ghostSet: Set<string>,
  ghostIsValid: boolean,
  cellSize: number,
  colors: ReturnType<typeof getThemeColors>,
) {
  const [width, height] = config.gridSize
  const colorLookup = createColorLookup(config, placedPieces, false)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const px = PADDING + x * cellSize
      const py = PADDING + y * cellSize
      const key = `${x},${y}`
      const cellState = grid.get(x, y, 0)
      const isTarget = targetSet.has(key)
      const color = colorLookup.get(key)

      ctx.fillStyle = color ?? (isTarget ? colors.target : colors.empty)
      ctx.fillRect(px, py, cellSize, cellSize)

      ctx.strokeStyle =
        cellState === 2 || isTarget ? colors.targetBorder : colors.border
      ctx.lineWidth = cellState === 2 || isTarget ? 2 : 1
      ctx.strokeRect(
        px + ctx.lineWidth / 2,
        py + ctx.lineWidth / 2,
        cellSize - ctx.lineWidth,
        cellSize - ctx.lineWidth,
      )

      if (ghostSet.has(key) && cellState !== 2) {
        ctx.fillStyle = ghostIsValid ? colors.ghostValid : colors.ghostInvalid
        ctx.fillRect(px + 1, py + 1, cellSize - 2, cellSize - 2)
      }
    }
  }
}

// ========================================
// Isometric drawing
// ========================================

function drawIsometric(
  ctx: CanvasRenderingContext2D,
  grid: VoxelGrid,
  config: LevelConfig,
  placedPieces: PlacedPiece[],
  canvasWidth: number,
  canvasHeight: number,
  visibleLayers: Set<number>,
  explodedGap: number,
  ghostSet: Set<string>,
  ghostIsValid: boolean,
  isDark: boolean,
) {
  const [gw, gh, gd] = config.gridSize
  const isoCfg = computeIsoConfig(gw, gh, gd, canvasWidth, canvasHeight)
  const colorLookup = createColorLookup(config, placedPieces, true)

  for (let z = 0; z < gd; z++) {
    if (!visibleLayers.has(z)) continue
    const zOffset = z * explodedGap

    for (let y = gh - 1; y >= 0; y--) {
      for (let x = 0; x < gw; x++) {
        const state = grid.get(x, y, z)
        const key3 = `${x},${y},${z}`
        const drawZ = z + zOffset

        if (state === 1) {
          drawIsoWireframe(
            ctx,
            x,
            y,
            drawZ,
            isoCfg,
            isDark ? 'rgba(255,255,255,0.20)' : 'rgba(0,0,0,0.25)',
          )
        } else if (state === 2) {
          const color = colorLookup.get(key3) ?? '#999999'
          drawIsoCube(ctx, x, y, drawZ, color, isoCfg)
        }

        // Ghost overlay
        if (ghostSet.has(key3) && state !== 2) {
          const ghostColor = ghostIsValid ? '#3b82f6' : '#ef4444'
          drawIsoCube(ctx, x, y, drawZ, ghostColor, {
            ...isoCfg,
          })
          // Draw semi-transparent overlay
          ctx.globalAlpha = 0.6
          drawIsoCube(ctx, x, y, drawZ, ghostColor, isoCfg)
          ctx.globalAlpha = 1.0
        }
      }
    }
  }
}

// ========================================
// Component
// ========================================

export function ShapeArchitectCanvas({
  grid,
  config,
  placedPieces,
  selectedPiece,
  placementRotation,
  onCellClick,
  pendingPosition = null,
  viewMode = '2d',
  visibleLayers,
  explodedGap = 0,
  label,
}: ShapeArchitectCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [hoveredCell, setHoveredCell] = useState<{
    x: number
    y: number
  } | null>(null)
  const [containerWidth, setContainerWidth] = useState(520)
  const [dpr, setDpr] = useState(1)

  const [width, height, depth] = config.gridSize

  // Compute all visible layers (default: all)
  const layers =
    visibleLayers ?? new Set(Array.from({ length: depth }, (_, i) => i))

  // Canvas sizing is computed in CSS pixels, then scaled for high-DPI drawing.
  const cellSize = getCellSize(containerWidth, width)
  const isIso = viewMode === 'iso'
  const canvasCssW = isIso
    ? Math.max(400, containerWidth)
    : cellSize * width + PADDING * 2
  const canvasCssH = isIso
    ? Math.max(300, Math.round(canvasCssW * 0.75))
    : cellSize * height + PADDING * 2
  const canvasW = Math.round(canvasCssW * dpr)
  const canvasH = Math.round(canvasCssH * dpr)

  const targetSet = useRef(new Set<string>())
  useEffect(() => {
    targetSet.current = new Set(config.targetVoxels.map((p) => `${p.x},${p.y}`))
  }, [config.targetVoxels])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width)
      }
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    setDpr(window.devicePixelRatio || 1)
  }, [])

  // Ghost piece positions
  const ghostPositions = useRef<Position3D[] | null>(null)
  const ghostValid = useRef(false)

  const ghostSource = hoveredCell
    ? { x: hoveredCell.x, y: hoveredCell.y, z: 0 }
    : pendingPosition

  if (selectedPiece && ghostSource) {
    const placementPosition = findNearestValidPosition(
      grid,
      selectedPiece,
      ghostSource,
      placementRotation,
      config.gridSize,
    )
    const worldPositions = getPieceWorldPositions(
      selectedPiece,
      placementPosition ?? ghostSource,
      placementRotation,
    )
    ghostPositions.current = worldPositions
    ghostValid.current = placementPosition !== null
  } else {
    ghostPositions.current = null
  }

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const colors = getThemeColors()

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, canvasCssW, canvasCssH)

    if (isIso) {
      ctx.fillStyle = colors.background
      ctx.fillRect(0, 0, canvasCssW, canvasCssH)
    }

    const ghostSet = new Set<string>()
    if (ghostPositions.current) {
      for (const p of ghostPositions.current) {
        ghostSet.add(isIso ? `${p.x},${p.y},${p.z}` : `${p.x},${p.y}`)
      }
    }

    if (isIso) {
      drawIsometric(
        ctx,
        grid,
        config,
        placedPieces,
        canvasCssW,
        canvasCssH,
        layers,
        explodedGap,
        ghostSet,
        ghostValid.current,
        document.documentElement.classList.contains('dark'),
      )
    } else {
      drawFlat2D(
        ctx,
        grid,
        config,
        placedPieces,
        targetSet.current,
        ghostSet,
        ghostValid.current,
        cellSize,
        colors,
      )
    }
  }, [
    canvasW,
    canvasH,
    canvasCssW,
    canvasCssH,
    dpr,
    grid,
    config,
    placedPieces,
    cellSize,
    hoveredCell,
    pendingPosition,
    selectedPiece,
    placementRotation,
    isIso,
    layers,
    explodedGap,
  ])

  useEffect(() => {
    draw()
  }, [draw])

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) return

      if (isIso) {
        const rect = canvas.getBoundingClientRect()
        const sx = e.clientX - rect.left
        const sy = e.clientY - rect.top
        const isoCfg = computeIsoConfig(
          width,
          height,
          depth,
          canvasCssW,
          canvasCssH,
        )
        const cell = screenToIso(sx, sy, 0, isoCfg)
        if (cell.x >= 0 && cell.x < width && cell.y >= 0 && cell.y < height) {
          onCellClick({ x: cell.x, y: cell.y, z: 0 })
        }
      } else {
        const cell = screenToGrid(e.clientX, e.clientY, canvas, cellSize)
        if (cell && cell.x < width && cell.y < height) {
          onCellClick({ x: cell.x, y: cell.y, z: 0 })
        }
      }
    },
    [
      cellSize,
      width,
      height,
      depth,
      canvasCssW,
      canvasCssH,
      isIso,
      onCellClick,
    ],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) return

      let cell: { x: number; y: number } | null = null

      if (isIso) {
        const rect = canvas.getBoundingClientRect()
        const sx = e.clientX - rect.left
        const sy = e.clientY - rect.top
        const isoCfg = computeIsoConfig(
          width,
          height,
          depth,
          canvasCssW,
          canvasCssH,
        )
        const iso = screenToIso(sx, sy, 0, isoCfg)
        if (iso.x >= 0 && iso.x < width && iso.y >= 0 && iso.y < height) {
          cell = iso
        }
      } else {
        cell = screenToGrid(e.clientX, e.clientY, canvas, cellSize)
        if (cell && (cell.x >= width || cell.y >= height)) cell = null
      }

      if (cell) {
        setHoveredCell((prev) =>
          prev?.x === cell.x && prev.y === cell.y ? prev : cell,
        )
      } else {
        setHoveredCell(null)
      }
    },
    [cellSize, width, height, depth, canvasCssW, canvasCssH, isIso],
  )

  const handleMouseLeave = useCallback(() => {
    setHoveredCell(null)
  }, [])

  const handleTouch = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      const touch = e.touches[0]
      if (!touch) return
      const canvas = canvasRef.current
      if (!canvas) return

      if (isIso) {
        const rect = canvas.getBoundingClientRect()
        const sx = touch.clientX - rect.left
        const sy = touch.clientY - rect.top
        const isoCfg = computeIsoConfig(
          width,
          height,
          depth,
          canvasCssW,
          canvasCssH,
        )
        const cell = screenToIso(sx, sy, 0, isoCfg)
        if (cell.x >= 0 && cell.x < width && cell.y >= 0 && cell.y < height) {
          e.preventDefault()
          onCellClick({ x: cell.x, y: cell.y, z: 0 })
        }
      } else {
        const cell = screenToGrid(
          touch.clientX,
          touch.clientY,
          canvas,
          cellSize,
        )
        if (cell && cell.x < width && cell.y < height) {
          e.preventDefault()
          onCellClick({ x: cell.x, y: cell.y, z: 0 })
        }
      }
    },
    [
      cellSize,
      width,
      height,
      depth,
      canvasCssW,
      canvasCssH,
      isIso,
      onCellClick,
    ],
  )

  return (
    <div ref={containerRef} className="max-w-[520px]">
      <canvas
        ref={canvasRef}
        width={canvasW}
        height={canvasH}
        style={{
          width: canvasCssW,
          height: canvasCssH,
          cursor: selectedPiece ? 'crosshair' : 'default',
        }}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouch}
        aria-label={label}
        role="img"
      />
    </div>
  )
}
