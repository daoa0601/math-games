import { useRef, useState } from 'react'
import { RotateCw, Check, X } from 'lucide-react'

import { Button } from '@math-games/ui'
import type { Rotation3D, RotationAxis } from '@math-games/game-shape-architect'

interface PlacementToolbarProps {
  pieceName: string
  rotation: Rotation3D
  show3DAxes?: boolean
  canPlace: boolean
  labels: {
    cancelPlacement: string
    placePiece: string
    rotatePiece: string
    rotatePieceAxis: string
  }
  onRotate: (axis?: RotationAxis) => void
  onPlace: () => void
  onCancel: () => void
}

interface PositionedPlacementToolbarProps {
  visible: boolean
  toolbarProps: Omit<PlacementToolbarProps, never>
  children: React.ReactNode
}

export function PositionedPlacementToolbar({
  visible,
  toolbarProps,
  children,
}: PositionedPlacementToolbarProps) {
  const boardRef = useRef<HTMLDivElement>(null)
  const [tapPoint, setTapPoint] = useState<{ x: number; y: number } | null>(
    null,
  )

  function handleBoardClick(e: React.MouseEvent) {
    const board = boardRef.current
    if (!board) return
    const rect = board.getBoundingClientRect()
    setTapPoint({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  return (
    <div
      ref={boardRef}
      className="relative mt-4 overflow-x-auto"
      onClick={handleBoardClick}
    >
      {children}

      {visible && tapPoint && (
        <div
          className="absolute z-10"
          style={{
            left: `clamp(0px, ${tapPoint.x}px - 5rem, calc(100% - 10rem))`,
            top: `clamp(0px, ${tapPoint.y + 12}px, calc(100% - 2.5rem))`,
          }}
        >
          <PlacementToolbar {...toolbarProps} />
        </div>
      )}
    </div>
  )
}

export function PlacementToolbar({
  pieceName,
  rotation,
  show3DAxes = false,
  canPlace,
  labels,
  onRotate,
  onPlace,
  onCancel,
}: PlacementToolbarProps) {
  const rotationLabel = show3DAxes
    ? `x${rotation.x} y${rotation.y} z${rotation.z}`
    : rotation.z > 0
      ? `${rotation.z}°`
      : ''

  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-border bg-card p-1.5 shadow-lg">
      <span className="px-2 text-xs font-medium text-muted-foreground">
        {pieceName} {rotationLabel}
      </span>
      {show3DAxes ? (
        (['x', 'y', 'z'] as const).map((axis) => (
          <Button
            key={axis}
            variant="ghost"
            size="icon-sm"
            onClick={() => onRotate(axis)}
            type="button"
            aria-label={`${labels.rotatePieceAxis} ${axis.toUpperCase()}`}
          >
            <span className="text-xs font-semibold uppercase">{axis}</span>
          </Button>
        ))
      ) : (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onRotate('z')}
          type="button"
          aria-label={labels.rotatePiece}
        >
          <RotateCw className="h-4 w-4" />
        </Button>
      )}
      <Button
        variant={canPlace ? 'default' : 'ghost'}
        size="icon-sm"
        onClick={onPlace}
        disabled={!canPlace}
        type="button"
        aria-label={labels.placePiece}
      >
        <Check className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onCancel}
        type="button"
        aria-label={labels.cancelPlacement}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}
